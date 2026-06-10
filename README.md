# Job Headmap（求职热力图/求职记录神器）

> 本地使用的求职投递记录工具——数据存在用户本地，支持 csv 格式导出

## 安装（macOS Apple Silicon）

1. 从 [Releases 页面](https://github.com/Wang-Qiulu/job-headmap/releases) 下载最新的 `JobHeadmap_x.x.x_aarch64.dmg`
2. 双击挂载 DMG
3. **把 `JobHeadmap.app` 拖到 Applications 文件夹**

**如果出现"已损坏，无法打开"**，在**终端**跑这一行命令：

```bash
xattr -dr com.apple.quarantine /Applications/JobHeadmap.app
```

## 功能

- 📊 6 个月 GitHub 风格热力图（投递 / 面试可切换）
- 📈 7 个关键指标 Hero 卡片（应聘 / 已投 / 笔试 / 1 面 / 2 面 / 3 面 / Offer），含响应率与进面率
- 🗂 可排序、可筛选的岗位列表，状态可直接下拉切换
- 📝 右侧抽屉详情 + 自动保存 + 完整状态时间线（自动记录）
- ➕ 新增 / 编辑 / 删除（模态框）
- ⌨️ 快捷键：按 `N` 直接打开"新增"


## 技术栈

| 层 | 选型 |
| --- | --- |
| UI | Vite 5 + React 18 + TypeScript 5 + Tailwind 3 |
| 状态 | Zustand 5 + Zod（持久化双模式：Tauri 文件 / 浏览器 localStorage） |
| 桌面壳 | Tauri 2 (Rust，ad-hoc 签名，2.4 MB .app / 1.4 MB DMG) |
| 动效 | Framer Motion |
| 日期 | date-fns |
| 图标 | Lucide React |



## 设计风格

- 100% 亮色模式，CSS 变量结构已铺好，后续切深色低成本
- 全局表格数字（`font-feature-settings: 'tnum'`）撑出"仪表盘"质感
- 状态色克制：灰阶为主，仅 `Offer` 单点绿色
- 灵感：GitHub / Linear / Vercel / Notion


## License

MIT
