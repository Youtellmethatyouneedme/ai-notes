import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { subscribe } from "../utils/toastBus";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | withSummary | withoutSummary
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [isNewNote, setIsNewNote] = useState(false); // track if currently creating new note
  const [showQA, setShowQA] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(""); // 新增：当前用户名
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const startHide = (id) => {
    // mark as hiding to trigger CSS exit animation
    setToasts(t => t.map(x => x.id === id ? { ...x, hiding: true } : x));
    // after animation, remove
    const removeAfter = 320; // ms, should match CSS transition
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      timersRef.current[id] = null;
    }
    timersRef.current[id] = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
      timersRef.current[id] && clearTimeout(timersRef.current[id]);
      timersRef.current[id] = null;
    }, removeAfter);
  };

  const pushToast = (message, variant = 'success', timeout = 3200) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, variant, hiding: false }]);
    // set auto-hide timer
    timersRef.current[id] = setTimeout(() => {
      startHide(id);
    }, timeout);
  };

  // subscribe to global toast bus so other pages/components can trigger toasts
  useEffect(()=>{
    const unsub = subscribe(({message, variant, timeout}) => {
      pushToast(message, variant, timeout);
    });
    return unsub;
  }, []);

  useEffect(() => {
    fetchNotes();
    // 从 localStorage 获取用户名
    const savedUser = localStorage.getItem('aiNotesUsername');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  useEffect(()=>{
    // reset to first page when query or filter changes
    setPage(1);
  }, [query, filter]);

  useEffect(()=>{
    // reset to first page when pageSize changes
    setPage(1);
  }, [pageSize]);

  const fetchNotes = async () => {
    try {
      const res = await fetch("https://ai-notes-backend-7go6.onrender.com/notes");
      const data = await res.json();
      setNotes(data || []);
    } catch (e) {
      console.error("获取笔记列表失败", e);
    }
  };

  const handleSelect = (note) => {
    setSelected(note.id);
    setTitle(note.title || '');
    setText(note.text);
    setSummary(note.summary);
    setIsNewNote(false);
    setShowQA(false);
    setQuestion('');
    setAnswer('');
  };

  const handleNew = () => {
    setSelected(null);
    setTitle("");
    setText("");
    setSummary("");
    setIsNewNote(true);
    setShowQA(false);
    setQuestion('');
    setAnswer('');
  };

  const handleAISummarize = async () => {
    if (!text || text.trim().length === 0) {
      pushToast('请输入笔记内容', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (selected && !isNewNote) {
        // 现有笔记：生成摘要并保存到数据库
        const res = await fetch("https://ai-notes-backend-7go6.onrender.com/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note_id: selected, text }),
        });
        const data = await res.json();

        if (data.summary) {
          setSummary(data.summary);
          setNotes(prev => prev.map(n => n.id === selected ? { ...n, summary: data.summary } : n));
          pushToast('AI摘要生成成功', 'success');
        } else {
          pushToast('AI摘要生成失败，请重试', 'danger');
        }
      } else {
        // 新笔记：只生成摘要不保存到数据库
        const res = await fetch("https://ai-notes-backend-7go6.onrender.com/api/summarize-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();

        if (data.summary) {
          setSummary(data.summary);
          pushToast('AI摘要生成成功，请保存笔记', 'success');
        } else {
          pushToast('AI摘要生成失败，请重试', 'danger');
        }
      }
    } catch (e) {
      console.error(e);
      pushToast('AI摘要生成失败', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      pushToast('请输入问题', 'warning');
      return;
    }
    if (!text.trim()) {
      pushToast('请输入笔记内容', 'warning');
      return;
    }

    setQaLoading(true);
    try {
      const res = await fetch("https://ai-notes-backend-7go6.onrender.com/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context: text }),
      });
      const data = await res.json();

      if (data.answer) {
        setAnswer(data.answer);
        pushToast('AI已回答您的问题', 'success');
      } else {
        pushToast('AI回答失败，请重试', 'danger');
      }
    } catch (e) {
      console.error(e);
      pushToast('AI回答失败', 'danger');
    } finally {
      setQaLoading(false);
    }
  };

  const handleLogout = () => {
    // 清除本地存储的用户名
    localStorage.removeItem('aiNotesUsername');
    setCurrentUser("");
    navigate('/auth');
  };

  return (
    <div className="dashboard container-fluid p-0">
      <nav className="navbar navbar-light shadow-sm" style={{background: 'linear-gradient(45deg, #10b981, #059669)', height: '64px'}}>
        <div className="container-fluid">
          <span className="navbar-brand mb-0" style={{fontSize: '1.6rem', fontWeight: '700', color: '#fff'}}>
            <i className="bi bi-robot me-2"></i>
            AI Notes
          </span>
          <div className="d-flex align-items-center">
            {/* 显示用户名 */}
            {currentUser && (
              <span className="text-white me-3" style={{fontWeight: '600', fontSize: '1rem'}}>
                <i className="bi bi-person-circle me-1"></i>
                {currentUser}
              </span>
            )}
            <button className="btn btn-outline-light" onClick={handleLogout} style={{fontWeight: '600'}}>
              <i className="bi bi-box-arrow-right me-1"></i>
              退出
            </button>
          </div>
        </div>
      </nav>

      {/* 其余代码保持不变 */}
      <div className="d-flex" style={{ height: 'calc(100vh - 64px)' }}>
        <aside style={{ width: 350, minWidth: 350, maxWidth: 350, borderRight: '1px solid rgba(0,0,0,0.05)', overflowY: 'auto', padding: 0, flexShrink: 0 }} className="bg-light">
          <div style={{padding: '0.5rem', borderBottom: '1px solid #e0e0e0'}}>
            <div className="d-flex justify-content-between align-items-center mb-0">
              <h6 style={{margin: '0.25rem 0', fontSize: '0.95rem', fontWeight: '600'}}>我的笔记</h6>
              <div className="d-flex gap-2 align-items-center">
                <button onClick={handleNew} className="btn btn-sm" style={{padding: '0.25rem 0.6rem', background: 'linear-gradient(90deg, #34d399, #06b6d4)', color: 'white', fontWeight: 600, border: 'none'}}>+ 新建笔记</button>
                <button style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}} className="btn btn-sm btn-outline-danger" onClick={async ()=>{
                  if(!selected) return;
                  if(!confirm('确定要删除这篇笔记吗？')) return;
                  try{
                    const res = await fetch(`https://ai-notes-backend-7go6.onrender.com/notes/${selected}`,{method:'DELETE'});
                    const data = await res.json();
                    if(data.ok){
                      setNotes(prev=>prev.filter(n=>n.id!==selected));
                      setSelected(null);
                      setText('');
                      setSummary('');
                      pushToast('笔记删除成功', 'success');
                    } else {
                      pushToast(data.error||'删除失败', 'danger');
                    }
                  }catch(e){console.error(e)}
                }}>删除</button>
              </div>
            </div>
          </div>
          <div style={{padding: '0.5rem 0.5rem', borderBottom: '1px solid #e0e0e0'}}>
            <input className="form-control form-control-sm" placeholder="搜索笔记标题或内容..." value={query} onChange={(e)=>setQuery(e.target.value)} style={{marginBottom: '0.4rem'}} />
            <div className="d-flex gap-1 align-items-center" style={{marginBottom: 0}}>
              <select className="form-select form-select-sm" value={filter} onChange={(e)=>setFilter(e.target.value)} style={{fontSize: '0.85rem'}}>
                <option value="all">全部</option>
                <option value="withSummary">有AI摘要</option>
                <option value="withoutSummary">无AI摘要</option>
              </select>
              <div style={{width: 80, fontSize: '0.85rem'}}>
                <select className="form-select form-select-sm" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))} style={{fontSize: '0.85rem'}}>
                  <option value={5}>5 / 页</option>
                  <option value={10}>10 / 页</option>
                  <option value={15}>15 / 页</option>
                </select>
              </div>
            </div>
          </div>

          <div className="list-group" style={{border: 'none', margin: '0', padding: '0.5rem'}}>
            {notes.length === 0 && <div className="text-muted">暂无笔记，点击右上角按钮创建第一篇笔记吧！创建后可以体验AI摘要功能。</div>} 

            {/* filtered & paginated list */}
            {(() => {
              const q = query.trim().toLowerCase();
              let filtered = notes.filter(n => {
                const hasSummary = n.summary && n.summary.trim() && n.summary.trim() !== '';
                if (filter === 'withSummary' && !hasSummary) return false;
                if (filter === 'withoutSummary' && hasSummary) return false;
                if (!q) return true;
                return (n.text||'').toLowerCase().includes(q) || (n.summary||'').toLowerCase().includes(q) || (n.title||'').toLowerCase().includes(q);
              });
              const total = filtered.length;
              const totalPages = Math.max(1, Math.ceil(total / pageSize));
              const current = Math.min(Math.max(1, page), totalPages);
              const start = (current - 1) * pageSize;
              const pageItems = filtered.slice(start, start + pageSize);

              return (
                <>
                  {pageItems.map((n) => (
                    <button key={n.id} className={`list-group-item list-group-item-action ${selected===n.id? 'active':''}`} onClick={() => handleSelect(n)} style={{padding: '0.4rem 0.6rem', marginBottom: '0.25rem', fontSize: '0.9rem'}}>
                      <div className="fw-bold" style={{fontSize: '0.85rem'}}>{n.title || ((n.text||'').slice(0, 40) + ((n.text||'').length>40? '...':''))}</div>
                      <div className="small text-muted" style={{fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{(n.summary||'').slice(0,30)}</div>
                    </button>
                  ))}

                  <div className="d-flex justify-content-between align-items-center" style={{marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0', fontSize: '0.8rem'}}>
                    <small className="text-muted">共 {total} 篇</small>
                    <nav>
                      <ul className="pagination pagination-sm mb-0" style={{gap: '0.2rem'}}>
                        <li className={`page-item ${current===1? 'disabled':''}`}><button className="page-link" onClick={()=>setPage(1)}>«</button></li>
                        <li className={`page-item ${current===1? 'disabled':''}`}><button className="page-link" onClick={()=>setPage(Math.max(1, current-1))}>‹</button></li>
                        <li className="page-item active"><span className="page-link">{current}</span></li>
                        <li className={`page-item ${current===totalPages? 'disabled':''}`}><button className="page-link" onClick={()=>setPage(Math.min(totalPages, current+1))}>›</button></li>
                        <li className={`page-item ${current===totalPages? 'disabled':''}`}><button className="page-link" onClick={()=>setPage(totalPages)}>»</button></li>
                      </ul>
                    </nav>
                  </div>
                </>
              );
            })()}
          </div>
        </aside>

        <main className="flex-fill p-4" style={{ minWidth: 0, overflow: 'hidden', height: 'calc(100vh - 64px)' }}>
          <div className="editor-area" style={{ height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
            {!selected && !isNewNote ? (
              // Welcome screen when no note is selected
              <div className="d-flex align-items-center justify-content-center h-100">
                <div className="text-center animate-fade-in" style={{maxWidth: '600px'}}>
                  {/* 欢迎界面 */}
                  <div className="mb-4">
                    <div className="animate-pulse mb-3">
                      <i className="bi bi-robot text-primary" style={{fontSize: '3.5rem'}}></i>
                    </div>
                    <h1 className="fw-bold mb-3" style={{color: '#2563eb', fontSize: '2.5rem'}}>
                      <i className="bi bi-stars me-3"></i>
                      欢迎使用 AI Notes
                    </h1>
                    <p className="lead text-muted mb-3" style={{fontSize: '1.1rem', lineHeight: '1.5'}}>
                      <i className="bi bi-magic me-2 text-warning"></i>
                      智能笔记助手，让AI帮您总结、思考和创作
                    </p>
                  </div>

                  {/* 功能卡片 */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body text-center p-3">
                          <i className="bi bi-pencil-square text-success mb-2" style={{fontSize: '2rem'}}></i>
                          <h6 className="fw-semibold">智能记录</h6>
                          <p className="text-muted small mb-0">随时随地记录灵感和笔记</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body text-center p-3">
                          <i className="bi bi-cpu text-primary mb-2" style={{fontSize: '2rem'}}></i>
                          <h6 className="fw-semibold">AI 摘要</h6>
                          <p className="text-muted small mb-0">一键生成内容摘要和重点</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body text-center p-3">
                          <i className="bi bi-tags text-warning mb-2" style={{fontSize: '2rem'}}></i>
                          <h6 className="fw-semibold">智能问答</h6>
                          <p className="text-muted small mb-0">基于笔记内容智能回答</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 创建笔记按钮 */}
                  <button
                    className="btn btn-lg px-5 py-3 fw-semibold"
                    style={{
                      background: 'linear-gradient(45deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50px',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                    }}
                    onClick={handleNew}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    开始创建第一篇笔记
                  </button>

                  <p className="text-muted mt-2 small">
                    <i className="bi bi-lightbulb me-1"></i>
                    点击上方按钮创建笔记，体验AI智能助手带来的便利
                  </p>
                </div>
              </div>
            ) : (
              // Editor screen when note is selected or new note mode
              <>
                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="请输入笔记标题..."
                    value={title}
                    onChange={(e)=>setTitle(e.target.value)}
                    style={{fontWeight: '600', fontSize: '1.05rem', marginBottom: '0.5rem'}}
                  />
                </div>
                <div className="mb-3">
                  <textarea className="form-control" rows={12} value={text} onChange={(e)=>setText(e.target.value)} placeholder="请输入笔记内容..." />
                </div>
                <div className="mb-3">
                  <button className="btn btn-success btn-sm me-2" onClick={async ()=>{
                    // Save: if selected exists (existing note) -> PUT, else create new
                    try{
                      if(selected && !isNewNote){
                        const res = await fetch(`https://ai-notes-backend-7go6.onrender.com/notes/${selected}`,{
                          method: 'PUT',
                          headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({ title, text, summary })
                        });
                        const data = await res.json();
                        // update list
                        setNotes(prev => prev.map(n => n.id === data.id ? data : n));
                      } else {
                        // Create new note
                        const res = await fetch('https://ai-notes-backend-7go6.onrender.com/notes',{
                          method: 'POST',
                          headers: {'Content-Type':'application/json'},
                          body: JSON.stringify({ title, text })
                        });
                        const data = await res.json();
                        setNotes(prev => [data, ...prev]);
                        setSelected(data.id);
                        setIsNewNote(false);
                      }
                      pushToast('保存成功', 'success');
                    }catch(e){
                      console.error(e);
                      pushToast('保存失败', 'danger');
                    }
                  }}>保存笔记</button>
                  <button className="btn btn-outline-secondary btn-sm me-2" onClick={()=>{ setSummary(''); setText(''); setTitle(''); }}>清空</button>
                  <button
                    className="btn btn-sm me-2"
                    onClick={handleAISummarize}
                    disabled={loading || !text.trim()}
                    style={{background: '#1fd655', color: 'white'}}
                  >
                    {loading? '生成中...':(selected && !isNewNote ? 'AI 生成摘要' : 'AI 预览摘要')}  
                  </button>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={()=>setShowQA(!showQA)}
                    disabled={!text.trim()}
                  >
                    向AI提问
                  </button>
                </div>

                {summary && (
                  <div style={{background: '#1fd655', color: 'white', padding: '1rem', borderRadius: '8px', marginTop: '1rem'}}>
                    <h6 style={{marginBottom: '0.5rem', fontWeight: '700'}}>AI 摘要</h6>
                    <p style={{margin: 0, lineHeight: '1.6'}}>{summary}</p>
                  </div>
                )}

                {showQA && (
                  <div style={{background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #e9ecef', maxHeight: '300px', overflowY: 'auto'}}>
                    <h6 style={{marginBottom: '0.75rem', fontWeight: '700', color: '#495057', position: 'sticky', top: '0', background: '#f8f9fa', paddingBottom: '0.5rem', borderBottom: '1px solid #e9ecef'}}>
                      <i className="bi bi-chat-dots me-2"></i>AI 智能问答
                    </h6>
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="请输入您的问题..."
                        value={question}
                        onChange={(e)=>setQuestion(e.target.value)}
                        onKeyPress={(e)=>e.key==='Enter'&&handleAskQuestion()}
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleAskQuestion}
                        disabled={qaLoading || !question.trim() || !text.trim()}
                      >
                        {qaLoading ? '思考中...' : '提问'}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={()=>{setQuestion(''); setAnswer('');}}
                      >
                        清空
                      </button>
                    </div>
                    {answer && (
                      <div style={{background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dee2e6', maxHeight: '150px', overflowY: 'auto'}}>
                        <div style={{fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem'}}>AI 回答</div>
                        <div style={{lineHeight: '1.6', color: '#212529', whiteSpace: 'pre-wrap'}}>{answer}</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-item toast-${t.variant} ${t.hiding ? 'hide' : 'show'}`}
            role="status"
            onMouseEnter={() => {
              // pause auto hide
              if (timersRef.current[t.id]) { clearTimeout(timersRef.current[t.id]); timersRef.current[t.id] = null; }
            }}
            onMouseLeave={() => {
              // resume auto hide
              if (!t.hiding && !timersRef.current[t.id]) {
                timersRef.current[t.id] = setTimeout(() => startHide(t.id), 1800);
              }
            }}
          >
            <div className="toast-content">{t.message}</div>
            <button className="toast-close" aria-label="关闭" onClick={()=>startHide(t.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
