import { getStreakStats } from "./streaks";

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAchievements = ({ records, goalSubject, dailyGoal }) => {
  const totalMinutes = records.reduce((sum, record) => sum + record.minutes, 0);
  const streak = getStreakStats(records);
  const today = toDateString(new Date());
  const todayGoalMinutes = records
    .filter((record) => record.date === today && record.type === goalSubject)
    .reduce((sum, record) => sum + record.minutes, 0);

  return [
    { id: "first-record", icon: "🌱", name: "はじめの一歩", description: "初めて勉強を記録する", earned: records.length > 0 },
    { id: "streak-3", icon: "🔥", name: "3日連続", description: "3日連続で勉強する", earned: streak.bestStreak >= 3 },
    { id: "streak-7", icon: "🏆", name: "1週間継続", description: "7日連続で勉強する", earned: streak.bestStreak >= 7 },
    { id: "total-10-hours", icon: "⏱️", name: "10時間達成", description: "累計10時間勉強する", earned: totalMinutes >= 600 },
    { id: "daily-goal", icon: "🎯", name: "目標クリア", description: "日次目標を初めて達成する", earned: todayGoalMinutes >= dailyGoal },
  ];
};

export const getLevelInfo = (records) => {
  const totalMinutes = records.reduce((sum, record) => sum + record.minutes, 0);
  const totalHours = totalMinutes / 60;

  let level = 1;
  let title = "基礎学習者";
  let icon = "🌱";

  if (totalHours >= 30) {
    level = 3;
    title = "目標達成者";
    icon = "🏆";
  } else if (totalHours >= 10) {
    level = 2;
    title = "継続型";
    icon = "🔥";
  }

  const nextLevelMinutes = level === 1 ? 600 : level === 2 ? 1800 : null;
  const progress = nextLevelMinutes ? Math.min((totalMinutes / nextLevelMinutes) * 100, 100) : 100;

  return {
    level,
    title,
    icon,
    totalMinutes,
    totalHours,
    nextLevelMinutes,
    progress,
  };
};
