# Siliconflow 模型（通过 Ollama）集成说明

本项目后端通过 Ollama HTTP API 调用本地模型，默认使用环境变量 `MODEL_NAME` 指定模型名称，默认值为 `siliconflow`。

如果你想使用 `siliconflow` 模型，请按以下步骤操作：

1. 安装 Ollama

   - 访问 https://ollama.ai 下载并安装 Ollama（支持 Windows、Mac、Linux）。

2. 拉取 `siliconflow` 模型

   在 PowerShell 中运行：

```powershell
ollama pull siliconflow
```

3. 启动 Ollama 服务（若未自动启动）

```powershell
ollama serve
```

默认 Ollama 在 `http://localhost:11434` 提供 HTTP API。若运行在其他位置，请设置环境变量：

```powershell
$env:OLLAMA_URL = "http://<your-host>:11434"
$env:MODEL_NAME = "siliconflow"
```

4. 启动后端

```powershell
cd C:\Users\ZZ08LD672\git-AI\ai-notes\ai-notes-backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

5. 测试

- 在前端创建或编辑一条笔记，点击 `AI 生成摘要`，后端会调用 Ollama 的 `/api/generate` 并返回模型输出作为摘要。

注意：模型的调用时间与机器性能相关，较大的模型可能在 CPU 上非常慢，推荐使用带 GPU 的机器或选择更小的模型进行本地部署。
