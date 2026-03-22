---
title: 基于 Screenpipe + Ollama + Notion 打造 AI 全自动日报、周报生成、总结、追溯管理
slug: 2026-01-04-daily-report
summary: 在数字化办公时代，如何高效记录工作内容并生成高质量的日报/周报是很多开发者的痛点。本文将分享如何利用 Screenpipe（开源屏幕记录工具）、Ollama（本地大模型推理引擎）与 Notion（可视化数据库），构建一套完全运行在本地（隐私安全）且高度自动化的工作流。
category: AI自动化
categorySlug: ai-automation
type: blog
status: published
publishedAt: 2026-01-04T00:00:00.000Z
---

# 基于 Screenpipe + Ollama + Notion 打造 AI 全自动日报、周报生成、总结、追溯管理

> **摘要**：在数字化办公时代，如何高效记录工作内容并生成高质量的日报/周报是很多开发者的痛点。本文将分享如何利用 **Screenpipe**（开源屏幕记录工具）、**Ollama**（本地大模型推理引擎）与 **Notion**（可视化数据库），构建一套完全运行在本地（隐私安全）且高度自动化的工作流。
>
> **关键词**：Screenpipe, Ollama, Notion API, RAG, Local LLM, 自动化办公

---

## 1. 架构概览

本方案的核心逻辑是通过 Screenpipe 全天候后台录制屏幕与音频（数据存储在本地），利用本地部署的 LLM (Qwen2.5) 定期分析录制内容，提取关键工作项，最后通过 API 自动推送到 Notion 数据库中形成日报。通过 Notion AI 自动生成每日日报、周报并自动存储到数据库，用户可以方便地查看、管理和追溯所有工作记录。

- **数据层**：Screenpipe (本地 SQLite + 媒体文件)
- **推理层**：Ollama + Qwen2.5 (本地显卡推理)
- **表现层**：Notion Database (云端可视化与管理)

---

## 2. 环境构建 (Environment Setup)

### 2.1 Screenpipe 部署

Screenpipe 是整个系统的“眼睛”，负责底层的屏幕捕获与 OCR 处理。

1.  **获取安装包**：访问 Screenpipe 的 [GitHub Release 官方网站](https://github.com/mediar-ai/screenpipe)。
2.  **快速安装**：也可以直接在 PowerShell 中运行以下命令进行一键安装：

    ```powershell
    # 快速安装
    irm https://raw.githubusercontent.com/mediar-ai/screenpipe/main/install.ps1 | iex

    # 首次运行
    screenpipe
    ```

3.  **初始化**：首次运行 Screenpipe 时，它会自动初始化 `%LOCALAPPDATA%\.screenpipe` 目录，同时安装 ffmpeg 等一系列插件。请确保授予其屏幕录制与麦克风权限。

### 2.2 本地大模型部署 (Ollama)

为了确保工作数据的隐私安全，我们拒绝将截图上传至云端 API，而是使用 Ollama 进行本地推理。

1.  **安装 Ollama**：前往 [Ollama 官网](https://ollama.com/) 下载 Windows 版本。
2.  **拉取模型**：推荐使用 `qwen2.5`，它在中文语境下的指令遵循能力极强，且 7B 版本在主流显卡上推理速度极快。
    ```bash
    ollama pull qwen2.5
    ```
3.  **验证服务**：在终端输入 `ollama list` 确认模型已就绪。

---

## 3. 插件编译与集成 (Plugin Integration)

Screenpipe 支持插件机制（Pipes），我们需要配置 Notion 插件来实现数据打通。

### 3.1 插件部署

1.  下载修改移植的 Screenpipe-Notion-Plugin 插件：[Screenpipe-Notion-Plugin](https://github.com/zhanghongchen1213/Screenpipe-Notion-Plugin)
2.  将下载好的文件解压重命名为 `notion` ，之后插件文件夹放置于 Screenpipe 的插件目录：
    `C:\Users\[你的用户名]\.screenpipe\pipes`
3.  **编译构建**：由于插件包含 TypeScript 代码，需要进行本地构建。

    ```bash
    # 进入插件目录
    cd C:\Users\[你的用户名]\.screenpipe\pipes\notion

    # 安装依赖 (推荐 npm)
    npm install

    # 构建产物
    npm run build
    ```

### 3.2 激活插件

1.  重启 Screenpipe 服务。
2.  使用 CLI 命令检查插件状态：
    ```bash
    screenpipe pipe list
    ```
3.  如果插件未启用，执行：

    ```bash
    screenpipe pipe enable notion
    ```

    配置插件成功如下图所示
    [![yyROn0.md.png](https://i.imgs.ovh/2026/01/06/yyROn0.md.png)](https://imgloc.com/image/yyROn0)

## 4. Notion API 对接与鉴权

### 4.1 获取模版

为了配合插件的数据结构，建议下载 Notion 模版到工作空间内：

- [Activity Log (活动日志)](https://foregoing-domain-39f.notion.site/2e0be665a1c78011afd5c9dcf345b1a5?v=2e0be665a1c781b98d75000cea4cb6e8)
- [Relationship Intelligence (关系分析)](https://foregoing-domain-39f.notion.site/2e0be665a1c7801a9898cd4fc726de9b?v=2e0be665a1c7817ca33e000c80134f6b)
- [Work Log Center (工作日志中心)](https://foregoing-domain-39f.notion.site/2e0be665a1c780549ee5dd4b8dff559d)

### 4.2 创建 Integration

1.  进入 [Notion 集成](https://www.notion.so/profile/integrations/) 创建一个新的 Integration。
2.  获取 **Internal Integration Secret** (密钥)。
    [![yCxaVC.md.png](https://i.imgs.ovh/2026/01/06/yCxaVC.md.png)](https://imgloc.com/image/yCxaVC)
3.  在集成的访问权限中，授予读写权限。
    [![yCxvsH.md.png](https://i.imgs.ovh/2026/01/06/yCxvsH.md.png)](https://imgloc.com/image/yCxvsH)

### 4.3 配置 Screenpipe

1.  运行 Screenpipe 服务。
2.  访问 Notion 插件本地配置后台：`http://localhost:44719` 。
3.  填入 Notion Secret 并选择 Database ID。
    [![yCxLOX.md.png](https://i.imgs.ovh/2026/01/06/yCxLOX.md.png)](https://imgloc.com/image/yCxLOX)
4.  配置本地 Ollama 模型
    [![yCxTkQ.md.png](https://i.imgs.ovh/2026/01/06/yCxTkQ.md.png)](https://imgloc.com/image/yCxTkQ)

    可参数输入模型分析 Custom Prompt

    ```markdown
    你是一位专业的项目经理和技术助理。请根据用户提供的屏幕活动日志（包含窗口标题、应用名称和 OCR 文字识别），生成一份详细且专业的《每日工作日报》。\n\n 请按以下结构输出 Markdown 格式报告：\n\n# 📅 每日工作日报\n\n## 🚀 核心成就摘要\n 用一句话总结今天最重要的产出或进展。\n\n## 📂 主要工作内容\n 请将活动归类为具体的项目或任务领域（例如：“前端开发”、“Notion 插件调试”、“技术调研”等）。\n- **[任务领域 1]**\n - 详细描述：根据日志中的文件名、网页标题或代码片段，具体说明做了什么。\n - 关键产出：识别到的具体成果（如“修复了 API 路由 bug”、“完成了 daily-report 配置”）。\n- **[任务领域 2]**\n - 详细描述...\n - 关键产出...\n\n## ⏱️ 时间与精力分配\n 根据日志出现的频率估算：\n- **主要专注点**：[应用/任务] (例如：VS Code - 50%, Chrome - 30%)\n- **使用的工具栈**：列出主要使用的软件工具。\n\n## 🐛 问题与挑战 (如果有)\n 如果在日志中发现大量报错、搜索错误信息或反复尝试的行为，请在此记录。\n\n## 📝 总结与明日建议\n 基于今日工作流，简要建议明天的关注点。\n\n**注意**：\n1. 必须使用**简体中文**!必须使用**简体中文**!必须使用**简体中文**!不允许使用英文不允许使用英文！不允许使用英文！。\n2. 仅基于提供的数据事实，不要编造未发生的任务。\n3. 保持专业、客观的语调。
    ```

5.  配置分析频率等参数，点击保存：
    [![yCxVNm.md.png](https://i.imgs.ovh/2026/01/06/yCxVNm.md.png)](https://imgloc.com/image/yCxVNm)

6.  连通性测试
    如果看到同步成功的日志，说明链路已打通。
    [![yCxPnn.md.png](https://i.imgs.ovh/2026/01/06/yCxPnn.md.png)](https://imgloc.com/image/yCxPnn)

---

## 5. 自动化编排 (Workflow Automation)

为了实现“开机即用，用完即走”，我们需要一个自动化脚本来管理 Screenpipe 和 Ollama 的生命周期，并自动清理过期的视频文件以节省磁盘空间。
**注意**：需要根据实际情况修改 `set "User_name=Administrator"` 为你的用户名。

以下是 `Start-Screenpipe.bat` 的完整实现代码：

```batch
@echo off
setlocal EnableDelayedExpansion
set "User_name=Administrator"

echo ==========================================
echo       Screenpipe Launcher
echo ==========================================
echo.

:: 1. Clean up old video files
echo [1/4] Cleaning up old video files (keeping today and yesterday)...
set "DATA_DIR=C:\Users\%User_name%\.screenpipe\data"

:: Get today and yesterday dates using PowerShell
for /f "usebackq tokens=*" %%a in (`powershell -command "(Get-Date).ToString('yyyy-MM-dd')"`) do set "TODAY=%%a"
for /f "usebackq tokens=*" %%a in (`powershell -command "(Get-Date).AddDays(-1).ToString('yyyy-MM-dd')"`) do set "YESTERDAY=%%a"

echo [CHECK] Keep dates: %TODAY% (Today) and %YESTERDAY% (Yesterday)

if exist "%DATA_DIR%" (
    pushd "%DATA_DIR%"
    :: Iterate over mp4 files
    for %%F in (*.mp4) do (
        echo "%%F" | findstr "%TODAY%" >nul
        if errorlevel 1 (
            echo "%%F" | findstr "%YESTERDAY%" >nul
            if errorlevel 1 (
                echo [DELETE] Deleting expired file: %%F
                del "%%F"
            )
        )
    )
    popd
    echo [INFO] Cleanup complete.
) else (
    echo [WARNING] Data directory not found: %DATA_DIR%
)
echo.

:: 2. Check Ollama status
echo [2/4] Checking AI Service (Ollama)...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [INFO] Ollama is already running.
) else (
    echo [INFO] Ollama is not running, starting...
    start "Ollama Server" /MIN ollama serve
    timeout /t 5 >nul
)

:: 3. Start Screenpipe
echo [3/4] Starting Screenpipe...
if exist "C:\Users\%User_name%\screenpipe\bin\screenpipe.exe" (
    start "Screenpipe Backend" "C:\Users\%User_name%\screenpipe\bin\screenpipe.exe"
    echo [INFO] Screenpipe started.
) else (
    echo [ERROR] Screenpipe executable not found.
    pause
    exit /b 1
)

:: 4. Verify Notion plugin status
echo [4/4] Waiting for Notion plugin (port 44719)...
set "RETRIES=0"
:CHECK_PORT
netstat -an | find "44719" | find "LISTENING" >nul
if "%ERRORLEVEL%"=="0" (
    echo.
    echo [SUCCESS] Notion plugin started successfully on port 44719!
    echo [SUCCESS] Daily logging is ready.
) else (
    set /a RETRIES+=1
    if !RETRIES! LSS 20 (
        timeout /t 2 >nul
        goto CHECK_PORT
    ) else (
        echo.
        echo [WARNING] Notion plugin startup timed out.
        echo Please check Screenpipe window for errors.
        echo Screenpipe backend is running, plugin might start later.
    )
)

echo.
echo Script finished. Closing in 10 seconds.
timeout /t 10
exit
```

**使用建议**：将此脚本放置在桌面或添加到 Windows 启动项中，每天开机自动运行。

## 6. 实战演示 (Demo)

### 6.1 配置 Notion 工作日志中心

配置完成后，系统将自动在后台工作。启用 Notion AI 后，更可以实现对日志的深度分析、管理和追溯。

1.  **个性化配置**：选择**工作日志中心**的**日报总结助手**或者**周报总结助手**作为 AI 说明。
    [![yCxHIr.md.png](https://i.imgs.ovh/2026/01/06/yCxHIr.md.png)](https://imgloc.com/image/yCxHIr)
2.  **一键生成日报**：输入关键词"帮我完成今日日报" 或 "生成今天的日报"，系统将根据时间线自动汇总今日工作，并添加至**日数据库**中方便管理和回溯。
    [![yCxoqe.md.png](https://i.imgs.ovh/2026/01/06/yCxoqe.md.png)](https://imgloc.com/image/yCxoqe)
3.  **周报自动汇总**：输入关键词 "帮我完成本周周报" 或 "生成这周的周报"，系统将根据本周的日报数据，自动生成周维度总结，并添加至**周数据库**中方便管理和回溯。
    [![yCxEit.md.png](https://i.imgs.ovh/2026/01/06/yCxEit.md.png)](https://imgloc.com/image/yCxEit)

---

### 6.2 Notion AI 生成效果演示

[![yCwvsx.md.png](https://i.imgs.ovh/2026/01/06/yCwvsx.md.png)](https://imgloc.com/image/yCwvsx)

[![yCXReO.md.jpeg](https://i.imgs.ovh/2026/01/06/yCXReO.md.jpeg)](https://imgloc.com/image/yCXReO)

[![yCwONY.md.jpeg](https://i.imgs.ovh/2026/01/06/yCwONY.md.jpeg)](https://imgloc.com/image/yCwONY)

> **总结**：通过 Screenpipe + Ollama + Notion 的组合，可以成功构建了一个既保护隐私又极具生产力的本地化 AI 工作流。这不仅是一个工具的堆叠，更是对个人数据主权的一种实践。
