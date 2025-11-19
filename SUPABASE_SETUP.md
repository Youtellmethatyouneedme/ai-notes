# Supabase PostgreSQL 部署指南

## 1. 创建Supabase项目

1. 访问 [Supabase](https://supabase.com)
2. 注册/登录账户
3. 点击 "New Project"
4. 填写项目信息：
   - Name: `ai-notes`
   - Database Password: 设置一个强密码
   - Region: 选择离您最近的区域

## 2. 获取数据库连接信息

项目创建完成后：
1. 进入项目 Dashboard
2. 点击左侧 "Settings" → "Database"
3. 在 "Connection string" 部分找到 "URI" 格式的连接字符串
4. 复制类似这样的URL：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

## 3. 配置环境变量

1. 复制 `.env.example` 为 `.env`：
   ```bash
   copy .env.example .env
   ```

2. 编辑 `.env` 文件，填入您的Supabase连接信息：
   ```
   SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   SILICONFLOW_API_KEY=sk-your-api-key-here
   ```

## 4. 安装依赖并迁移数据

1. 安装新依赖：
   ```bash
   pip install -r requirements.txt
   ```

2. 运行数据迁移（如果有现有SQLite数据）：
   ```bash
   python migrate_to_postgres.py
   ```

3. 启动应用：
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 5. 验证部署

- 应用启动时会显示使用的数据库类型
- 登录/注册功能应该正常工作
- 笔记创建和AI摘要功能应该正常工作

## 注意事项

- Supabase免费版有一定限制，生产环境建议升级
- 定期备份重要数据
- 不要将 `.env` 文件提交到版本控制系统