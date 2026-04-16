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

  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem("subjects");
    return saved
      ? JSON.parse(saved)
      : ["国語", "数学", "英語", "理科", "社会"];
  });

  const [newSubject, setNewSubject] = useState("");

  const [dailyMemo, setDailyMemo] = useState(() => {
    const saved = localStorage.getItem("dailyMemo");
    return saved ? JSON.parse(saved) : {};
  });

  const [subjectMemo, setSubjectMemo] = useState(() => {
    const saved = localStorage.getItem("subjectMemo");
    return saved ? JSON.parse(saved) : {};
  });

  // subjects / memo は今は localStorage のまま
  useEffect(() => {
    localStorage.setItem("subjects", JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem("dailyMemo", JSON.stringify(dailyMemo));
  }, [dailyMemo]);

  useEffect(() => {
    localStorage.setItem("subjectMemo", JSON.stringify(subjectMemo));
  }, [subjectMemo]);

  const timerRef = useRef(null);

  // 🔥 Supabase から記録を読み込む
  useEffect(() => {
    if (!user) return;

    const loadRecords = async () => {
      const { data, error } = await supabase
        .from("study_records")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!error) {
        const converted = data.map((r) => ({
          type: r.subject,
          minutes: r.seconds,
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

    // 🔥 Supabase に保存
    const { error } = await supabase.from("study_records").insert([
      {
        user_id: user.id,
        subject: studyType,
        seconds: minutes,
        date: selectedDate,
        start: newRecord.start,
        end: newRecord.end,
      },
    ]);

    if (!error) {
      setRecords([...records, newRecord]);
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
      .eq("seconds", target.minutes)
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

    const { error } = await supabase.from("study_records").insert([
      {
        user_id: user.id,
        subject: studyType,
        seconds: minutes,
        date: selectedDate,
        start: "--",
        end: "--",
      },
    ]);

    if (!error) {
      setRecords([...records, newRecord]);
    }
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
    <>
      {/* あなたの JSX はそのまま */}
      {/* ここにあなたが送ってくれた return の中身をそのまま貼ってください */}
    </>
  );
}
