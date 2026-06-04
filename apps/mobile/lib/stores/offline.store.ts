import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export type QueuedAction = {
  id: string;
  actionType: "open_session" | "close_session" | "update_job_status";
  payload: any;
  timestamp: string;
};

type OfflineState = {
  queue: QueuedAction[];
  addToQueue: (actionType: QueuedAction["actionType"], payload: any) => Promise<void>;
  syncQueue: () => Promise<boolean>;
  loadQueue: () => Promise<void>;
};

const QUEUE_STORAGE_KEY = "punchless_offline_queue";

export const useOfflineStore = create<OfflineState>((set, get) => ({
  queue: [],

  loadQueue: async () => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        set({ queue: JSON.parse(stored) });
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

    console.log(`Syncing ${queue.length} offline actions to Supabase...`);

    const failedActions: QueuedAction[] = [];

    for (const action of queue) {
      try {
        if (action.actionType === "open_session") {
          const { employeeId, companyId, state, workshopId, jobId } = action.payload;
          const { error } = await supabase.from("attendance_sessions").insert({
            employee_id: employeeId,
            company_id: companyId,
            state,
            workshop_id: workshopId || null,
            job_id: jobId || null,
            start_time: action.timestamp, // Maintain original offline timestamp
          });
          if (error) throw error;
        } else if (action.actionType === "close_session") {
          const { sessionId, durationMinutes } = action.payload;
          const { error } = await supabase
            .from("attendance_sessions")
            .update({
              end_time: action.timestamp,
              duration_minutes: durationMinutes,
            })
            .eq("id", sessionId);
          if (error) throw error;
        } else if (action.actionType === "update_job_status") {
          const { jobId, status } = action.payload;
          const { error } = await supabase
            .from("jobs")
            .update({
              status,
              updated_at: action.timestamp,
            })
            .eq("id", jobId);
          if (error) throw error;
        }
      } catch (err: any) {
        console.error(`Failed to sync action ${action.id} (${action.actionType}):`, err.message);
        failedActions.push(action);
      }
    }

    set({ queue: failedActions });
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(failedActions));
    } catch (err) {
      console.error("Failed to save updated offline queue:", err);
    }

    return failedActions.length === 0;
  },
}));
