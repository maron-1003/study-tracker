const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const previousDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return toLocalDateString(date);
};

export const getStreakStats = (records, today = new Date()) => {
  const todayString = toLocalDateString(today);
  const studyDates = new Set(
    records
      .map((record) => record.date)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= todayString)
  );

  const sortedDates = [...studyDates].sort();
  let bestStreak = 0;
  let runningStreak = 0;
  let previous = null;

  sortedDates.forEach((date) => {
    runningStreak = previous === previousDate(date) ? runningStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, runningStreak);
    previous = date;
  });

  let currentStreak = 0;
  let cursor = todayString;
  while (studyDates.has(cursor)) {
    currentStreak += 1;
    cursor = previousDate(cursor);
  }

  return { currentStreak, bestStreak };
};
