import * as Notifications from 'expo-notifications';

export async function schedulePrayerNotification(
  topic: string,
  time: string,
  date: string
): Promise<string> {
  const [hours, minutes] = time.split(':').map(Number);
  const [year, month, day] = date.split('-').map(Number);
  
  const triggerDate = new Date(year, month - 1, day, hours, minutes);
  
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Prayer Reminder',
      body: `Time for your prayer: ${topic}`,
      sound: true,
    },
    trigger: triggerDate,
  });
  
  return notificationId;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
