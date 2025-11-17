import { Stack } from "expo-router";
import { PrayerProvider } from "../context/PrayerContext";

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch;
}

export default function RootLayout() {
  return (
    <PrayerProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PrayerProvider>
  );
}
