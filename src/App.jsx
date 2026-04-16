import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import StudyTracker from "./StudyTracker";
import { supabase } from "./supabaseClient";

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login"); // login / register

  // 🔥 ログイン状態を保持
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMode("login");
  };

  // ログイン成功
  const handleLogin = () => {
    // user は onAuthStateChange で自動セットされる
  };

  // 新規登録成功
  const handleRegister = () => {
    // user は onAuthStateChange で自動セットされる
  };

  // 🔥 画面切り替えは user の有無だけで判断
  if (user) {
    return <StudyTracker user={user} onLogout={handleLogout} />;
  }

  // user がいないときだけ login/register を表示
  return (
    <div>
      {mode === "login" && (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setMode("register")}
        />
      )}

      {mode === "register" && (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setMode("login")}
        />
      )}
    </div>
  );
}
