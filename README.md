# 语音画布

一款面向“AI 语音绘图工具”题目的纯语音控制绘图应用。用户启动麦克风后，通过“小花小花”唤醒助手，再用中文语音完成绘图、修改、撤销、重做、清空、导出和停止。

## Demo

- 在线体验：部署后在这里填写 Vercel Production URL
- Demo 视频：录制后在这里填写公开视频链接
- 设计文档：[docs/DESIGN.md](docs/DESIGN.md)

## 核心能力

- 语音唤醒：说“小花小花”，助手语音回复并进入绘图监听。
- 低延迟绘图：常见形状和组合场景优先由前端本地解析，直接绘制到 Canvas。
- 复杂指令拆解：支持“画蓝天白云和太阳”“画房子和树”等多元素指令。
- 容错识别：兼容“小花”的常见误识别词，如“笑话”“小化”“消化”。
- 语音编辑：支持“撤销”“重做”“清空画布”“停止”“不画了”。
- 局部修改：支持“把刚才那朵花变大一点”“把右边的太阳移到左上角”。
- AI 生图兜底：复杂视觉描述可调用 AgnesAI 生成图片并放到画布上。
- 风格模式：支持水彩、像素、儿童画和默认风格。
- 语音导出：说“导出图片”“保存作品”可下载 PNG。
- 停止休眠：说“不画了”后回到等待唤醒状态，需要再次喊“小花小花”。

## 支持的语音示例

```text
小花小花
画一个蓝色圆形
画蓝天白云和太阳
画一座红色房子和一棵树
把刚才那朵花变大一点
把右边的太阳移到左上角
切换成水彩风格
画一个可爱的机器人
撤销
重做
清空画布
导出图片
不画了
```

## 技术栈与依赖

- 前端：React 19、Vite 8、TypeScript 6、Zustand、uuid、Canvas 2D
- 语音：浏览器 SpeechRecognition、SpeechSynthesis
- 后端：Express 本地开发服务、Vercel Serverless Functions 公网接口
- AI 能力：Anthropic SDK 兼容接口用于复杂指令解析，AgnesAI 用于图片生成兜底
- 构建运行：Node.js、npm

第三方能力说明：浏览器语音识别/TTS 用于语音交互；大模型接口用于本地规则无法覆盖的复杂指令解析；图片生成接口作为复杂视觉描述的兜底能力。核心画布对象绘制、指令规则解析和交互流程为本项目实现。

## 免费公网部署

推荐使用 Vercel Hobby 免费方案部署。Vercel 官方说明 Hobby 计划适合个人项目并可免费开始，环境变量可在项目设置中配置。Render 也提供免费 Web Service，但免费实例有休眠和资源限制；本项目采用 Vercel 一站式托管前端和 `/api/*` 接口。

### 1. 导入仓库

1. 打开 Vercel。
2. 选择 New Project。
3. 导入本 GitHub 仓库。
4. Framework Preset 选择 Other 或 Vite。
5. 保持仓库根目录作为 Root Directory。

本仓库已包含：

- `vercel.json`
- 根目录 `package.json`
- `/api` Serverless Functions

Vercel 会执行：

```bash
npm run build
```

构建输出目录为：

```text
frontend/dist
```

### 2. 配置环境变量

在 Vercel Project Settings -> Environment Variables 中配置：

```text
AGNES_API_KEY=你的 AgnesAI Key
AGNES_BASE_URL=https://apihub.agnes-ai.com
AGNES_MODEL=agnes-image-2.1-flash
ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
ANTHROPIC_AUTH_TOKEN=你的复杂指令解析 Key
ANTHROPIC_MODEL=glm-5
```

说明：

- `AGNES_API_KEY` 用于 AI 图片生成，建议必须配置。
- `ANTHROPIC_AUTH_TOKEN` 用于云端复杂指令解析；未配置时，本地规则绘图仍可使用。
- 不要把真实密钥提交到 GitHub。

### 3. 发布

配置完成后点击 Deploy。部署成功后，将 Vercel 的 Production URL 填到 README 顶部的“在线体验”位置。

### 4. 评委体验注意事项

- 建议使用 Chrome 或 Edge。
- 首次进入页面需要允许麦克风权限。
- 浏览器语音识别通常要求 HTTPS，Vercel 默认提供 HTTPS 域名。
- 如果 AI 图片生成失败，请检查 Vercel 环境变量里的 `AGNES_API_KEY`。

## 本地启动

后端：

```bash
cd server
npm install
npm run dev
```

前端：

```bash
cd frontend
npm install
npm run dev
```

默认地址：

- 前端：http://127.0.0.1:5173
- 后端：http://127.0.0.1:3001

## 环境变量

本地后端可在 `server/.env` 中配置：

```text
ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
ANTHROPIC_AUTH_TOKEN=
ANTHROPIC_MODEL=glm-5
AGNES_API_KEY=
AGNES_BASE_URL=https://apihub.agnes-ai.com
AGNES_MODEL=agnes-image-2.1-flash
```

公开仓库不应提交真实密钥。

## 项目结构

```text
voice-drawing-tool/
├── api/         # Vercel Serverless Functions
├── frontend/    # React 前端、Canvas 绘制、语音交互
├── server/      # 本地 Express 后端
└── docs/        # 设计文档
```

## 测试

```bash
cd frontend
npm run build
```

```bash
cd server
npm run build
```

语音测试建议：

1. 说“小花小花”。
2. 说“画蓝天白云和太阳”。
3. 说“画一朵花”。
4. 说“把刚才那朵花变大一点”。
5. 说“导出图片”。
6. 说“不画了”，确认回到等待唤醒。

## 提交流程建议

比赛要求保持持续 PR 记录。每个 PR 应只做一件事，并写清楚：

- 功能描述
- 实现思路
- 测试方式
