import { useState } from "react";

export default function RankingPage({ studyRecords }) {
  const [tab, setTab] = useState("today");

  const today = new Date().toISOString().split("T")[0];

  // ▼ 今日のランキング
  const getTodayRanking = () => {
    return Object.entries(studyRecords)
      .map(([user, records]) => {
        const total = records
          .filter(r => r.date === today)
          .reduce((sum, r) => sum + r.minutes, 0);
        return { user, minutes: total };
      })
      .filter(item => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  };

  // ▼ 週間ランキング
  const getWeeklyRanking = () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);

    return Object.entries(studyRecords)
      .map(([user, records]) => {
        const total = records
          .filter(r => {
            const d = new Date(r.date);
            return d >= weekAgo && d <= now;
          })
          .reduce((sum, r) => sum + r.minutes, 0);
        return { user, minutes: total };
      })
      .filter(item => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  };

  // ▼ 月間ランキング
  const getMonthlyRanking = () => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 29);

    return Object.entries(studyRecords)
      .map(([user, records]) => {
        const total = records
          .filter(r => {
            const d = new Date(r.date);
            return d >= monthAgo && d <= now;
          })
          .reduce((sum, r) => sum + r.minutes, 0);
        return { user, minutes: total };
      })
      .filter(item => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  };

  const ranking =
    tab === "today"
      ? getTodayRanking()
      : tab === "week"
      ? getWeeklyRanking()
      : getMonthlyRanking();

  return (
    <div className="w-full max-w-3xl mx-auto text-white">

      {/* ▼ ランキングタブ */}
      <div className="flex gap-6 mb-6 border-b border-gray-700 pb-2">
        <button
          onClick={() => setTab("today")}
          className={`pb-2 ${
            tab === "today"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400"
          }`}
        >
          今日
        </button>

        <button
          onClick={() => setTab("week")}
          className={`pb-2 ${
            tab === "week"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400"
          }`}
        >
          週間
        </button>

        <button
          onClick={() => setTab("month")}
          className={`pb-2 ${
            tab === "month"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400"
          }`}
        >
          月間
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">
        {tab === "today"
          ? "今日のランキング"
          : tab === "week"
          ? "週間ランキング"
          : "月間ランキング"}
      </h1>

      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        {ranking.length === 0 && (
          <p className="text-gray-400">まだ記録がありません</p>
        )}

        {ranking.map((item, index) => (
          <div
            key={index}
            className="flex justify-between p-3 border-b border-gray-700"
          >
            <span>{index + 1}位</span>
            <span>{item.user}</span>
            <span>{item.minutes}分</span>
          </div>
        ))}
      </div>
    </div>
  );
}
