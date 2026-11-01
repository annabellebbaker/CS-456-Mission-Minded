import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

export type ReminderAppointment = { id: string; title: string; startsAt: string };
export type ReminderMilestone = { id: string; title: string; date?: string; eligible: boolean };

const reminderPrefix = 'missionminded:';
const oneDayMs = 24 * 60 * 60 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function isNotificationSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function isGranted(settings: Notifications.NotificationPermissionsStatus) {
  return settings.granted
    || (Platform.OS === 'ios' && settings.ios?.status === IosAuthorizationStatus.PROVISIONAL);
}

export async function hasNotificationPermission() {
  const settings = await Notifications.getPermissionsAsync();
  return isGranted(settings);
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Mission reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (isGranted(current)) return true;
  const result = await Notifications.requestPermissionsAsync();
  return isGranted(result);
}

function getAppointmentReminder(appointment: ReminderAppointment) {
  const appointmentDate = new Date(appointment.startsAt);
  if (Number.isNaN(appointmentDate.getTime())) return undefined;
  const triggerAt = new Date(appointmentDate.getTime() - oneDayMs);
  if (triggerAt.getTime() <= Date.now()) return undefined;
  return {
    key: `${reminderPrefix}appointment:${appointment.id}`,
    title: `Tomorrow: ${appointment.title}`,
    body: `Your appointment is tomorrow at ${appointmentDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}.`,
    triggerAt,
  };
}

function getMilestoneReminder(milestone: ReminderMilestone) {
  if (!milestone.eligible || !milestone.date) return undefined;
  const match = milestone.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const milestoneDate = new Date(year, month - 1, day);
  if (milestoneDate.getFullYear() !== year || milestoneDate.getMonth() !== month - 1 || milestoneDate.getDate() !== day) {
    return undefined;
  }
  const triggerAt = new Date(year, month - 1, day, 9, 0);
  triggerAt.setDate(triggerAt.getDate() - 1);
  if (triggerAt.getTime() <= Date.now()) return undefined;
  return {
    key: `${reminderPrefix}milestone:${milestone.id}`,
    title: 'A milestone is coming up',
    body: `${milestone.title} is scheduled for tomorrow.`,
    triggerAt,
  };
}

export async function syncLocalReminders(
  appointments: ReminderAppointment[],
  milestones: ReminderMilestone[],
) {
  const desired = [
    ...appointments.map(getAppointmentReminder),
    ...milestones.map(getMilestoneReminder),
  ].filter((item): item is NonNullable<typeof item> => item !== undefined);
  const desiredByKey = new Map(desired.map((reminder) => [reminder.key, reminder]));
  const knownKeys = new Set([
    ...appointments.map((appointment) => `${reminderPrefix}appointment:${appointment.id}`),
    ...milestones.filter((milestone) => milestone.date)
      .map((milestone) => `${reminderPrefix}milestone:${milestone.id}`),
  ]);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existingByKey = new Map<string, (typeof scheduled)[number]>();

  for (const request of scheduled) {
    const key = request.content.data?.reminderKey;
    if (typeof key === 'string' && key.startsWith(reminderPrefix)) {
      existingByKey.set(key, request);
    }
  }

  for (const [key, request] of existingByKey) {
    const desiredReminder = desiredByKey.get(key);
    const savedTriggerAt = request.content.data?.triggerAt;
    if ((!desiredReminder && knownKeys.has(key))
      || (desiredReminder && savedTriggerAt !== desiredReminder.triggerAt.toISOString())) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      existingByKey.delete(key);
    }
  }

  for (const [key, reminder] of desiredByKey) {
    if (existingByKey.has(key)) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { reminderKey: key, triggerAt: reminder.triggerAt.toISOString() },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.triggerAt,
      },
    });
  }
}

export async function cancelLocalReminder(key: string) {
  const reminderKey = `${reminderPrefix}${key}`;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const matches = scheduled.filter((request) => request.content.data?.reminderKey === reminderKey);
  await Promise.all(matches.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
}
