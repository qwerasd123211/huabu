# 语音画布 — AI Voice Drawing Tool

说你所想，绘你所见。一款纯语音控制的 AI 绘图工具。

## 技术栈

- **前端**: React 19 + Vite 8 + TypeScript 6 + Zustand 5 + Canvas 2D
- **后端**: Express 4 + TypeScript + 智谱 GLM-5 + AgnesAI
- **语音**: 浏览器原生 SpeechRecognition (zh-CN) + iFlytek WebSocket
- **UI**: 暗色主题，实时语音交互

## 快速启动

```bash
# 前端
cd frontend && npm install && npm run dev

# 后端
cd server && npm install && npm run dev
```

## 功能特性

- 语音唤醒: 说"小花小花"唤醒助手
- 语音绘图: 说"画一个红色的房子"自动生成图像
- 修改指令: 撤销、重做、清空画布
- 实时交互: TTS 语音回复，对话式操作

## 项目结构

```
voice-drawing-tool/
├── frontend/    # React 前端应用
├── server/      # Express 后端服务
└── docs/        # 设计文档
```
