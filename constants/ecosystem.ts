/** Red Face Pty Ltd — ecosystem + public URLs (Prayer Reminder app). */

export const PARENT_COMPANY = 'Red Face Pty Ltd';
export const APP_NAME = 'Prayer Reminder';
export const APP_WEB_URL = 'https://prayerreminder.site';
export const REDFACE_HUB_URL = 'https://www.redface.co.za';

export const APP_STORE_URL = 'https://apps.apple.com/us/app/prayer-reminder/id6755526671';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.prayer.reminder.app';

export type RedFaceAppId = 'prayer' | 'services' | 'pay' | 'studio' | 'agency' | 'tours' | 'laundry';

export type EcosystemApp = {
  id: RedFaceAppId;
  name: string;
  url: string;
};

export const ECOSYSTEM_APPS: EcosystemApp[] = [
  { id: 'prayer', name: 'Prayer Reminder', url: APP_WEB_URL },
  { id: 'services', name: 'RedFace Services', url: 'https://www.redface.co.za' },
  { id: 'pay', name: 'RedFace Pay', url: 'https://www.redfacepay.co.za' },
  { id: 'studio', name: 'RedFace Studio', url: 'https://www.redfacestudio.com' },
  { id: 'agency', name: 'Red Face Agency', url: 'https://www.redface.in' },
  { id: 'tours', name: 'Red Face Tours', url: 'https://redfacetours.co.za' },
  { id: 'laundry', name: 'RF Laundry', url: 'https://rflaundry.co.za' },
];

export const ECOSYSTEM_SIBLING_APPS = ECOSYSTEM_APPS.filter((a) => a.id !== 'prayer');

/** App Store + Google Play use the same lead-in line for visual alignment. */
export const STORE_BADGE_LEAD = 'Get it on';
