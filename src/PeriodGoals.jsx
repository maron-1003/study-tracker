import { useMemo, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

const storageKey = (userId) => `periodGoals:${userId}`;

const minutesLabel = (minutes) => {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}時間`;
  return `${minutes}分`;
};

const getRange = (date, period) => {
  const selected = dayjs(date);
  const start = period === "week" ? selected.startOf("isoWeek") : selected.startOf("month");
  const end = period === "week" ? selected.endOf("isoWeek") : selected.endOf("month");
  return { start: start.format("YYYY-MM-DD"), end: end.format("YYYY-MM-DD") };
};

export default function PeriodGoals({ userId, subjects, records, selectedDate }) {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem(storageKey(userId));
    return saved ? JSON.parse(saved) : [];
  });
  const [subject, setSubject] = useState(() => subjects[0] ?? "");
  const [period, setPeriod] = useState("week");
  const [targetMinutes, setTargetMinutes] = useState(300);

  const updateGoals = (nextGoals) => {
    setGoals(nextGoals);
    localStorage.setItem(storageKey(userId), JSON.stringify(nextGoals));
  };

  const addGoal = () => {
    const minutes = Number(targetMinutes);
    if (!subject || !Number.isFinite(minutes) || minutes <= 0) return;

    const goal = { id: `${subject}-${period}`, subject, period, targetMinutes: minutes };
    const withoutSameGoal = goals.filter(
      (item) => item.subject !== subject || item.period !== period
    );
    updateGoals([...withoutSameGoal, goal]);
  };

  const goalProgress = useMemo(
    () => goals.map((goal) => {
      const range = getRange(selectedDate, goal.period);
      const actualMinutes = records
        .filter(
          (record) =>
            record.type === goal.subject && record.date >= range.start && record.date <= range.end
        )
        .reduce((sum, record) => sum + record.minutes, 0);
      return { ...goal, actualMinutes, remaining: Math.max(goal.targetMinutes - actualMinutes, 0) };
    }),
    [goals, records, selectedDate]
  );

  return (
    <section className="w-full max-w-6xl rounded-xl bg-gray-800 p-5 shadow-lg">
      <h2 className="text-xl font-bold text-violet-300">科目別・期間目標</h2>
      <p className="mb-4 text-sm text-gray-400">選択中の日付を基準に、目標との差分を表示します。</p>

      <div className="grid gap-2 md:grid-cols-[1fr_140px_150px_auto]">
        <select value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded bg-gray-700 p-2">
          {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded bg-gray-700 p-2">
          <option value="week">今週ごと</option>
          <option value="month">今月ごと</option>
        </select>
        <input
          type="number"
          min="1"
          value={targetMinutes}
          onChange={(event) => setTargetMinutes(event.target.value)}
          className="rounded bg-gray-700 p-2"
          aria-label="目標時間（分）"
        />
        <button onClick={addGoal} className="rounded bg-violet-600 px-4 py-2 font-bold hover:bg-violet-700">
          目標を保存
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400">目標時間は分で入力します（例: 300分、20時間なら1200分）。</p>

      <div className="mt-5 space-y-3">
        {goalProgress.length === 0 && <p className="text-gray-400">まだ期間目標がありません。</p>}
        {goalProgress.map((goal) => {
          const percent = Math.min((goal.actualMinutes / goal.targetMinutes) * 100, 100);
          return (
            <div key={goal.id} className="rounded-lg bg-gray-700 p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-bold">{goal.subject}・{goal.period === "week" ? "週間" : "月間"}目標</p>
                <button
                  onClick={() => updateGoals(goals.filter((item) => item.id !== goal.id))}
                  className="text-sm text-red-300 hover:text-red-200"
                >
                  削除
                </button>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded bg-gray-600">
                <div className="h-full rounded bg-violet-500" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-sm">
                {minutesLabel(goal.actualMinutes)} / {minutesLabel(goal.targetMinutes)}
                {goal.remaining > 0 ? ` ・あと${minutesLabel(goal.remaining)}` : " ・達成！"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
