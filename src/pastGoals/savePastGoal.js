// src/pastGoals/savePastGoal.js
import { supabase } from "../supabaseClient";

export const savePastGoal = async (goal) => {
  const { error } = await supabase.from("past_goals").insert({
    user_id: goal.user_id,
    subject: goal.subject,
    target_minutes: goal.target_minutes,
    achieved_minutes: goal.progress_minutes,
  });

  if (error) {
    console.error("過去目標の保存に失敗:", error);
  }
};
