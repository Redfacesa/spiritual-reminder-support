import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const isWeb = Platform.OS === 'web';

// Show alerts even when the app is foregrounded.
if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

let permissionChecked = false;
let permissionGranted = false;

export async function requestPermissions(): Promise<boolean> {
  if (isWeb) return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    permissionChecked = true;
    permissionGranted = status === 'granted';

    if (permissionGranted && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer-reminders', {
        name: 'Prayer Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    return permissionGranted;
  } catch {
    return false;
  }
}

async function ensurePermission(): Promise<boolean> {
  if (isWeb) return false;
  if (permissionChecked) return permissionGranted;
  return requestPermissions();
}

interface ScheduleArgs {
  topic: string;
  time: string; // HH:MM
  date?: string; // YYYY-MM-DD (ignored when recurring)
  recurring?: boolean;
  sound?: boolean;
}

/**
 * Schedules a prayer reminder. Returns the notification id, or null if it
 * couldn't be scheduled (web, denied permission, or a time in the past).
 */
export async function schedulePrayerReminder({
  topic,
  time,
  date,
  recurring,
  sound = true,
}: ScheduleArgs): Promise<string | null> {
  if (isWeb) return null;
  const granted = await ensurePermission();
  if (!granted) return null;

  const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const content = {
    title: 'Prayer Reminder',
    body: `Time to pray: ${topic}`,
    sound,
  };

  try {
    if (recurring) {
      return await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    }

    const [year, month, day] = (date || '').split('-').map((n) => parseInt(n, 10));
    const triggerDate =
      year && month && day
        ? new Date(year, month - 1, day, hours, minutes)
        : new Date();
    if (!date) triggerDate.setHours(hours, minutes, 0, 0);

    // Don't schedule something in the past.
    if (triggerDate.getTime() <= Date.now()) return null;

    return await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  } catch {
    return null;
  }
}

/**
 * Schedules a reminder that repeats weekly on a given weekday.
 * weekday: 1 = Sunday ... 7 = Saturday (Expo convention).
 * Returns the notification id, or null if it couldn't be scheduled.
 */
export async function scheduleWeeklyReminder({
  topic,
  weekday,
  time,
  sound = true,
}: {
  topic: string;
  weekday: number;
  time: string; // HH:MM
  sound?: boolean;
}): Promise<string | null> {
  if (isWeb) return null;
  const granted = await ensurePermission();
  if (!granted) return null;

  const [hours, minutes] = time.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Prayer Planner', body: topic, sound },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: hours,
        minute: minutes,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  if (isWeb || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // already fired / cancelled — ignore
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (isWeb) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}
