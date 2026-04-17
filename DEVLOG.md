# Healer Demo — 开发日志

## 项目信息

- **路径:** `/Users/jijiangshan/Desktop/healer-demo`
- **启动命令:** `npm run dev`
- **基于 PRD:** healer_demo_prd.md

---

## Step 1 — 初始化项目

**做了什么：**
- `npm create vite@latest healer-demo -- --template react-ts` 创建项目
- 安装核心依赖：`react-router-dom` `zustand` `framer-motion`

**依赖清单：**
| 包 | 用途 |
|----|------|
| react-router-dom | SPA 页面路由 |
| zustand | 轻量状态管理（情绪记录 / 贝壳）|
| framer-motion | 灵智球动画 / 标签切换动画 |

---

## Step 2 — 设计 Token（index.css）

**做了什么：**
- 清除 Vite 默认样式，重写 `index.css`
- 所有颜色、圆角、阴影、动画时长全部定义为 CSS 变量

**核心 Token 说明：**
| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-h/s/l` | 动态写入 | 时相背景色（由 useTimePhase 控制）|
| `--text-primary` | 动态写入 | 随时相切换深色/浅色文字 |
| `--color-primary` | `hsl(35,80%,60%)` | 暖琥珀，主品牌色 |
| `--color-accent` | `hsl(15,70%,60%)` | 暖珊瑚，强调色 |
| `--emotion-1~9` | hsl 系列 | 情绪色谱，1-10分对应 |
| `--radius-lg/md/sm` | 20/16/12px | 统一圆角 |
| `--nav-height` | 64px | 底部导航高度，各页面用于底部留白 |

**注意：** 非时相页面（记录页/疗愈页）背景固定用 `var(--color-bg)`，不受时相影响。

---

## Step 3 — SpiritSphere + useTimePhase

**做了什么：**
- 从 Kanjian 项目移植两个文件，适配 Healer Token
- `useTimePhase.ts`：每分钟检测时段，将 `--bg-h/s/l` 和文字色写入 `document.documentElement`
- `SpiritSphere.tsx`：新增 `onTap` / `onLongPress` props 作为外部插口

**时相映射：**
| 时段 | 时间 | bgH | 问候语 |
|------|------|-----|--------|
| 晨 | 5-11 | 210（蓝） | 早安，今天也要好好的 |
| 午 | 11-17 | 35（暖黄）| 午安，此刻感觉怎么样？ |
| 晚 | 17-21 | 15（橙）  | 晚上好，今天辛苦了 |
| 夜 | 21-5  | 230（深蓝）| 夜深了，陪你把今天收尾 |

**灵智球交互：**
| 手势 | 行为 | 插口状态 |
|------|------|----------|
| 单击/抬起 | 跳转 `/record` | 已接入 |
| 长按 800ms | 涟漪 + 震动反馈 | 预留 `onLongPress` prop |
| 双击 | （移除，避免误触）| — |

---

## Step 4 — Layout + BottomNav + Router

**做了什么：**
- `Layout.tsx`：`<Outlet>` + `<BottomNav>` 组合，所有页面共享
- `BottomNav.tsx`：5 Tab，用 `NavLink` 实现激活态 opacity 切换
- `App.tsx`：`BrowserRouter` + 嵌套路由，疗愈子页面统一用 `ComingSoon` 占位

**路由表：**
| 路由 | 组件 | 状态 |
|------|------|------|
| `/` | HomePage | ✅ 完成 |
| `/record` | RecordPage | ✅ 完成 |
| `/stories` | StoriesPage | ✅ 框架完成 |
| `/cabin` | CabinPage | ✅ 框架完成 |
| `/me` | MePage | ✅ 框架完成 |
| `/healing/*` | ComingSoon | 🔌 插口预留 |

---

## Step 5 — 首页（HomePage）

**做了什么：**
- 全屏布局，不滚动
- 顶部：时段问候语（fade-in，delay 0.3s）
- 中心：灵智球（scale 弹入动画）
- 底部：7 天情绪日历浮层（毛玻璃卡片）

**日历色块逻辑：**
- 有记录 → 显示情绪色 + 分数数字
- 无记录 → 显示灰色占位
- 今日 → 加 `--color-primary` 描边
- 夜间模式 → 浮层背景变为深色半透明

**数据来源：** `useAppStore().getRecentDays(7)` 从 localStorage 读取

---

## Step 6 — 记录页（RecordPage）

**做了什么：**
- 情绪滑块 1-10，拖动时表情/颜色/文字实时变化
- 标签系统：5 个分类 Tab + 预设标签，可多选，选中态跟随情绪色
- 文字描述区（textarea）
- 保存 → 写入 store → 800ms 后返回首页，首页日历自动更新
- 媒体上传区（🎤📷）保留占位，透明度降低表示未激活

**情绪色插值：**
```
1-2  → hsl(210,20%,70%)  雾蓝灰
3-4  → hsl(30,15%,65%)   暖灰褐
5-6  → hsl(35,50%,60%)   暖沙色
7-8  → hsl(35,80%,60%)   暖琥珀（主色）
9-10 → hsl(15,70%,60%)   暖珊瑚（强调色）
```

**贝壳奖励：** 每次保存记录 `shells += 1`（store 自动处理）

---

## Step 7 — 其他页面框架

**StoriesPage（疗愈中心）：**
- 2x2 网格展示 4 个循证疗愈模块
- 深度探索 2 个模块（列表式）
- 锁定状态：opacity 0.5 + 🔒 + "N天解锁"
- `MODULES` 数组化配置，后续添加模块改数组即可

**CabinPage（小屋）：**
- 挂画墙 3 格占位
- 小屋场景 emoji 占位
- 贝壳数量展示（从 store 读取）

**MePage（我的）：**
- 记录次数 / 使用天数 / 贝壳 三项统计
- 设置项列表占位（通知/导出/清除）

---

## 🔌 插口索引

后续开发时，搜索 `PLUGIN POINT` 关键词找到所有接入点：

| 文件 | 插口 | 接入说明 |
|------|------|----------|
| `SpiritSphere.tsx` | `onLongPress` prop | 接入呼吸引导页 |
| `RecordPage.tsx` | `🎤📷` 占位区 | 接入 VoiceRecorder / ImageUploader |
| `StoriesPage.tsx` | `MODULES` 数组 | 修改 `locked: false` + 真实路由即可激活 |
| `CabinPage.tsx` | 挂画墙区域 | 接入 AI 挂画列表渲染 |
| `MePage.tsx` | 设置列表 | 接入通知、导出、清除逻辑 |
| `App.tsx` | `ComingSoon` 路由 | 替换为真实页面组件 |
| `appStore.ts` | `EmotionRecord` 类型 | 添加 `arousal` / `mediaAttachments` 字段 |

---

## 待办（下一阶段）

- [ ] 三件好事完整流程（预设 AI 回应）
- [ ] 呼吸练习（Web Audio API 白噪音 + 呼吸动画）
- [ ] 漂流瓶（15分钟倒计时 + 消失/保留选择）
- [ ] 记录页多媒体（语音录制 + 图片上传）
- [ ] 历史记录页（按日期分组列表）
- [ ] 小屋场景 SVG（替换 emoji 占位）
