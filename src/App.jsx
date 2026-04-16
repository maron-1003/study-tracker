import { useState, useEffect } from "react";
import Login from "./Login";
import Register from "./Register";
import StudyTracker from "./StudyTracker";
import { supabase } from "./supabaseClient";

export default function App() {
  const [page, setPage] = useState("login"); // login / register / tracker
  const [user, setUser] = useState(null);

  // 🔥 ログイン状態を保持する処理（Supabase公式）
  useEffect(() => {
    // 初回ロード時にセッションを取得
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      if (data.session?.user) setPage("tracker");
    });

    // ログイン・ログアウト・トークン更新を監視
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setPage(session?.user ? "tracker" : "login");
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 新規登録成功時
  const handleRegister = (userData) => {
    setUser(userData);
    setPage("tracker");
  };

  // ログイン成功時
  const handleLogin = (userData) => {
    setUser(userData);
    setPage("tracker");
  };

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("login");
  };

  return (
    <div>
      {page === "login" && (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setPage("register")}
        />
      )}

      {page === "register" && (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setPage("login")}
        />
      )}

      {page === "tracker" && user && (
        <StudyTracker user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
