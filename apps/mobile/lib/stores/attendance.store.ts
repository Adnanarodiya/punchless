import { create } from "zustand";

type AttendanceStateType = "off_duty" | "workshop" | "travel" | "on_site_job" | "break";

type AttendanceState = {
  currentState: AttendanceStateType;
  workshopMinutes: number;
  travelMinutes: number;
  onsiteMinutes: number;
  breakMinutes: number;
  totalMinutes: number;
  /** ISO timestamp when the current session started (for live counter) */
  currentSessionStart: string | null;
  setSummary: (payload: {
    currentState: AttendanceStateType;
    workshopMinutes: number;
    travelMinutes: number;
    onsiteMinutes: number;
    breakMinutes: number;
    totalMinutes: number;
    currentSessionStart: string | null;
  }) => void;
};

export const useAttendanceStore = create<AttendanceState>((set) => ({
  currentState: "off_duty",
  workshopMinutes: 0,
  travelMinutes: 0,
  onsiteMinutes: 0,
  breakMinutes: 0,
  totalMinutes: 0,
  currentSessionStart: null,
  setSummary: (payload) => set(payload),
}));
