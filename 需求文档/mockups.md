# Job Dashboard — 页面布局草图 (v2 最终版)

> 三张关键页面的 ASCII 草图 + 完整 design tokens。
> 本次更新反映最终决策。

## 🎯 最终决策 (v2)

| 决策项 | 最终方案 |
|--------|---------|
| 热力图范围 | **近 6 个月**（约 26 周）|
| 主题 | **仅亮色**，CSS 变量结构预留暗色 |
| 详情页增强 | **状态变更 Timeline**（自动记录）|
| Hero 数字 | **7 个**（Total/Written/1st/2nd/3rd/Offer + 漏斗转化率）|
| Trend 提示 | ❌ **不要**，只纯数字 |
| 表格行高 | **40px 舒展** |
| 状态色 | ⚫⚪ **全黑灰 + 一抹绿**（仅 Offer 用 success 绿）|
| 导入导出 | MVP 不做 |
| 命令面板 | MVP 不做 |

## Design Tokens (定下来就不动)

```
颜色
  bg           #ffffff
  bg-soft      #fafafa          (卡片 hover / 行分隔)
  bg-mute      #f3f4f6          (chip / input bg)
  border       #e5e7eb          (1px 实线)
  border-soft  #f3f4f6          (表格行分隔)
  text-1       #111827          (主标题、Hero 数字)
  text-2       #6b7280          (次级文字、描述)
  text-3       #9ca3af          (辅助、placeholder)
  accent       #111827          (按钮、链接 — 不滥用蓝)
  success      #10b981          (仅 Offer 用绿)
  heatmap-0    #ebedf0
  heatmap-1    #9be9a8
  heatmap-2    #40c463
  heatmap-3    #30a14e
  heatmap-4    #216e39

字体
  sans    Inter, -apple-system, system-ui
  mono    JetBrains Mono, ui-monospace
  用 mono 的地方: 所有数字、日期、状态计数、表格内容

字号阶梯
  xs    11px / 16
  sm    13px / 20   ← 表格 / chip
  base  14px / 20   ← 默认
  md    15px / 22
  lg    18px / 26
  xl    24px / 32
  2xl   32px / 38
  3xl   48px / 56   ← Hero 数字

间距 (4 基准)
  1=4   2=8   3=12   4=16   6=24   8=32   12=48   16=64

圆角
  sm   4px   (input, chip)
  md   6px   (button, table cell)
  lg   8px   (card)
  xl   12px  (drawer, modal)

热力图单元
  size  12px
  gap   3px
  rx    2px
```

## 状态色映射（克制版）

```
Applied    ⚪  text-2
Written    ⚪  text-1 (深一档灰)
1st Round  ⚫  text-1 实心点
2nd Round  ⚫  text-1 实心点
3rd Round  ⚫  text-1 实心点
Offer      🟢  success 绿点 + 极淡绿底
Rejected   ⚪  text-3 灰点（低调）
```

---

## 1. 主页 (Desktop 1440)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Job Dashboard                                  🔍  Search...   [+ New]  │ ← 56px sticky
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─ HERO STATS ──────────────────────────────────────────────────────┐  │
│   │                                                                    │  │
│   │   247        38        12        8        4        2        1     │  │ ← 32px mono
│   │   ─────      ─────     ───       ───      ───      ───     ─     │  │ ← 13px text-2
│   │   Total      Written   1st       2nd      3rd      Offer   ...   │  │   等距对齐
│   │   Applied    Tests     Round     Round    Round                   │  │
│   │                                                                    │  │
│   │   Response rate 15.4%  ·  Interview→Offer 50%  ·  Funnel 4/247    │  │ ← 12px text-3
│   │                                                                    │  │
│   └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   ┌─ ACTIVITY ────────────────────────────────────────────────────────┐  │
│   │                                                                    │  │
│   │   147 applications in the last 6 months                            │  │
│   │                                                                    │  │
│   │   [ Applications ]  Interviews        ←  →   Longest: 23 days 🔥  │  │
│   │                                                                    │  │
│   │            Dec '25   Jan '26   Feb '26   Mar '26   Apr '26   May '26│  │
│   │   Mon   ░ ░ ░ ░ ░ ░ ░ ░ ▓ ░ ░ ░ ░ ░ ░ ▒ ░ ░ ░ ▓ ░ ░ ░ ░ ░         │  │
│   │   Wed   ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ▓ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░         │  │
│   │   Fri   ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░         │  │
│   │   Sun   ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░         │  │
│   │                                                                    │  │
│   │   Less ░ ░ ▒ ▓ █ More                                            │  │
│   │                                                                    │  │
│   └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   ┌─ APPLICATIONS ────────────────────────────────────────────────────┐  │
│   │  [ All 147 ] [ Applied 89 ] [ Written 12 ] [ 1st 8 ] [ 2nd 4 ] [ Offer 1 ] │  │
│   │  ─────────────────────────────────────────────────────────────     │  │
│   │  Company      Position          Applied     Status       Actions   │  │ ← sticky header
│   │  ──────────   ──────────────    ──────────  ───────────  ────────  │  │ ← 1px soft border
│   │  ByteDance    Frontend Eng      2026-05-28  [ 1st ▾ ]    ✎  ✕      │  │ ← 40px row
│   │  ─────────────────────────────────────────────────────────────     │  │
│   │  Anthropic    Design Eng        2026-05-26  [ Applied ▾ ] ✎  ✕     │  │
│   │  ─────────────────────────────────────────────────────────────     │  │
│   │  Vercel       SWE               2026-05-24  [ Written ▾ ] ✎  ✕     │  │
│   │  ...                                                               │  │
│   │                                                                    │  │
│   │  Showing 1-20 of 147                              < 1 2 3 ... 8 > │  │
│   └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
   max-w 1200,  px-8,  gap-y-6
```

### 视觉细节备注

- **Hero 数字**：32px / 38, JetBrains Mono + `tabular-nums`，等宽对齐
- **数字下只显示标签**：13px text-2，不加 trend 箭头（保持极简）
- **状态 tabs**：选中态底部 2px 黑线，未选态 text-3，hover 变 text-2
- **表格行 hover**：bg-soft
- **操作图标 ✎ ✕**：默认 text-3，hover 变 text-1
- **状态 dropdown**：和 chip 一致，右侧 chevron，宽度根据内容自适应

---

## 2. 热力图特写

```
      Dec '25      Jan '26      Feb '26      Mar '26      Apr '26      May '26
   ░ ░ ░ ░ ░ ░ ░ ░ ▓ ░ ░ ▒ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░
   ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░
   ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░
   ░ ░ ▒ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░
   ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░
   ▓ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░


   ┌──── HOVER (2026-03-15) ──────────────────┐
   │  3 contributions                          │  ← 13px text-1
   │  March 15, 2026                            │  ← 11px text-3
   └────────────────────────────────────────────┘
            │
            ▼  ▓  ← 1px 黑边 + 略微放大 (1.1x)
```

### 实现要点

- 6 个月 ≈ 26 周 × 7 天 = 182 格子
- 颜色分级（**百分位自适应**，5 档）：
  - 0: heatmap-0
  - 1: heatmap-1
  - 2-3: heatmap-2
  - 4-5: heatmap-3
  - 6+: heatmap-4
- 月份分隔不加竖线，靠月份标签视觉分组（更干净）
- "今天"格子 1px 黑色 outline，inset
- 切换 mode 时颜色淡入淡出 200ms
- 顶部摘要 `147 applications in the last 6 months` + streak 提示
- ← → 按钮：6 个月范围内滚动（其实范围固定，更多是占位 / 心理按钮，或者以后扩展到 12 个月）

---

## 3. 详情抽屉 (560px)

```
       ┌─────────────────────────────────────┐
       │  ✕                                ⋯ │
       │                                     │
       │  ByteDance                          │ ← 24px xl
       │  Senior Frontend Engineer           │ ← 15px text-2
       │  ────────────────────────────       │
       │  Beijing · applied 12 days ago      │ ← 12px text-3
       │                                     │
       │  ┌───────────────────────────────┐  │
       │  │ Status   [ 1st Round      ▾ ] │  │
       │  └───────────────────────────────┘  │
       │  ┌───────────────────────────────┐  │
       │  │ Apply date  2026-05-28       │  │
       │  └───────────────────────────────┘  │
       │  ┌───────────────────────────────┐  │
       │  │ URL       ↗ job.bytedance... │  │
       │  └───────────────────────────────┘  │
       │                                     │
       │  Notes                              │
       │  ┌───────────────────────────────┐  │
       │  │ Recruiter: Sarah              │  │
       │  │ Referral: yes                 │  │
       │  │ Next: take-home by Fri        │  │
       │  └───────────────────────────────┘  │
       │                                     │
       │  ─── TIMELINE ──────────────────    │
       │                                     │
       │     ●  1st Round                    │
       │     │  May 30, 2026 · 3:42 PM       │ ← pulse
       │     │                               │
       │     ●  Written                      │
       │     │  May 28, 2026 · 10:15 AM      │
       │     │                               │
       │     ●  Applied                      │
       │     │  May 22, 2026 · 9:00 AM       │
       │     │                               │
       │     ●  Created                      │
       │        May 22, 2026                 │
       │                                     │
       │  ─────────────────────────────────  │
       │  [ Delete ]              [ Save ]   │
       └─────────────────────────────────────┘
       ↑ 560px 宽，左圆角 12px
```

### Timeline 视觉细节

- 节点：`●` 8px 圆，描边 2px
- 颜色：默认全 text-1 黑灰，**只有当前最新节点用 success 绿**（与状态色克制原则一致）
- 连接线：1px dashed，text-3
- 当前状态节点：实心 + 微弱 pulse
- 字段 onBlur 自动保存（debounced 500ms），右上角 "Saving..." → "Saved"
- URL 点击新窗口打开

---

## 整体审美原则

1. **留白 > 信息密度**：宁可少放元素
2. **数字永远 mono**：tabular-nums 让表格对齐让 Hero 数字有"仪表盘"感
3. **状态色克制**：全黑灰 + Offer 一抹绿，**绝不滥用彩色**
4. **阴影几乎不存在**：1px border + bg-soft 分层就够了
5. **动画一律 < 250ms**：长了就显廉价
6. **空状态也要美**："No applications yet. Add your first one to start tracking."

---

## 📋 数据模型（最终）

```ts
type Status = 'planned' | 'applied' | 'written' | '1st' | '2nd' | '3rd' | 'offer' | 'rejected'

interface Application {
  id: string                    // uuid
  company: string
  position: string
  applyDate: string             // ISO date
  status: Status
  statusHistory: Array<{        // 自动记录
    status: Status
    changedAt: string           // ISO datetime
  }>
  url?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

---

## 🛠 实施步骤

1. **脚手架** — Vite + React + TS + Tailwind + 设计 token
2. **数据层** — Zustand + Zod + localStorage 同步（带 schema 版本号）
3. **Hero Stats** — 7 数字 + 漏斗
4. **热力图** — 6 个月，tooltip，模式切换
5. **表格** — 筛选 / 排序 / 行内状态 / sticky header
6. **抽屉** — 编辑 + Timeline
7. **新增 / 删除** — 弹窗 + toast
8. **打磨** — 动效 / 空状态 / 键盘快捷键
