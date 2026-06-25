import { getTodayAttendanceSummary } from "@/lib/services/attendance.service";
import { useAttendanceStore } from "@/lib/stores/attendance.store";
import { useOfflineStore } from "@/lib/stores/offline.store";

export async function syncOfflineQueueAndRefresh(
  employeeId?: string
): Promise<boolean> {
  const synced = await useOfflineStore.getState().syncQueue();

  if (employeeId) {
    try {
      const summary = await getTodayAttendanceSummary(employeeId);
      useAttendanceStore.getState().setSummary(summary);
    } catch (err) {
      console.warn("Failed to refresh attendance after sync:", err);
    }
  }

  return synced;
}