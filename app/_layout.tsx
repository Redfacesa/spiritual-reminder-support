import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { PrayerProvider } from '../context/PrayerContext';
import { UserProvider } from '../context/UserContext';
import { ReadingPlanProvider } from '../context/ReadingPlanContext';

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <PrayerProvider>
            <ReadingPlanProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="reading-plan" options={{ presentation: 'card' }} />
                <Stack.Screen name="settings" options={{ presentation: 'card' }} />
                <Stack.Screen name="sermons" options={{ presentation: 'card' }} />
              </Stack>
            </ReadingPlanProvider>
          </PrayerProvider>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
