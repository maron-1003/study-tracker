export const defaultNotificationSettings = {
  pomodoro: false,
  achievement: false,
  goal: false,
  reminder: false,
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
  if (!("Notification" in window) || typeof Notification.requestPermission !== "function") {
    return false;
  }

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

  return permission === "granted";
};

export const getNotificationPermissionState = () => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
};

export const sendBrowserNotification = async (title, body) => {
  if (!("Notification" in window)) return false;

  const permission = Notification.permission;
  if (permission !== "granted") {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  try {
    new Notification(title, { body });
    return true;
  } catch (error) {
    console.warn("通知送信に失敗しました:", error);
    return false;
  }
};
