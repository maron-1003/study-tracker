// src/pastGoals/PastGoals.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function PastGoals({ user, onBack }) {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("past_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setGoals(data);
    };

    load();
  }, []);

  return (
    <div>
      <h2>過去の目標</h2>

      {goals.length === 0 && <p>まだ達成した目標はありません。</p>}

      <ul>
        {goals.map((g) => (
          <li key={g.id}>
            <strong>{g.subject}</strong>
            <br />
            目標: {g.target_minutes}分
            <br />
            達成: {g.achieved_minutes}分
            <br />
            達成日: {new Date(g.created_at).toLocaleDateString()}
          </li>
        ))}
      </ul>

      <button onClick={onBack}>戻る</button>
    </div>
  );
}
