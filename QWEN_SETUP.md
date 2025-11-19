# Qwen2.5-7B-Instruct 模型集成指南

## 安装步骤

### 1. 安装 Ollama

访问 [https://ollama.ai](https://ollama.ai) 下载并安装 Ollama（支持 Windows、Mac、Linux）

### 2. 拉取 Qwen2.5-7B-Instruct 模型

在终端中运行：

```bash
ollama pull qwen2.5
```

这会下载约 4GB 的模型文件到本地。

### 3. 启动 Ollama 服务

Ollama 通常在安装后会自动作为后台服务运行，监听 `http://localhost:11434`

验证服务是否运行：
```bash
curl http://localhost:11434/api/tags
```

如果无响应，手动启动：
```bash
ollama serve
```

### 4. 测试模型

```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5",
    "prompt": "你好",
    "stream": false
  }'
```

### 5. 启动后端服务

```bash
cd ai-notes-backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 6. 测试前端集成

打开浏览器访问前端应用，创建新笔记并点击"AI 生成摘要"按钮，应该能看到基于 Qwen 模型生成的摘要。

## 环境变量

如果 Ollama 运行在不同的地址，可以设置环境变量：

```bash
# Windows PowerShell
$env:OLLAMA_URL="http://your-ollama-host:11434"

# Linux/Mac
export OLLAMA_URL="http://your-ollama-host:11434"
```

## 常见问题

### Q: Ollama 下载模型太慢？
A: 可以预先下载模型文件，或者配置国内镜像源。

### Q: 生成摘要很慢？
A: Qwen2.5-7B 模型在 CPU 上运行会比较慢。建议：
- 使用 GPU（NVIDIA/AMD）加速（Ollama 会自动检测）
- 使用更小的模型如 `phi` 或 `neural-chat`

### Q: 如何切换其他模型？
A: 修改 `main.py` 中的 `"model": "qwen2.5"` 为其他模型名称，例如：
- `ollama pull phi` （小模型，快速）
- `ollama pull neural-chat` （平衡模型）
- `ollama pull llama2` （Llama2 模型）

## 关闭 Ollama

```bash
# Windows: 在服务中停止 Ollama
# Mac/Linux: 按 Ctrl+C 停止服务
```

