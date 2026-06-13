# 语音画布

一款面向“AI 语音绘图工具”题目的纯语音控制绘图应用。用户启动麦克风后，通过“小花小花”唤醒助手，再用中文语音完成绘图、撤销、重做、清空和停止等操作。

## Demo

- 在线体验：待部署后补充
- Demo 视频：待录制后补充
- 设计文档：[docs/DESIGN.md](docs/DESIGN.md)

## 核心能力

- 语音唤醒：说“小花小花”，助手回复“我在，请问有什么可以帮您的？”
- 低延迟绘图：常见形状和组合场景优先由前端本地解析，直接绘制到 Canvas。
- 复杂指令拆解：支持一句话包含多个元素，例如“画蓝天白云和太阳”“画房子和树”。
- 容错识别：兼容“小花”常见误识别词，如“笑话”“小化”“消化”。
- 语音编辑：支持“撤销”“重做”“清空画布”“停止”“不画了”。
- 语音反馈：每个阶段都有 TTS 回复，减少误触和等待不确定性。

## 支持的语音示例

```text
小花小花
画一个蓝色圆形
画蓝天白云和太阳
画一座红色房子和一棵树
撤销
重做
清空画布
停止
```

## 技术栈与依赖

- 前端：React 19、Vite 8、TypeScript 6、Zustand、uuid、Canvas 2D
- 语音：浏览器 SpeechRecognition、SpeechSynthesis
- 后端：Express、TypeScript、Anthropic SDK 兼容接口、AgnesAI 图片生成兜底
- 构建运行：Node.js、npm

第三方能力说明：浏览器语音识别/TTS 用于语音交互；大模型接口用于本地规则无法覆盖的复杂指令解析；图片生成接口仅作为复杂视觉描述的兜底能力。核心画布对象绘制、指令规则解析和交互流程为本项目实现。

## 本地启动

```bash
cd server
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

默认地址：

- 前端：http://127.0.0.1:5173
- 后端：http://127.0.0.1:3001

建议使用 Chrome 或 Edge，并允许浏览器麦克风权限。首次进入页面需要点击麦克风按钮授权，之后绘图创作流程只使用语音完成。

## 环境变量

后端可通过环境变量接入云端能力：

```bash
ANTHROPIC_BASE_URL=
ANTHROPIC_AUTH_TOKEN=
ANTHROPIC_MODEL=glm-5
AGNES_API_KEY=
AGNES_BASE_URL=https://apihub.agnes-ai.com
AGNES_MODEL=agnes-image-2.1-flash
```

公开仓库不应提交真实密钥。提交评审时应提供已部署、已配置密钥的后端服务，或在演示环境中通过环境变量注入。

## 项目结构

```text
voice-drawing-tool/
├── frontend/    # React 前端、Canvas 绘制、语音交互
├── server/      # Express 后端、复杂指令解析、图片生成兜底
└── docs/        # 设计文档
```

## 提交流程建议

比赛要求保持持续 PR 记录。建议从现在起按小粒度拆分：

1. 纯语音交互闭环：唤醒、TTS、识别暂停/恢复、停止命令。
2. 绘图指令解析：本地规则、复杂指令拆解、画布操作。
3. 文档与演示：README、设计文档、Demo 链接和部署说明。

每个 PR 需要写清楚功能描述、实现思路和测试方式。
