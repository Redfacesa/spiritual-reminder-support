# Prayer Reminder & Spiritual Guide AI

A beautiful, multi-faith spiritual companion app built with React Native and Expo. Support for Christianity, Islam, Judaism, Hinduism, Buddhism, and General Spiritual practices.

## Features

### 🙏 Multi-Faith Support
- 6 major faith traditions supported
- Respectful, inclusive approach to all beliefs
- Custom sacred texts and teachings for each tradition

### 📱 Core Functionality
- **Prayer Requests**: Create and manage prayer/meditation requests
- **Reminders**: Schedule notifications for prayer times
- **Sacred Library**: Browse verses and teachings from your tradition
- **Spiritual Guidance**: Get contextual guidance with verses, explanations, and prayers
- **Statistics**: Track your spiritual journey with prayer counts and streaks

### 🎨 Beautiful Design
- Serene gradient backgrounds
- Card-based layout with soft shadows
- Elegant typography for sacred texts
- Smooth animations and transitions
- Mobile-first responsive design

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Notifications**: Expo Notifications
- **State Management**: React Context API
- **Icons**: Expo Vector Icons (Ionicons)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on your device:
- Scan the QR code with Expo Go (Android) or Camera app (iOS)
- Or press 'a' for Android emulator, 'i' for iOS simulator

## App Structure

- `/app/(tabs)` - Main tab screens (Home, Prayers, Library, Guidance, Profile)
- `/components` - Reusable UI components
- `/constants` - Faith data, sacred texts, guidance examples
- `/context` - Prayer state management
- `/utils` - Notification helpers

## Notification Setup

The app requests notification permissions on first use. Users can:
- Schedule prayer reminders at specific times
- Receive notifications for recurring prayers
- Enable/disable notifications in Profile settings

## Customization

### Adding New Faith Traditions
Edit `constants/faithData.ts` to add new traditions with custom colors and imagery.

### Adding Sacred Texts
Expand `constants/sacredTexts.ts` with verses and teachings.

### Creating Guidance Content
Add new guidance examples in `constants/guidanceData.ts`.

## Privacy & Respect

This app is designed with deep respect for all spiritual traditions. It:
- Never compares or ranks religions
- Provides authentic teachings from each tradition
- Maintains a compassionate, non-judgmental tone
- Supports users in their chosen path

## License

MIT License - Feel free to use and modify for your spiritual journey.
