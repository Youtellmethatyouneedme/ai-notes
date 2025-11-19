import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function Home() {
  const navigate = useNavigate();
  return (
    <div style={{
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="text-center">
        <div className="mb-4">
          <i className="bi bi-journal-text text-white animate-pulse" style={{ fontSize: '4rem' }}></i>
        </div>
        <h1 className="text-white fw-bold mb-3">AI 读书笔记</h1>
        <p className="text-white-50 fs-5 mb-4">利用 AI 自动生成读书摘要与关键词 ✨</p>
        <button
          className="btn btn-light btn-lg px-4 py-2 fw-semibold"
          onClick={() => navigate('/auth')}
        >
          <i className="bi bi-arrow-right me-2"></i>
          开始使用
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
