export type ReminderAppointment = { id: string; title: string; startsAt: string };
export type ReminderMilestone = { id: string; title: string; date?: string; eligible: boolean };

/** Notifications are unavailable in the browser prototype. */
export function isNotificationSupported() {
  return false;
}

export async function hasNotificationPermission() {
  return false;
}

export async function requestNotificationPermission() {
  return false;
}

export async function syncLocalReminders(
  _appointments: ReminderAppointment[],
  _milestones: ReminderMilestone[],
) {}

export async function cancelLocalReminder(_key: string) {}
