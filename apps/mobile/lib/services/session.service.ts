import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabase";
import { useOfflineStore } from "@/lib/stores/offline.store";
import type { EngineState } from "@/lib/types/attendance-engine";

export type ActiveSession = {
  id: string;
  state: EngineState;
  workshop_id: string | null;
  job_id: string | null;
  start_time: string;
  isLocal: boolean;
};

const ACTIVE_SESSION_KEY = "punchless_active_session_cache";

function createLocalSessionId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function cacheActiveSession(session: ActiveSession | null): Promise<void> {
  if (!session) {
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
    return;
  }
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

async function readCachedActiveSession(): Promise<ActiveSession | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSession;
  } catch {
    return null;
  }
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("failed to fetch") ||
    message.includes("timeout")
  );
}

export async function getActiveSession(
  employeeId: string
): Promise<ActiveSession | null> {
  try {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("id, state, workshop_id, job_id, start_time")
      .eq("employee_id", employeeId)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      await cacheActiveSession(null);
      return null;
    }

    const session: ActiveSession = {
      id: data.id,
      state: data.state as EngineState,
      workshop_id: data.workshop_id,
      job_id: data.job_id,
      start_time: data.start_time,
      isLocal: false,
    };
    await cacheActiveSession(session);
    return session;
  } catch (err) {
    console.warn("getActiveSession fell back to cache:", err);
    return readCachedActiveSession();
  }
}

export async function openAttendanceSession(params: {
  employeeId: string;
  companyId: string;
  state: EngineState;
  workshopId?: string | null;
  jobId?: string | null;
}): Promise<string | null> {
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .insert({
        employee_id: params.employeeId,
        company_id: params.companyId,
        state: params.state,
        workshop_id: params.workshopId ?? null,
        job_id: params.jobId ?? null,
        start_time: now,
      })
      .select("id, state, workshop_id, job_id, start_time")
      .single();

    if (error) throw error;
    if (!data?.id) return null;

    await cacheActiveSession({
      id: data.id,
      state: data.state as EngineState,
      workshop_id: data.workshop_id,
      job_id: data.job_id,
      start_time: data.start_time,
      isLocal: false,
    });

    return data.id;
  } catch (err) {
    if (!isNetworkError(err)) {
      console.error("Failed to open session:", err);
      return null;
    }

    const localSessionId = createLocalSessionId();
    const cached: ActiveSession = {
      id: localSessionId,
      state: params.state,
      workshop_id: params.workshopId ?? null,
      job_id: params.jobId ?? null,
      start_time: now,
      isLocal: true,
    };

    await cacheActiveSession(cached);
    await useOfflineStore.getState().addToQueue("open_session", {
      localSessionId,
      employeeId: params.employeeId,
      companyId: params.companyId,
      state: params.state,
      workshopId: params.workshopId ?? null,
      jobId: params.jobId ?? null,
    });

    return localSessionId;
  }
}

export async function closeAttendanceSession(
  sessionId: string,
  startTime?: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const startMs = new Date(startTime ?? now).getTime();
  const durationMinutes = Math.max(
    0,
    Math.round((new Date(now).getTime() - startMs) / 60000)
  );

  const isLocal = sessionId.startsWith("local_");

  try {
    if (!isLocal) {
      const { error } = await supabase
        .from("attendance_sessions")
        .update({
          end_time: now,
          duration_minutes: durationMinutes,
        })
        .eq("id", sessionId);

      if (error) throw error;
    }

    await cacheActiveSession(null);
    return true;
  } catch (err) {
    if (!isNetworkError(err) && !isLocal) {
      console.error("Failed to close session:", err);
      return false;
    }

    await cacheActiveSession(null);
    await useOfflineStore.getState().addToQueue("close_session", {
      sessionId: isLocal ? null : sessionId,
      localSessionId: isLocal ? sessionId : null,
      durationMinutes,
      startTime: startTime ?? now,
    });

    return true;
  }
}