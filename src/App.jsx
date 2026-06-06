import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Register from "./Register";
import StudyTracker from "./StudyTracker";
import RankingPage from "./RankingPage";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.nickname !== "ユーザー") {
        setUser(parsed);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleRegister = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <Routes>

      {/* ログイン */}
      <Route
        path="/login"
        element={<Login onLogin={handleLogin} onSwitchToRegister={() => {}} />}
      />

      {/* 登録 */}
      <Route
        path="/register"
        element={<Register onRegister={handleRegister} onSwitchToLogin={() => {}} />}
      />

      {/* メイン画面（ログイン必須） */}
      <Route
        path="/"
        element={
          user ? (
            <StudyTracker user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* ランキングページ（ログイン必須） */}
      <Route
        path="/ranking"
        element={
          user ? (
            <RankingPage user={user} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

    </Routes>
  );
}
