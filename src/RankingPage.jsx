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

  const ranking = getTodayRanking();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">今日のランキング</h1>

      <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
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
