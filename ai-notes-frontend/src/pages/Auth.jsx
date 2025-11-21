import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { pushToast } from "../utils/toastBus";

function LoginForm({ onSwitch }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://ai-notes-backend-7go6.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        pushToast(data.message || '登录成功', 'success');
        setTimeout(() => navigate('/dashboard'), 700);
      } else {
        pushToast(data.error || '登录失败', 'danger');
      }
    } catch (e) {
      pushToast('无法连接到后端', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 420, margin: "0 auto" }}>
      <div className="glass-card rounded-4 p-4 shadow-lg">
        <div className="text-center mb-4">
          <i className="bi bi-person-circle text-primary" style={{ fontSize: '3rem' }}></i>
          <h4 className="mt-2 fw-bold text-primary">欢迎回来</h4>
          <p className="text-muted">登录您的AI笔记账户</p>
        </div>
        
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-person text-muted"></i>
            </span>
            <input 
              className="form-control border-start-0 ps-0" 
              placeholder="用户名" 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
            />
          </div>
        </div>
        
        <div className="mb-4">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-lock text-muted"></i>
            </span>
            <input 
              type="password" 
              className="form-control border-start-0 ps-0" 
              placeholder="密码" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
            />
          </div>
        </div>
        
        <button 
          className="btn btn-primary w-100 py-2 fw-semibold" 
          onClick={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              登录中...
            </>
          ) : (
            <>
              <i className="bi bi-box-arrow-in-right me-2"></i>
              登录
            </>
          )}
        </button>
        
        <div className="text-center mt-4">
          <button className="btn btn-link text-decoration-none" onClick={onSwitch}>
            <i className="bi bi-person-plus me-1"></i>
            没有账号？立即注册
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterForm({ onSwitch }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  

  const handleRegister = async () => {
    if (password !== confirm) {
      pushToast('两次密码输入不一致', 'danger');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("https://ai-notes-backend-7go6.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        pushToast(data.message || '注册成功', 'success');
      } else {
        pushToast(data.error || '注册失败', 'danger');
      }
    } catch (e) {
      pushToast('无法连接到后端', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 420, margin: "0 auto" }}>
      <div className="glass-card rounded-4 p-4 shadow-lg">
        <div className="text-center mb-4">
          <i className="bi bi-person-plus-fill text-success" style={{ fontSize: '3rem' }}></i>
          <h4 className="mt-2 fw-bold text-success">创建账户</h4>
          <p className="text-muted">加入AI笔记，开启智能学习</p>
        </div>
        
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-person text-muted"></i>
            </span>
            <input 
              className="form-control border-start-0 ps-0" 
              placeholder="用户名" 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
            />
          </div>
        </div>
        
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-lock text-muted"></i>
            </span>
            <input 
              type="password" 
              className="form-control border-start-0 ps-0" 
              placeholder="密码" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
            />
          </div>
        </div>
        
        <div className="mb-4">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-shield-check text-muted"></i>
            </span>
            <input 
              type="password" 
              className="form-control border-start-0 ps-0" 
              placeholder="确认密码" 
              value={confirm} 
              onChange={(e)=>setConfirm(e.target.value)} 
            />
          </div>
        </div>
        
        <button 
          className="btn btn-success w-100 py-2 fw-semibold" 
          onClick={handleRegister} 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              注册中...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-2"></i>
              立即注册
            </>
          )}
        </button>
        
        <div className="text-center mt-4">
          <button className="btn btn-link text-decoration-none" onClick={onSwitch}>
            <i className="bi bi-arrow-left me-1"></i>
            已有账号？返回登录
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  return (
    <div style={{
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
            {/* 头部标题 */}
            <div className="text-center mb-4 animate-fade-in">
              <div className="mb-4">
                <i className="bi bi-journal-text text-white animate-pulse" style={{ fontSize: '4rem' }}></i>
              </div>
              <h1 className="text-white fw-bold mb-3">AI 智能笔记</h1>
              <p className="text-white-50 fs-5">让AI助力您的学习与思考</p>
              
              {/* 特性展示 */}
              <div className="row text-center mt-3">
                <div className="col-4">
                  <i className="bi bi-robot text-white-50 d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                  <small className="text-white-50">AI摘要</small>
                </div>
                <div className="col-4">
                  <i className="bi bi-cloud-check text-white-50 d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                  <small className="text-white-50">云端同步</small>
                </div>
                <div className="col-4">
                  <i className="bi bi-lightning text-white-50 d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                  <small className="text-white-50">快速检索</small>
                </div>
              </div>
            </div>
            
            {/* 登录/注册表单 */}
            <div style={{ marginTop: 20 }}>
              {mode === "login" ? (
                <LoginForm onSwitch={() => setMode("register")} />
              ) : (
                <RegisterForm onSwitch={() => setMode("login")} />
              )}
            </div>
      </div>
    </div>
  );
}
