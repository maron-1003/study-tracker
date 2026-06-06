export default function RankingPage({ studyRecords }) {
  const getTodayRanking = () => {
    const today = new Date().toISOString().split("T")[0];

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

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">ランキング</h1>

      <RankingList title="今日のランキング" data={getTodayRanking()} />
      {/* 必要なら週・月ランキングも追加 */}
    </div>
  );
}
