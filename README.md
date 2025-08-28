# 桌面便签（Electron）

一个轻量、现代的 Windows 桌面便签应用。基于 Electron + 原生 HTML/CSS/JS，支持增删改查、置顶、透明度/背景/字体颜色调整、显示/隐藏、托盘驻留与本地 JSON 持久化。

## 环境要求
- Node.js 16+（推荐 18/20）
- Windows 10/11

## 项目结构
```
project-root/
  ├─ main/                 # 主进程：窗口、IPC、托盘、存储
  │   ├─ main.js
  │   ├─ preload.js
  │   └─ storage.js
  ├─ sticky_note_prototype_updated.html  # 渲染进程（UI 原型）
  ├─ icon.png / icon.ico   # 应用与托盘图标（推荐提供 icon.ico）
  ├─ package.json
  └─ README.md
```

## 启动流程（开发）
1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动应用（开发模式）：
   ```bash
   npm run start
   ```
3. 启动即显示主窗口；托盘同时创建。

## 打包流程（Windows）
1. 生成安装包（NSIS）：
   ```bash
   npm run build
   ```
2. 产物位置：`build/` 目录；可执行文件与安装包均在其中。
3. 图标：
   - 打包时优先使用根目录 `icon.ico` 作为安装包/任务栏/托盘图标；若未提供则回退 `icon.png`。

## 主要功能与使用
- 新建：在底部输入框输入内容并回车
- 划线/取消：点击每行左侧圆圈
- 编辑：直接修改行内文本
- 删除：点击右侧“✕”
- 设置：点击右上角齿轮，可调整透明度、背景色、字体色，并通过“选择目录”设置 `notes.json` 默认存储目录
- 显示/隐藏：点击“眼睛”图标
- 置顶：点击图钉图标（调用 `setAlwaysOnTop`）
- 关闭：点击右上角“✕”最小化到任务栏
- 拖动：按住标题栏空白区域可以拖动窗口

## 数据存储
- 设置文件：`%APPDATA%/desktop-sticky-notes/settings.json`
- 便签文件：
  - 默认：`%APPDATA%/desktop-sticky-notes/notes.json`
  - 若在设置中选择“默认数据目录”，则保存到该目录下的 `notes.json`

## 常见问题
- 图标不显示：请在根目录提供透明的 `icon.ico`（包含 16/20/32/48/64/128/256 多尺寸）或 `icon.png`，然后重新启动/重新打包。
- 托盘找不到：系统可能合并了托盘图标，请展开托盘查看更多。
- 权限问题：若设置的数据目录需要管理员权限，建议更换到用户有写入权限的路径。

## 脚本
- `npm run start`：开发启动 Electron
- `npm run build`：使用 electron-builder 打包 Windows 安装包

---
如需自定义功能（全局快捷键、自动更新、拖拽排序、暗色主题等），欢迎提出需求。
