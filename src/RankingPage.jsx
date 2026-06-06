import { useState } from "react";

export default function RankingPage({ studyRecords, userMap, resetMyRanking }) {
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

  // ▼ 月間ランキング（その月の1日〜末日）
  const getMonthlyRanking = () => {
    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7); // "YYYY-MM"

    return Object.entries(studyRecords)
      .map(([user, records]) => {
        const total = records
          .filter(r => {
            const dateStr =
              typeof r.date === "string"
                ? r.date
                : new Date(r.date).toISOString().slice(0, 10);

            return dateStr.startsWith(monthStr);
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
    <div className="w-full max-w-5xl mx-auto text-white flex gap-6">

      {/* ▼ 縦タブ */}
      <div className="w-40 flex flex-col gap-3 border-r border-gray-700 pr-4">

        <button
          onClick={() => setTab("today")}
          className={`text-left px-3 py-2 rounded ${
            tab === "today"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          今日
        </button>

        <button
          onClick={() => setTab("week")}
          className={`text-left px-3 py-2 rounded ${
            tab === "week"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          週間
        </button>

        <button
          onClick={() => setTab("month")}
          className={`text-left px-3 py-2 rounded ${
            tab === "month"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          月間
        </button>

        {/* ▼ リセットボタン */}
        <button
          onClick={resetMyRanking}
          className="mt-6 text-left px-3 py-2 rounded bg-red-600 hover:bg-red-700"
        >
          自分のランキングをリセット
        </button>

      </div>

      {/* ▼ ランキング内容 */}
      <div className="flex-1">

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
              <span>{userMap[item.user] || item.user}</span>
              <span>{item.minutes}分</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
