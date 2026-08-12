import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { getStreakStats } from "./streaks";

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RankingPage({ user }) {
  const [tab, setTab] = useState("today");
  const [records, setRecords] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRankingData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const [{ data: recordData, error: recordError }, { data: usersData, error: usersError }] =
      await Promise.all([
        supabase.from("study_records").select("user_id, minutes, date"),
        supabase.from("users").select("id, nickname"),
      ]);

    if (recordError || usersError) {
      setErrorMessage("ランキングを読み込めませんでした。権限設定を確認してください。");
      setIsLoading(false);
      return;
    }

    setRecords(recordData ?? []);
    setUserMap(
      Object.fromEntries((usersData ?? []).map(({ id, nickname }) => [id, nickname]))
    );
    setIsLoading(false);
  };

  useEffect(() => {
    loadRankingData();
  }, []);

  const ranking = useMemo(() => {
    const today = new Date();
    const todayString = toDateString(today);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekStartString = toDateString(weekStart);
    const monthString = todayString.slice(0, 7);

    const totals = records.reduce((result, record) => {
      const isIncluded =
        (tab === "today" && record.date === todayString) ||
        (tab === "week" && record.date >= weekStartString && record.date <= todayString) ||
        (tab === "month" && record.date.startsWith(monthString) && record.date <= todayString);

      if (isIncluded) {
        result[record.user_id] = (result[record.user_id] ?? 0) + record.minutes;
      }
      return result;
    }, {});

    return Object.entries(totals)
      .map(([userId, minutes]) => ({ userId, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [records, tab]);

  const myRank = ranking.findIndex((item) => item.userId === user.id) + 1;
  const streaksByUser = useMemo(() => {
    const recordsByUser = records.reduce((result, record) => {
      (result[record.user_id] ??= []).push(record);
      return result;
    }, {});

    return Object.fromEntries(
      Object.entries(recordsByUser).map(([userId, userRecords]) => [
        userId,
        getStreakStats(userRecords),
      ])
    );
  }, [records]);
  const labels = { today: "今日", week: "過去7日間", month: "今月" };

  return (
    <div className="w-full max-w-5xl mx-auto text-white flex gap-6">
      <aside className="w-40 flex flex-col gap-3 border-r border-gray-700 pr-4">
        {Object.entries(labels).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`text-left px-3 py-2 rounded ${
              tab === value
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={loadRankingData}
          className="mt-3 text-left px-3 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          更新
        </button>
      </aside>

      <main className="flex-1">
        <h1 className="text-3xl font-bold mb-2">{labels[tab]}のランキング</h1>
        <p className="text-gray-400 mb-6">
          {myRank ? `あなたの順位: ${myRank}位` : "この期間のあなたの記録はまだありません"}
        </p>

        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          {isLoading && <p className="text-gray-400">読み込み中...</p>}
          {!isLoading && errorMessage && <p className="text-red-400">{errorMessage}</p>}
          {!isLoading && !errorMessage && ranking.length === 0 && (
            <p className="text-gray-400">この期間の記録はまだありません</p>
          )}
          {!isLoading && !errorMessage && ranking.map((item, index) => (
            <div
              key={item.userId}
              className={`flex justify-between p-3 border-b border-gray-700 ${
                item.userId === user.id ? "bg-blue-900/40" : ""
              }`}
            >
              <span>{index + 1}位</span>
              <span>{userMap[item.userId] ?? "名無し"}</span>
              <span className="text-orange-300">
                🔥 {streaksByUser[item.userId]?.currentStreak ?? 0}日連続
              </span>
              <span>{item.minutes}分</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
