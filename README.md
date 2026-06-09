# 投递工具 / Job Headmap

> A local-first job application tracker — data lives in a real file on your disk, not a browser tab.
> 本地优先的求职投递记录工具——数据真存在你硬盘上的一个 JSON 文件里，不在浏览器缓存里。

## 安装（macOS Apple Silicon）

1. 从 [Releases 页面](https://github.com/Wang-Qiulu/job-headmap/releases) 下载最新的 `JobHeadmap_x.x.x_aarch64.dmg`
2. 双击挂载 DMG
3. **把 `JobHeadmap.app` 拖到 Applications 文件夹**

**如果出现"已损坏，无法打开"（macOS 15 Sequoia 必现）**，在**终端**跑这一行命令：

```bash
xattr -dr com.apple.quarantine /Applications/JobHeadmap.app
```

跑完再双击就能开了。这条命令把 macOS 给 App 打的"从互联网下载"标记清掉——App 文件本身没坏，是 macOS 嫌它没花 $99/年买 Apple Developer 证书。我们没付，所以只能手动绕一下。

> macOS 14 及更早版本可以走"右键 → 打开"绕过；15 Sequoia 把它收紧到只能用 `xattr` 这条路。

## 数据存哪儿

```
~/Library/Application Support/com.jobheadmap.dashboard/
├── data.json                          # 当前数据
└── backups/
    ├── data-20260609-143055.json      # 每次写入自动备份
    └── ...                            # 保留最近 7 份
```

- **真正的本地文件**——你能在 Finder 里看到、能用 iCloud Drive / 坚果云同步、能 grep
- **原子写**——`.tmp` + fsync + rename，断电不丢
- **7 份滚动备份**——误删了改名覆盖 `data.json` 即可恢复
- 卸载 App（拖到废纸篓）**不会**删数据目录；要彻底清掉手动 `rm -rf` 上面那个路径

## 功能

- 📊 6 个月 GitHub 风格热力图（投递 / 面试可切换）
- 📈 7 个关键指标 Hero 卡片（应聘 / 已投 / 笔试 / 1 面 / 2 面 / 3 面 / Offer），含响应率与进面率
- 🗂 可排序、可筛选的岗位列表，状态可直接下拉切换
- 📝 右侧抽屉详情 + 自动保存 + 完整状态时间线（自动记录）
- ➕ 新增 / 编辑 / 删除（模态框）
- ⌨️ 快捷键：按 `N` 直接打开"新增"

## 自己开发

需要装好 Node 20+ 和 Rust 工具链（`rustup` 一键装）。

```bash
npm install

# 日常开发 —— 浏览器里跑，HMR 快，数据走 localStorage
npm run dev:web         # → http://localhost:5173

# 完整 Tauri 调试 —— 起 webview，数据走真实文件
npm run dev

# 打 macOS DMG —— 出在 src-tauri/target/release/bundle/dmg/
npm run build
```

构建脚本背后做的事：

| 命令 | 干了什么 |
| --- | --- |
| `npm run dev:web` | 纯 Vite，浏览器开发，数据走 `localStorage` |
| `npm run dev` | `tauri dev`，起 webview，数据走 `~/Library/.../data.json` |
| `npm run build:web` | 仅前端构建 → `dist/` |
| `npm run build:app` | `tauri build`，只出 `.app` 包 |
| `npm run build:dmg` | 把已有 `.app` 用 `hdiutil` 打成 DMG（绕过 Tauri 自带 create-dmg 在 iCloud Drive 路径下 Finder 超时的问题） |
| `npm run build` | `build:app` + `build:dmg` 一条龙 |
| `npm run lint` | `tsc --noEmit` 类型检查 |

## 技术栈

| 层 | 选型 |
| --- | --- |
| UI | Vite 5 + React 18 + TypeScript 5 + Tailwind 3 |
| 状态 | Zustand 5 + Zod（持久化双模式：Tauri 文件 / 浏览器 localStorage） |
| 桌面壳 | Tauri 2 (Rust，ad-hoc 签名，2.4 MB .app / 1.4 MB DMG) |
| 动效 | Framer Motion |
| 日期 | date-fns |
| 图标 | Lucide React |

## 项目结构

```
job-headmap/
├── src/                          # React 前端（业务代码）
│   ├── App.tsx                   #   顶层布局 + 状态编排
│   ├── components/               #   ApplicationDrawer/Table/Form, Heatmap, HeroStats…
│   ├── lib/
│   │   ├── utils.ts              #   cn(), 日期, 统计, 热力图数据
│   │   └── persistStorage.ts     #   ⭐ Tauri / localStorage 双模式 storage 适配
│   ├── store/useStore.ts         #   Zustand store
│   └── types/index.ts            #   Zod schema + 状态机
├── src-tauri/                    # Rust 端
│   ├── src/
│   │   ├── lib.rs                #   tauri::Builder + invoke handlers
│   │   └── storage.rs            #   load_data / save_data / data_dir（原子写 + 备份轮转）
│   ├── tests/storage_atomicity.rs#   4 个集成测试覆盖原子写与轮转
│   ├── tauri.conf.json
│   └── Cargo.toml
├── scripts/pack-dmg.sh           # hdiutil 打 DMG 兜底脚本
├── 需求文档/                       # PRD / 设计草图 / 修复计划 / v2.0 桌面化设计
└── public/favicon.svg
```

## 设计风格

- 100% 亮色模式，CSS 变量结构已铺好，后续切深色低成本
- 全局表格数字（`font-feature-settings: 'tnum'`）撑出"仪表盘"质感
- 状态色克制：灰阶为主，仅 `Offer` 单点绿色
- 灵感：GitHub / Linear / Vercel / Notion

## Roadmap

- ⌘K command palette
- 深色模式
- 标签 / 薪资 / 推荐人字段
- 响应率趋势图
- JSON / CSV 导入导出（v2.0 暂未做——本地文件本身已经能解决数据安全感问题）

## License

MIT — 拿去用，不署名也行。
