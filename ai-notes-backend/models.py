from sqlalchemy import Column, Integer, String, create_engine, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 使用Supabase PostgreSQL
SQLALCHEMY_DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL")
print(f"Database connected: {SQLALCHEMY_DATABASE_URL.split('@')[0] if '@' in SQLALCHEMY_DATABASE_URL else SQLALCHEMY_DATABASE_URL}")

# 添加连接池配置
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "connect_timeout": 30,
        "application_name": "ai-notes",
        "options": "-c default_transaction_isolation=read committed"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 定义数据表结构
class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, default="")  # 笔记标题
    text = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)

# 初始化数据库（如果表不存在则创建）
def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Database init failed: {e}")
        print("Warning: Database connection failed, app will start without database")
        print("Please check network connection or contact admin for Supabase access")
        # 不抛出异常，让应用继续启动