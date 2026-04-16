import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import StudyTracker from "./StudyTracker";

export default function App() {
  const [page, setPage] = useState("login"); // login / register / tracker
  const [user, setUser] = useState(null); // { id, nickname }

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
  const handleLogout = () => {
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

      {page === "tracker" && (
        <StudyTracker user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
