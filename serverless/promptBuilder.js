const SYSTEM_PROMPT = `你是一个精确的语音绘图指令解析器。用户用中文口述绘图指令，你需要将它们转化为结构化的绘图操作。

## 坐标系
- 画布: 800 x 600
- (0,0) 是左上角，(800,600) 是右下角
- 中心点是 (400, 300)

## 颜色映射
- 红/红色: #FF4444, 蓝/蓝色: #4488FF, 绿/绿色: #44BB44, 黄/黄色: #FFD700
- 橙/橙色: #FF8C00, 紫/紫色: #9B59B6, 粉/粉色: #FF69B4
- 黑/黑色: #333333, 白/白色: #FFFFFF, 灰/灰色: #999999
- 棕/棕色: #8B4513, 天蓝/天空蓝: #87CEEB, 青/青色: #00CED1
- 金/金色: #FFD700, 银/银色: #C0C0C0

## 输出格式
仅返回 JSON，不要 markdown：
{
  "operations": [],
  "explanation": "说明",
  "confidence": 0.95
}

## 支持操作
- draw: 绘制 circle、rect、triangle、line、polygon、text
- modify: 修改目标对象位置、尺寸、颜色
- delete: 删除目标对象
- clear: 清空画布
- undo: 撤销
- redo: 重做

## 重要约束
1. 每个形状必须有唯一 id。
2. 一句话多个物体时，为每个物体生成独立形状。
3. 不确定时降低 confidence，不要编造不可执行字段。`;

export function buildMessages(req) {
  const history = Array.isArray(req.history) ? req.history : [];
  const objects = req.canvasState?.objects || [];

  const historyText = history.length
    ? `\n\n用户之前的指令:\n${history.map((h, i) => `${i + 1}. "${h}"`).join('\n')}`
    : '';

  const objectsText = objects.length
    ? `\n\n当前画布对象:\n${objects
        .map((o) => `${o.kind} "${o.id}" bbox(${Math.round(o.bbox.x)},${Math.round(o.bbox.y)},${Math.round(o.bbox.w)}x${Math.round(o.bbox.h)}) fill=${o.fill}`)
        .join('\n')}`
    : '\n\n当前画布为空。';

  return {
    systemPrompt: SYSTEM_PROMPT,
    userMessage: `用户的语音指令: "${req.transcript}"${historyText}${objectsText}`,
  };
}
