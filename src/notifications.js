export const defaultNotificationSettings = {
  pomodoro: true,
  achievement: true,
  goal: true,
  reminder: true,
};

const storageKey = (userId) => `notificationSettings:${userId}`;

export const loadNotificationSettings = (userId) => {
  const saved = localStorage.getItem(storageKey(userId));
  return saved ? { ...defaultNotificationSettings, ...JSON.parse(saved) } : defaultNotificationSettings;
};

export const saveNotificationSettings = (userId, settings) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(settings));
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

  return permission === "granted";
};

export const sendBrowserNotification = async (title, body) => {
  const granted = await requestNotificationPermission();

  if (!granted) return false;
  new Notification(title, { body });
  return true;
};
