import { useState, useEffect, useRef } from "react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { supabase } from "./supabaseClient";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

dayjs.extend(isoWeek);

const baseSubjects = ["国語", "数学", "英語", "理科", "社会"];

function getWeekNumber(date) {
  return dayjs(date).isoWeek();
}

function getWeeklyChartData(records) {
  const weekly = {};
  records.forEach((r) => {
    const week = getWeekNumber(r.date);
    if (!weekly[week]) weekly[week] = 0;
    weekly[week] += r.minutes;
  });
  return weekly;
}

function getDailyTotals(records) {
  const daily = {};
  records.forEach((r) => {
    if (!daily[r.date]) daily[r.date] = 0;
    daily[r.date] += r.minutes;
  });
  return daily;
}

export default function StudyTracker({ user, onLogout }) {
  const [studyType, setStudyType] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [records, setRecords] = useState([]);

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  const [subjects, setSubjects] = useState(baseSubjects);
  const [newSubject, setNewSubject] = useState("");

  const [dailyMemo, setDailyMemo] = useState({});
  const [subjectMemo, setSubjectMemo] = useState({});

  const [isGoalSettingOpen, setIsGoalSettingOpen] = useState(false);
  const [goalAchieved, setGoalAchieved] = useState(false);

  const [goalSubject, setGoalSubject] = useState(
    localStorage.getItem("goalSubject") || ""
  );

  const [dailyGoal, setDailyGoal] = useState(
    Number(localStorage.getItem("dailyGoal")) || 120
  );

  const timerRef = useRef(null);


  // 勉強記録を読み込み
  useEffect(() => {
    if (!user) return;

    const loadRecords = async () => {
      const { data, error } = await supabase
        .from("study_records")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const converted = data.map((r) => ({
          type: r.subject,
          minutes: r.minutes,
          date: r.date,
          start: r.start || "--",
          end: r.end || "--",
          fullDate: r.created_at,
        }));
        setRecords(converted);
      }
    };

    loadRecords();
  }, [user]);

  // subjects を読み込み
  useEffect(() => {
    if (!user) return;

    const loadSubjects = async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .eq("deleted", false);

      if (!error && data) {
        const custom = data.map((s) => s.name);
        setSubjects([...baseSubjects, ...custom]);
      }
    };

    loadSubjects();
  }, [user]);

  // dailyMemo を読み込み
  useEffect(() => {
    if (!user) return;

    const loadDailyMemo = async () => {
      const { data, error } = await supabase
        .from("daily_memo")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        const memoObj = {};
        data.forEach((m) => {
          memoObj[m.date] = m.memo;
        });
        setDailyMemo(memoObj);
      }
    };

    loadDailyMemo();
  }, [user]);

  // subjectMemo を読み込み
  useEffect(() => {
    if (!user) return;

    const loadSubjectMemo = async () => {
      const { data, error } = await supabase
        .from("subject_memo")
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        const memoObj = {};
        data.forEach((m) => {
          memoObj[m.subject] = m.memo;
        });
        setSubjectMemo(memoObj);
      }
    };

    loadSubjectMemo();
  }, [user]);

  const handleStart = () => {
    if (!studyType) {
      alert("勉強内容を選択してください");
      return;
    }
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const handlePause = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const handleStop = async () => {
    if (!startTime) return;

    clearInterval(timerRef.current);
    setIsRunning(false);

    const end = new Date();
    const minutes = Math.floor(elapsed / 60);

    const newRecord = {
      type: studyType,
      start: startTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      end: end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      minutes,
      date: selectedDate,
      fullDate: `${selectedDate} ${end.toLocaleTimeString()}`,
    };

    const { data, error } = await supabase
      .from("study_records")
      .insert([
        {
          user_id: user.id,
          subject: studyType,
          minutes: minutes,
          date: selectedDate,
          start: newRecord.start,
          end: newRecord.end,
        },
      ])
      .select();

    if (!error && data) {
      const converted = data.map((r) => ({
        type: r.subject,
        minutes: r.minutes,
        date: r.date,
        start: r.start || "--",
        end: r.end || "--",
        fullDate: r.created_at,
      }));

      setRecords((prev) => [...prev, ...converted]);
    }

    setStartTime(null);
    setElapsed(0);
  };

  const deleteRecord = async (index) => {
    const target = records[index];

    const { error } = await supabase
      .from("study_records")
      .delete()
      .eq("user_id", user.id)
      .eq("subject", target.type)
      .eq("minutes", target.minutes)
      .eq("date", target.date);

    if (!error) {
      setRecords(records.filter((_, i) => i !== index));
    }
  };

  const addTestTime = async (minutes) => {
    if (!studyType) {
      alert("勉強内容を選択してください");
      return;
    }

    const now = new Date();
    const newRecord = {
      type: studyType,
      start: "--",
      end: "--",
      minutes,
      date: selectedDate,
      fullDate: `${selectedDate} ${now.toLocaleTimeString()}`,
    };

    const { data, error } = await supabase
      .from("study_records")
      .insert([
        {
          user_id: user.id,
          subject: studyType,
          minutes: minutes,
          date: selectedDate,
          start: "--",
          end: "--",
        },
      ])
      .select();

    if (!error && data) {
      const converted = data.map((r) => ({
        type: r.subject,
        minutes: r.minutes,
        date: r.date,
        start: r.start || "--",
        end: r.end || "--",
        fullDate: r.created_at,
      }));

      setRecords((prev) => [...prev, ...converted]);
    }
  };



  const addSubject = async () => {
    if (newSubject.trim() === "") return;
    if (subjects.includes(newSubject)) return;

    const { error } = await supabase.from("subjects").insert({
      user_id: user.id,
      name: newSubject,
      deleted: false,
    });

    if (!error) {
      setSubjects([...subjects, newSubject]);
      setNewSubject("");
    }
  };

  const deleteSubject = async (subj) => {
    const { error } = await supabase
      .from("subjects")
      .update({ deleted: true })
      .eq("user_id", user.id)
      .eq("name", subj);

    if (!error) {
      setSubjects(subjects.filter((item) => item !== subj));
    }
  };

  const saveDailyMemo = async (date, memo) => {
    setDailyMemo((prev) => ({ ...prev, [date]: memo }));

    await supabase.from("daily_memo").upsert({
      user_id: user.id,
      date,
      memo,
    });
  };

  const saveSubjectMemo = async (subject, memo) => {
    setSubjectMemo((prev) => ({ ...prev, [subject]: memo }));

    await supabase.from("subject_memo").upsert({
      user_id: user.id,
      subject,
      memo,
    });
  };

  const groupedByDate = records.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  const selectedRecords = groupedByDate[selectedDate] || [];

  const dailyTotals = {};
  selectedRecords.forEach((r) => {
    dailyTotals[r.type] = (dailyTotals[r.type] || 0) + r.minutes;
  });
  
  console.log("selectedRecords", selectedRecords);
  console.log("dailyTotals", dailyTotals);

  const todayTotal = Object.values(dailyTotals).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!goalSubject) return;
    if (goalAchieved) return;

    const subjectMinutes = dailyTotals[goalSubject] || 0;

    if (subjectMinutes >= dailyGoal) {
      setGoalAchieved(true);
    }
  }, [selectedRecords, goalSubject, dailyGoal]);

  useEffect(() => {
    localStorage.setItem("goalSubject", goalSubject);
    localStorage.setItem("dailyGoal", dailyGoal);
  }, [goalSubject, dailyGoal]);


  const colorMap = {
    英語: "#3b82f6",
    数学: "#10b981",
    国語: "#f59e0b",
    理科: "#ef4444",
    社会: "#8b5cf6",
    暗記: "#ec4899",
    自習: "#22c55e",
  };

  const dailyChartData = {
    labels: Object.keys(dailyTotals),
    datasets: [
      {
        data: Object.values(dailyTotals),
        backgroundColor: Object.keys(dailyTotals).map(
          (type) => colorMap[type] || "#ffffff"
        ),
      },
    ],
  };

  const getWeeklyTotal = () => {
    const thisWeek = dayjs(selectedDate).isoWeek();
    let total = 0;

    records.forEach((r) => {
      if (dayjs(r.date).isoWeek() === thisWeek) {
        total += r.minutes;
      }
    });

    return total;
  };

  const weeklyData = getWeeklyChartData(records);
  const weeklyChartData = {
    labels: Object.keys(weeklyData).map((w) => `Week ${w}`),
    datasets: [
      {
        label: "週の合計勉強時間（分）",
        data: Object.values(weeklyData),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
      },
    ],
  };

  const dailyTotalsAll = getDailyTotals(records);
  const lineChartData = {
    labels: Object.keys(dailyTotalsAll),
    datasets: [
      {
        label: "1日の合計勉強時間（分）",
        data: Object.values(dailyTotalsAll),
        borderColor: "rgba(56, 189, 248, 1)",
        backgroundColor: "rgba(56, 189, 248, 0.3)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
      {/* ヘッダー */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h2 className="text-xl text-blue-300 font-bold">
        ようこそ、{user.nickname} さん
        </h2>

        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
        >
          ログアウト
        </button>
      </div>
        
    <div className="w-full max-w-6xl bg-gray-800 p-4 rounded mb-6">
        <h3 className="text-lg font-bold mb-2">今日の目標</h3>
        <button
          onClick={() => setIsGoalSettingOpen(true)}
          className="mb-3 px-3 py-1 bg-blue-500 rounded hover:bg-blue-600"
        >
          目標を設定する
        </button>

        <div className="w-full bg-gray-700 h-4 rounded">
            <div
            className="h-4 bg-green-500 rounded"
            style={{
                width: `${Math.min((todayTotal / dailyGoal) * 100, 100)}%`
            }}
            ></div>
        </div>

        <p className="mt-2 text-gray-300">
          {goalSubject ? `${goalSubject}：` : ""} {todayTotal} / {dailyGoal} 分
        </p>
        </div>

      {/* カレンダーのダークテーマ */}
      <style>{`
        .react-calendar {
          background-color: #1f2937 !important;
          color: white !important;
          border: 2px solid #3b82f6 !important;
          border-radius: 12px;
          padding: 10px;
        }
        .react-calendar__tile {
          background: transparent !important;
          color: white !important;
          border-radius: 8px;
        }
        .react-calendar__tile--active {
          background: #2563eb !important;
          color: white !important;
          box-shadow: 0 0 10px #3b82f6;
        }
        .react-calendar__tile:hover {
          background: #1e40af !important;
        }
        .react-calendar__tile--now {
          background: rgba(59, 130, 246, 0.3) !important;
          border: 2px solid #3b82f6 !important;
          color: #ffffff !important;
          box-shadow: 0 0 12px #3b82f6;
        }
      `}</style>

      <h1 className="text-4xl font-extrabold text-blue-400 mb-8 drop-shadow-[0_0_10px_#3b82f6]">
        Study Tracker
      </h1>

      {/* カレンダー＋日別グラフ */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-blue-500">
          <h2 className="text-xl font-bold text-blue-300 mb-2">日付を選択</h2>

          <Calendar
            onChange={(value) =>
              setSelectedDate(dayjs(value).format("YYYY-MM-DD"))
            }
            value={new Date(selectedDate)}
          />
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">
            {selectedDate} の勉強割合
          </h2>

          {selectedRecords.length > 0 ? (
            <Doughnut data={dailyChartData} />
          ) : (
            <p className="text-gray-400">この日の記録はありません</p>
          )}
        </div>
      </div>

      {/* タイマー */}
      <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-xl shadow-lg mt-10">
        <select
          value={studyType}
          onChange={(e) => setStudyType(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700"
        >
          <option value="">勉強内容を選択</option>

          {subjects.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}

          <option value="暗記">暗記</option>
          <option value="自習">自習</option>
        </select>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="教科を追加（例：技術）"
            className="flex-1 p-2 rounded bg-gray-700"
          />
          <button onClick={addSubject} className="px-4 py-2 bg-blue-500 rounded">
            追加
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg mb-2">追加した教科</h3>

          {subjects
            .filter((s) => !baseSubjects.includes(s))
            .map((subj) => (
              <div
                key={subj}
                className="flex justify-between items-center mb-2"
              >
                <span>{subj}</span>
                <button
                  onClick={() => deleteSubject(subj)}
                  className="px-2 py-1 bg-red-500 rounded"
                >
                  削除
                </button>
              </div>
            ))}
        </div>

        <div className="text-center text-3xl font-bold mb-4">
          {Math.floor(elapsed / 60)}分 {elapsed % 60}秒
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex-1 bg-green-500 hover:bg-green-600 p-3 rounded font-bold disabled:bg-gray-600"
          >
            スタート
          </button>

          <button
            onClick={handlePause}
            disabled={!isRunning}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 p-3 rounded font-bold disabled:bg-gray-600"
          >
            一時停止
          </button>

          <button
            onClick={handleStop}
            disabled={elapsed === 0}
            className="flex-1 bg-red-500 hover:bg-red-600 p-3 rounded font-bold disabled:bg-gray-600"
          >
            ストップ
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <button
            onClick={() => addTestTime(1)}
            className="bg-blue-500 p-2 rounded"
          >
            +1分
          </button>
          <button
            onClick={() => addTestTime(5)}
            className="bg-blue-500 p-2 rounded"
          >
            +5分
          </button>
          <button
            onClick={() => addTestTime(30)}
            className="bg-blue-500 p-2 rounded"
          >
            +30分
          </button>
          <button
            onClick={() => addTestTime(60)}
            className="bg-blue-500 p-2 rounded"
          >
            +60分
          </button>
        </div>
      </div>

      <div className="mt-6 w-full max-w-6xl">
        <h3 className="text-lg mb-2">今日のメモ</h3>
        <textarea
          className="w-full p-4 rounded bg-gray-700 text-lg"
          rows="4"
          value={dailyMemo[selectedDate] || ""}
          onChange={(e) => saveDailyMemo(selectedDate, e.target.value)}
          placeholder="今日のメモを書いてください"
        />
      </div>

      <div className="w-full max-w-6xl mt-12">
        <h2 className="text-2xl font-bold mb-4 text-blue-300">
          {selectedDate} の記録一覧
        </h2>

        {selectedRecords.length === 0 && (
          <p className="text-gray-400">まだ記録がありません</p>
        )}

        {selectedRecords.map((r, i) => (
          <div
            key={i}
            className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 mb-3 flex gap-4"
          >
            <div className="flex-1 relative">
              <button
                onClick={() => deleteRecord(records.indexOf(r))}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                削除
              </button>

              <p className="font-bold text-blue-300 text-lg">{r.type}</p>
              <p>
                {r.start} 〜 {r.end}（{r.minutes} 分）
              </p>
              <p className="text-sm text-gray-400">{r.fullDate}</p>
            </div>

            <div className="w-1/3">
              <textarea
                className="w-full h-full p-3 rounded bg-gray-700 text-sm"
                placeholder={`${r.type} のメモ`}
                value={subjectMemo[r.type] || ""}
                onChange={(e) => saveSubjectMemo(r.type, e.target.value)}
              />
            </div>
          </div>
        ))}

        <h2 className="text-xl font-bold text-green-400 mt-4">
          この週の合計: {getWeeklyTotal()} 分
        </h2>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-10">
          <h2 className="text-2xl font-bold mb-4 text-purple-300">
            週ごとの勉強時間グラフ
          </h2>
          <Bar data={weeklyChartData} />
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-10">
          <h2 className="text-2xl font-bold mb-4 text-cyan-300">
            日ごとの勉強時間推移
          </h2>
          <Line data={lineChartData} />
        </div>
      </div>
          {isGoalSettingOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-gray-800 p-6 rounded-lg w-80">
              <h2 className="text-xl font-bold mb-4">今日の目標を設定</h2>

              <label className="block mb-2">教科</label>
              <select
                value={goalSubject}
                onChange={(e) => setGoalSubject(e.target.value)}
                className="w-full p-2 mb-4 bg-gray-700 rounded"
              >
                <option value="">選択してください</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>

              <label className="block mb-2">目標時間（分）</label>
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full p-2 mb-4 bg-gray-700 rounded"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setIsGoalSettingOpen(false)}
                  className="flex-1 bg-green-500 p-2 rounded"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsGoalSettingOpen(false)}
                  className="flex-1 bg-red-500 p-2 rounded"
                >
                  キャンセル
                </button>
              </div>
            </div>
            
          </div>
        )}

        {goalAchieved && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center">
          <div className="bg-green-600 p-8 rounded-xl shadow-xl text-center animate-bounce">
            <h2 className="text-3xl font-bold mb-4">🎉 達成！！ 🎉</h2>
            <p className="text-lg mb-4">
              {goalSubject} の目標 {dailyGoal} 分を達成しました！
            </p>
            <button
              onClick={() => setGoalAchieved(false)}
              className="px-4 py-2 bg-white text-green-700 font-bold rounded"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      </div>
      
    );
}
