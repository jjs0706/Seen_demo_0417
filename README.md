# Healer Demo

情绪管理辅助 App 原型，基于循证心理学设计，结合 AI 陪伴与沉浸式交互场景。

---

## 产品设计逻辑

### 核心理念

> 用户不需要被"治愈"，需要被"看见"。

Healer 的设计出发点是**情绪陪伴**，而非治疗。所有功能模块围绕三个层次展开：

```
记录（看见自己）→ 疗愈（被接纳）→ 栖居（建立安全感）
```

### 信息架构

```
首页
├── 灵智球（情绪入口，单击进入记录）
├── 时相背景（早/午/晚/夜 动态色彩）
└── 7日情绪日历（底部浮层）

记录页
├── 情绪滑块 1-10
├── 分类标签（多选）
└── 文字描述 + 媒体占位

疗愈中心
├── 三件好事（正向积累）
├── 漂流瓶（匿名倾诉）
├── 灯塔守护者（AI 对话陪伴）
├── 呼吸练习（4-7-8 呼吸法）
└── 梦境分析（AI 解析 + 图像生成）

小屋
├── 心灵挂画墙（梦境生成的画）
├── 3D 花海场景（CottageStage）
└── 沙盘创作（植物拖拽摆放）

我的
├── 情绪记录历史（按日期分组）
└── 统计数据（记录次数/天数/贝壳）
```

### 设计决策

| 决策 | 原因 |
|------|------|
| 灵智球单击进记录 | 降低记录门槛，减少路径 |
| 时相背景色 | 配合用户生理节律，减少割裂感 |
| 贝壳奖励机制 | 轻量正向反馈，不构成压力 |
| AI 用豆包 ARK | 国内直连，网络稳定 |
| 图像生成用豆包 Seedream | 国内直连，质量高 |
| 沙盘用 PNG 精灵 | 等距风格统一，开发成本低 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | React 19 + TypeScript + Vite |
| 路由 | React Router v7 |
| 状态 | Zustand + persist（localStorage）|
| 动画 | Framer Motion |
| 3D | @react-three/fiber + @react-three/drei |
| AI 文字 | 豆包 ARK API（doubao-seed-1-8-251228）|
| AI 图像 | 豆包 Seedream（doubao-seedream-4-0-250828）|
| 样式 | CSS Variables（设计 Token 系统）|

---

## 代码结构

```
src/
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx          # Outlet + BottomNav 壳
│   │   └── BottomNav.tsx       # 5 Tab 底部导航
│   └── SpiritSphere/
│       └── SpiritSphere.tsx    # 灵智球（3环动画 + 长按涟漪）
│
├── hooks/
│   └── useTimePhase.ts         # 时相检测，每分钟更新 CSS 变量
│
├── store/
│   └── appStore.ts             # Zustand store
│                               #   records[]     情绪记录
│                               #   threeGoods[]  三件好事记录
│                               #   paintings[]   小屋挂画
│                               #   shells        贝壳数量
│
├── services/
│   └── deepseek.ts             # AI 服务（实际接豆包 ARK）
│                               #   chat()        单次对话
│                               #   chatStream()  流式对话
│                               #   generateImage() 图像生成
│
├── pages/
│   ├── HomePage/               # 首页：时相背景 + 灵智球 + 日历
│   ├── RecordPage/             # 记录页：滑块 + 标签 + 描述
│   ├── HistoryPage/            # 历史页：按日期分组的记录列表
│   ├── StoriesPage/            # 疗愈中心：模块网格 + 深度探索
│   ├── HealingPages/
│   │   ├── ThreeGoodPage.tsx   # 三件好事 + AI 回应
│   │   ├── DriftBottlePage.tsx # 漂流瓶 + AI 陌生人回信
│   │   ├── LighthousePage.tsx  # 灯塔守护者流式 AI 聊天
│   │   ├── BreathePage.tsx     # 4-7-8 呼吸练习（纯动画）
│   │   └── DreamPage.tsx       # 梦境分析 + Seedream 生图
│   ├── CabinPage/
│   │   ├── CabinPage.tsx       # 小屋主页：挂画墙 + 入口
│   │   └── CottageStage.tsx    # R3F 花海 + GLB 小屋模型
│   ├── SandPage/
│   │   ├── SandPage.tsx        # 沙盘主页：Canvas + 抽屉
│   │   └── SandSprite.tsx      # 可拖拽 PNG 精灵（alpha 感知）
│   ├── SandboxPage/            # 等距沙盘旧版（Three.js vanilla）
│   └── MePage/                 # 我的：统计 + 历史入口
│
public/
├── sandbox/                    # 沙盘素材（PNG 透明底）
│   ├── base.png                # 草地底座
│   ├── cherry.png              # 樱花树
│   ├── oak.png                 # 橡树
│   ├── daisy.png               # 小雏菊
│   └── silver.png              # 银叶菊
├── models/
│   └── my_cottage.glb          # 小屋 3D 模型
└── IMG_4472.JPG                # 油画背景图
```

---

## API 配置

```typescript
// src/services/deepseek.ts
const ARK_KEY = 'ark-xxx'               // 豆包 ARK API Key
const ARK_MODEL = 'doubao-seed-1-8-251228'          // 文字模型
const IMAGE_MODEL = 'doubao-seedream-4-0-250828'    // 图像模型
const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3'
```

---

## 插口索引（Plugin Points）

搜索 `🔌 PLUGIN POINT` 找到所有预留接入点：

| 位置 | 插口内容 |
|------|----------|
| `SpiritSphere.tsx` | `onLongPress` → 接入呼吸引导 |
| `RecordPage.tsx` | 🎤📷 占位 → 语音/图片上传 |
| `StoriesPage.tsx` | MODULES 数组 → 新增模块改数组 |
| `CabinPage.tsx` | 挂画墙 → 支持更多画作来源 |
| `SandSprite.tsx` | `modelPath` prop → 替换为 GLB 3D 模型 |
| `appStore.ts` | EmotionRecord 类型 → 扩展字段 |

---

## 已知 Bug / 待解决问题

### 沙盘（SandPage）

| 问题 | 现象 | 状态 |
|------|------|------|
| 精灵遮挡 | 两个植物靠近时点击可能选中错误的 | 已修复（alpha 感知 raycast）|
| 拖拽偏移 | 点击位置非中心时元素会跳位 | 已修复（dragOffset 记录）|
| 边界溢出 | 植物可以拖到底座外面 | 已修复（BOUNDS clamp）|
| Suspense 闪退 | 添加新元素时底座消失再出现 | 已修复（独立 Suspense）|
| 底座旋转 | 底座渲染角度与相机视角可能不完全对齐 | 待调优 |

### AI 功能

| 问题 | 现象 | 状态 |
|------|------|------|
| 流式中断 | 网络波动时灯塔守护者流式输出中断，fallback 文案兜底 | 已处理 |
| 图像生成慢 | Seedream 生图约 10-20s，无进度指示 | 待优化（加 loading 动画）|
| Prompt 解析 | DreamPage 的 `[IMAGE: ...]` 格式 AI 偶尔不遵守 | 已有 fallback 默认 prompt |

### 通用

| 问题 | 现象 | 状态 |
|------|------|------|
| CottageStage 警告 | `Stage` 变量未使用的 TS 警告 | 低优先级 |
| GLB 加载慢 | `my_cottage.glb` 58MB，首次加载卡顿 | 待压缩模型 |
| 时相色彩 | 非首页页面背景不受时相影响（设计决策）| 已知 |

---

## 本地启动

```bash
cd healer-demo
npm install
npm run dev
# 访问 http://localhost:5173
```

### 主要路由

| 路由 | 页面 |
|------|------|
| `/` | 首页 |
| `/record` | 情绪记录 |
| `/history` | 历史记录 |
| `/stories` | 疗愈中心 |
| `/healing/three-good` | 三件好事 |
| `/healing/drift-bottle` | 漂流瓶 |
| `/healing/lighthouse` | 灯塔守护者 |
| `/healing/breathe` | 呼吸练习 |
| `/healing/dream` | 梦境分析 |
| `/cabin` | 小屋 |
| `/cabin/stage` | 花海场景 |
| `/sand` | 沙盘创作 |
| `/me` | 我的 |
