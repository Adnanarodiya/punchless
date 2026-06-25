import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabase";

export type QueuedAction = {
  id: string;
  actionType: "open_session" | "close_session" | "update_job_status";
  payload: Record<string, unknown>;
  timestamp: string;
};

type OfflineState = {
  queue: QueuedAction[];
  syncing: boolean;
  addToQueue: (
    actionType: QueuedAction["actionType"],
    payload: Record<string, unknown>
  ) => Promise<void>;
  syncQueue: () => Promise<boolean>;
  loadQueue: () => Promise<void>;
};

const QUEUE_STORAGE_KEY = "punchless_offline_queue";

export const useOfflineStore = create<OfflineState>((set, get) => ({
  queue: [],
  syncing: false,

  loadQueue: async () => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        set({ queue: JSON.parse(stored) as QueuedAction[] });
      }
    } catch (err) {
      console.error("Failed to load offline queue:", err);
    }
  },

  addToQueue: async (actionType, payload) => {
    const newAction: QueuedAction = {
      id: Math.random().toString(36).substring(2, 9),
      actionType,
      payload,
      timestamp: new Date().toISOString(),
    };

    const updatedQueue = [...get().queue, newAction];
    set({ queue: updatedQueue });

    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
    } catch (err) {
      console.error("Failed to persist offline queue:", err);
    }
  },

  syncQueue: async () => {
    const { queue } = get();
    if (queue.length === 0) return true;

    set({ syncing: true });
    console.log(`Syncing ${queue.length} offline actions to Supabase...`);

    const failedActions: QueuedAction[] = [];
    const localToServer: Record<string, string> = {};

    for (const action of queue) {
      try {
        if (action.actionType === "open_session") {
          const employeeId = String(action.payload.employeeId ?? "");
          const companyId = String(action.payload.companyId ?? "");
          const state = String(action.payload.state ?? "workshop");
          const workshopId = action.payload.workshopId as string | null;
          const jobId = action.payload.jobId as string | null;
          const localSessionId = action.payload.localSessionId as string | undefined;

          const { data, error } = await supabase
            .from("attendance_sessions")
            .insert({
              employee_id: employeeId,
              company_id: companyId,
              state,
              workshop_id: workshopId,
              job_id: jobId,
              start_time: action.timestamp,
            })
            .select("id")
            .single();

          if (error) throw error;
          if (localSessionId && data?.id) {
            localToServer[localSessionId] = data.id;
          }
        } else if (action.actionType === "close_session") {
          const sessionId = action.payload.sessionId as string | null;
          const localSessionId = action.payload.localSessionId as string | null;
          const durationMinutes = Number(action.payload.durationMinutes ?? 0);
          const startTime = String(action.payload.startTime ?? action.timestamp);

          const resolvedId =
            sessionId ??
            (localSessionId ? localToServer[localSessionId] : null);

          if (!resolvedId) {
            failedActions.push(action);
            continue;
          }

          const { error } = await supabase
            .from("attendance_sessions")
            .update({
              end_time: action.timestamp,
              duration_minutes: durationMinutes,
              start_time: startTime,
            })
            .eq("id", resolvedId);

          if (error) throw error;
        } else if (action.actionType === "update_job_status") {
          const jobId = String(action.payload.jobId ?? "");
          const status = String(action.payload.status ?? "");

          const { error } = await supabase
            .from("jobs")
            .update({
              status,
              updated_at: action.timestamp,
            })
            .eq("id", jobId);

          if (error) throw error;
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown sync error";
        console.error(
          `Failed to sync action ${action.id} (${action.actionType}):`,
          message
        );
        failedActions.push(action);
      }
    }

    set({ queue: failedActions, syncing: false });
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(failedActions));
    } catch (err) {
      console.error("Failed to save updated offline queue:", err);
    }

    return failedActions.length === 0;
  },
}));