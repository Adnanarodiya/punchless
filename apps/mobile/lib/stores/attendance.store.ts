import { create } from "zustand";

type AttendanceStateType = "off_duty" | "workshop" | "travel" | "on_site_job";

type AttendanceState = {
  currentState: AttendanceStateType;
  workshopMinutes: number;
  travelMinutes: number;
  onsiteMinutes: number;
  totalMinutes: number;
  setSummary: (payload: {
    currentState: AttendanceStateType;
    workshopMinutes: number;
    travelMinutes: number;
    onsiteMinutes: number;
    totalMinutes: number;
  }) => void;
};

export const useAttendanceStore = create<AttendanceState>((set) => ({
  currentState: "off_duty",
  workshopMinutes: 0,
  travelMinutes: 0,
  onsiteMinutes: 0,
  totalMinutes: 0,
  setSummary: (payload) => set(payload),
}));
