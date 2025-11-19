from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from models import Note, SessionLocal, init_db, User
import hashlib
import requests
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

init_db()

app = FastAPI()

# CORS 跨域支持
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库依赖函数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class NoteResponse(BaseModel):
    id: int
    title: str
    text: str
    summary: str

class NoteCreate(BaseModel):
    title: str = ""
    text: str = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    summary: Optional[str] = None

class AuthRequest(BaseModel):
    username: str
    password: str

class SummarizeRequest(BaseModel):
    note_id: int
    text: str

class TextSummarizeRequest(BaseModel):
    text: str

class QuestionRequest(BaseModel):
    question: str
    context: str  # 笔记内容作为上下文

@app.get("/notes", response_model=List[NoteResponse])
def list_notes(db: Session = Depends(get_db)):
    notes = db.query(Note).order_by(Note.id.desc()).all()
    return notes


@app.post("/notes", response_model=NoteResponse)
def create_note(request: NoteCreate, db: Session = Depends(get_db)):
    new_note = Note(
        title=request.title or "", 
        text=request.text or "", 
        summary=""
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


@app.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        return {"ok": False, "error": "笔记未找到"}
    db.delete(note)
    db.commit()
    return {"ok": True}


@app.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, request: NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        # FastAPI will convert this simple dict to JSON response
        return {"id": 0, "title": "", "text": "", "summary": ""}

    if request.title is not None:
        note.title = request.title
    if request.text is not None:
        note.text = request.text
    if request.summary is not None:
        note.summary = request.summary

    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@app.post("/register")
def register(request: AuthRequest, db: Session = Depends(get_db)):
    try:
        # 检查用户名是否存在
        # 简单校验
        if not (3 <= len(request.username) <= 150) or not (4 <= len(request.password) <= 128):
            return {"ok": False, "error": "用户名或密码长度不符合要求"}

        existing = db.query(User).filter(User.username == request.username).first()
        if existing:
            return {"ok": False, "error": "用户名已存在"}

        # 简单的 sha256 密码哈希（生产请用更安全方案）
        pw_hash = hashlib.sha256(request.password.encode("utf-8")).hexdigest()
        user = User(username=request.username, password_hash=pw_hash)
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"ok": True, "message": "注册成功"}
    except Exception as e:
        return {"ok": False, "error": "数据库连接失败，请检查网络连接"}


@app.post("/login")
def login(request: AuthRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.username == request.username).first()
        if not user:
            return {"ok": False, "error": "用户名或密码不正确"}
        pw_hash = hashlib.sha256(request.password.encode("utf-8")).hexdigest()
        if pw_hash != user.password_hash:
            return {"ok": False, "error": "用户名或密码不正确"}

        # 返回简单成功消息（可扩展为 JWT 等）
        return {"ok": True, "message": "登录成功"}
    except Exception as e:
        return {"ok": False, "error": "数据库连接失败，请检查网络连接"}

@app.post("/api/summarize")
def summarize(req: SummarizeRequest, db: Session = Depends(get_db)):
    try:
        api_key = os.getenv("SILICONFLOW_API_KEY")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "Qwen/Qwen2.5-7B-Instruct",
            "messages": [
                {
                    "role": "system", 
                    "content": "你是一个专业的读书笔记助手。请用自己的话重新组织内容，生成简洁有效的摘要。"
                },
                {
                    "role": "user", 
                    "content": f"请为以下文本生成一个80-100字的摘要，用你自己的话概括主要内容：\n\n{req.text}"
                }
            ],
            "max_tokens": 150,
            "temperature": 0.8
        }

        response = requests.post(
            "https://api.siliconflow.cn/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            summary_text = result["choices"][0]["message"]["content"].strip()
            
            note = db.query(Note).filter(Note.id == req.note_id).first()
            if note:
                note.summary = summary_text
                db.commit()
                return {"summary": summary_text}
            else:
                raise HTTPException(status_code=404, detail="笔记不存在")
        else:
            raise HTTPException(status_code=500, detail="AI服务不可用")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"摘要生成失败: {str(e)}")

@app.post("/api/summarize-text")
def summarize_text_only(req: TextSummarizeRequest):
    """直接对文本生成摘要，不需要保存到数据库"""
    try:
        api_key = os.getenv("SILICONFLOW_API_KEY")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "Qwen/Qwen2.5-7B-Instruct",
            "messages": [
                {
                    "role": "system", 
                    "content": "你是一个专业的读书笔记助手。请用自己的话重新组织内容，生成简洁有效的摘要。"
                },
                {
                    "role": "user", 
                    "content": f"请为以下文本生成一个80-100字的摘要，用你自己的话概括主要内容：\n\n{req.text}"
                }
            ],
            "max_tokens": 150,
            "temperature": 0.8
        }

        response = requests.post(
            "https://api.siliconflow.cn/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            summary_text = result["choices"][0]["message"]["content"].strip()
            return {"summary": summary_text}
        else:
            raise HTTPException(status_code=500, detail="AI服务不可用")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"摘要生成失败: {str(e)}")

@app.post("/api/ask-question")
def ask_question(req: QuestionRequest):
    """基于笔记内容回答问题"""
    try:
        api_key = os.getenv("SILICONFLOW_API_KEY")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "Qwen/Qwen2.5-7B-Instruct",
            "messages": [
                {
                    "role": "system", 
                    "content": "你是一个智能助手，专门基于用户提供的笔记内容回答问题。请仔细阅读笔记内容，然后准确回答用户的问题。如果笔记中没有相关信息，请明确说明。"
                },
                {
                    "role": "user", 
                    "content": f"笔记内容：\n{req.context}\n\n问题：{req.question}\n\n请基于上述笔记内容回答这个问题。"
                }
            ],
            "max_tokens": 300,
            "temperature": 0.7
        }

        response = requests.post(
            "https://api.siliconflow.cn/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            answer = result["choices"][0]["message"]["content"].strip()
            return {"answer": answer}
        else:
            raise HTTPException(status_code=500, detail="AI服务不可用")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"问答失败: {str(e)}")