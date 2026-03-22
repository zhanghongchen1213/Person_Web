---
title: 从零搭建企业级设备管理平台：BMAD + Pencil + Claude Code AI全流程实战开发
slug: 2026-01-29-bamd-pencil
summary: 本文分享如何使用 BMAD 方法论、Pencil 设计工具和 Claude Code AI 编程助手，从零搭建一个完整的企业设备烧录、管理、质量分析平台
category: AI编程
categorySlug: blog
type: blog
status: published
publishedAt: 2026-01-29T00:00:00.000Z
---

# 从零搭建企业级设备管理平台：BMAD + Pencil + Claude Code AI全流程实战开发

> 本文分享如何使用 BMAD 方法论、Pencil 设计工具和 Claude Code AI 编程助手，从零搭建一个完整的企业设备烧录、管理、质量分析平台。

## 效果预览

### Pencil 设计稿

|                                        Pencil设计稿                                         |                                        Pencil设计稿                                         |
| :-----------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: |
| [![登录页面](https://i.imgs.ovh/2026/01/29/yMSWTb.md.png)](https://imgloc.com/image/yMSWTb) | [![系统首页](https://i.imgs.ovh/2026/01/29/yMSnP1.md.png)](https://imgloc.com/image/yMSnP1) |

### 设备管理

|                                          设备操作                                           |                                          设备历史                                           |
| :-----------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: |
| [![设备检测](https://i.imgs.ovh/2026/01/29/yMSXyH.md.png)](https://imgloc.com/image/yMSXyH) | [![设备详情](https://i.imgs.ovh/2026/01/29/yMS1YX.md.png)](https://imgloc.com/image/yMS1YX) |

### 质量分析与用户管理

|                                          质量分析                                           |                                           用户管理                                            |
| :-----------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------: |
| [![设备历史](https://i.imgs.ovh/2026/01/29/yMSiUF.md.png)](https://imgloc.com/image/yMSiUF) | [![错误码管理](https://i.imgs.ovh/2026/01/29/yML0Qm.md.png)](https://imgloc.com/image/yML0Qm) |

### 固件管理与错误码管理

|                                          固件管理                                           |                                         错误码管理                                          |
| :-----------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: |
| [![质量分析](https://i.imgs.ovh/2026/01/29/yMLyrc.md.png)](https://imgloc.com/image/yMLyrc) | [![数据导出](https://i.imgs.ovh/2026/01/29/yMLOep.md.png)](https://imgloc.com/image/yMLOep) |

---

## 一、项目背景

### 1.1 业务需求

一套 Windows 桌面应用，用于管理 LegBot 外骨骼机器人设备的生产流程：

- **设备检测**：自动识别通过串口连接的设备
- **序列号管理**：生成、写入、验证设备序列号
- **固件烧录**：管理固件版本，支持一键烧录
- **错误码管理**：读取设备错误日志，记录历史
- **质量分析**：统计故障率，生成趋势图表
- **数据导出**：支持 Excel/CSV 导出

### 1.2 技术选型

经过评估，最终选择以下技术栈：

| 类别   | 技术               | 理由                           |
| ------ | ------------------ | ------------------------------ |
| 框架   | Electron           | 跨平台桌面应用，打包为独立 exe |
| 前端   | React + TypeScript | 类型安全，组件化开发           |
| 样式   | Tailwind CSS       | 原子化 CSS，开发效率高         |
| 数据库 | SQLite             | 单机离线部署，无需服务器       |
| 串口   | serialport         | Node.js 串口通信库             |

---

## 二、开发工具链介绍

### 2.1 BMAD 方法论

BMAD (Business Model Agile Development) 是一套 AI 辅助的敏捷开发方法论，核心流程：

```
产品简报 → PRD → 架构设计 → Epics/Stories → 开发实现 → 代码审查
```

**核心优势：**

- 结构化的需求分析流程
- AI 辅助的架构决策
- 自动化的任务拆分
- 内置的质量检查点

### 2.2 Pencil 设计工具

Pencil 是一款 AI 驱动的 UI 设计工具，支持：

- 可视化界面设计
- 设计稿到代码的转换
- 设计变量管理
- 组件库复用

### 2.3 Claude Code

Claude Code 是 Anthropic 推出的 AI 编程助手，特点：

- 理解完整项目上下文
- 支持多文件编辑
- 内置终端操作
- MCP 工具扩展

---

## 三、项目初始化

### 3.1 创建 Electron 项目

使用 electron-vite 脚手架创建项目：

```bash
npm create electron-vite@latest legbots-kanban -- --template react-ts
cd legbots-kanban
npm install
```

### 3.2 安装核心依赖

```bash
# 数据库
npm install better-sqlite3
npm install -D @types/better-sqlite3

# 串口通信
npm install serialport @serialport/bindings-cpp

# UI 组件
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install tailwindcss tailwind-merge clsx
npm install lucide-react

# 状态管理
npm install zustand

# 数据导出
npm install xlsx
```

---

## 四、BMAD 工作流详解

### 4.1 产品简报 (Product Brief)

首先使用 BMAD 的 `create-product-brief` 工作流，与 AI 进行对话式需求探索：

```
用户：我需要一个设备管理系统
AI：请描述您的目标用户是谁？
用户：工厂生产线的技术人员
AI：他们主要需要完成什么任务？
用户：烧录固件、记录错误码、查询历史
...
```

最终生成结构化的产品简报文档。

### 4.2 PRD 文档

基于产品简报，使用 `prd` 工作流生成详细的产品需求文档：

```markdown
# 功能需求

## FR-001: 用户认证

- 支持用户名密码登录
- 区分管理员和普通用户角色
- 会话超时自动登出

## FR-002: 设备检测

- 自动扫描 COM 端口
- 识别 ESP32 设备
- 显示设备连接状态
```

### 4.3 架构设计

使用 `create-architecture` 工作流进行架构决策：

```
┌─────────────────────────────────────┐
│         Renderer Process            │
│    (React + Zustand + Tailwind)     │
└─────────────────────────────────────┘
                  │
           contextBridge
                  │
┌─────────────────────────────────────┐
│         Preload Script              │
│      (IPC 通道安全暴露)              │
└─────────────────────────────────────┘
                  │
              ipcMain
                  │
┌─────────────────────────────────────┐
│          Main Process               │
│  (SQLite + SerialPort + Services)   │
└─────────────────────────────────────┘
```

**关键决策：**

- 选择 Electron 三层架构确保安全性
- 使用 SQLite 实现离线数据存储
- 通过 IPC 隔离渲染进程与系统资源

### 4.4 Epics 与 Stories 拆分

使用 `create-epics-and-stories` 工作流将需求拆分为可执行的任务：

**Epic 1: 基础设施**

- Story 1.1: 项目脚手架搭建
- Story 1.2: 数据库服务实现
- Story 1.3: IPC 通信框架

**Epic 2: 用户认证**

- Story 2.1: 登录页面 UI
- Story 2.2: 认证服务实现
- Story 2.3: 会话管理

**Epic 3: 设备管理**

- Story 3.1: 串口检测服务
- Story 3.2: 设备信息读取
- Story 3.3: 序列号写入

每个 Story 包含：

- 验收标准 (Acceptance Criteria)
- 技术任务 (Technical Tasks)
- 测试要点 (Test Points)

---

## 五、核心功能实现

### 5.1 数据库服务

使用 better-sqlite3 实现本地数据存储：

```typescript
// src/main/services/database/index.ts
import Database from "better-sqlite3";

class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database("legbots.db");
    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY,
        serial_number TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}
```

### 5.2 串口通信服务

实现设备自动检测与通信：

```typescript
// src/main/services/serial/index.ts
import { SerialPort } from "serialport";

class SerialService {
  async listPorts() {
    const ports = await SerialPort.list();
    return ports.filter(
      (p) =>
        p.vendorId === "10C4" || // Silicon Labs
        p.vendorId === "1A86", // CH340
    );
  }

  async connect(path: string) {
    return new SerialPort({
      path,
      baudRate: 115200,
    });
  }
}
```

### 5.3 IPC 通信架构

Electron 的安全通信通过 preload 脚本暴露 API：

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // 设备操作
  device: {
    list: () => ipcRenderer.invoke("device:list"),
    connect: (port: string) => ipcRenderer.invoke("device:connect", port),
    readInfo: () => ipcRenderer.invoke("device:read-info"),
  },
  // 数据导出
  export: {
    toExcel: (data: any[]) => ipcRenderer.invoke("export:excel", data),
    toCsv: (data: any[]) => ipcRenderer.invoke("export:csv", data),
  },
});
```

---

## 六、前端状态管理

### 6.1 Zustand Store 设计

使用 Zustand 管理全局状态：

```typescript
// src/renderer/stores/useDeviceStore.ts
import { create } from "zustand";

interface DeviceState {
  devices: Device[];
  currentDevice: Device | null;
  isLoading: boolean;
  fetchDevices: () => Promise<void>;
  selectDevice: (device: Device) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  currentDevice: null,
  isLoading: false,

  fetchDevices: async () => {
    set({ isLoading: true });
    const devices = await window.api.device.list();
    set({ devices, isLoading: false });
  },

  selectDevice: (device) => set({ currentDevice: device }),
}));
```

### 6.2 组件中使用 Store

```tsx
// src/renderer/pages/DevicePage.tsx
import { useDeviceStore } from "@/stores/useDeviceStore";

export function DevicePage() {
  const { devices, isLoading, fetchDevices } = useDeviceStore();

  useEffect(() => {
    fetchDevices();
  }, []);

  if (isLoading) return <Loading />;

  return <DeviceList devices={devices} />;
}
```

---

## 七、UI 组件设计

### 7.1 组件库选型

项目使用 Radix UI + Tailwind CSS 构建组件：

| 组件   | 来源     | 用途       |
| ------ | -------- | ---------- |
| Button | 自定义   | 通用按钮   |
| Dialog | Radix UI | 弹窗对话框 |
| Select | Radix UI | 下拉选择   |
| Table  | 自定义   | 数据表格   |
| Card   | 自定义   | 信息卡片   |

### 7.2 Button 组件示例

```tsx
// src/renderer/components/ui/Button.tsx
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md font-medium transition-colors",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" &&
          "bg-gray-200 text-gray-800 hover:bg-gray-300",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}
```

---

## 八、总结与心得

### 8.1 工具链协作效果

| 工具        | 作用               | 效率提升 |
| ----------- | ------------------ | -------- |
| BMAD        | 需求分析、任务拆分 | 减少返工 |
| Pencil      | UI 设计、原型验证  | 快速迭代 |
| Claude Code | 代码实现、调试     | 加速开发 |

### 8.2 经验总结

**1. 需求先行**

使用 BMAD 的结构化流程，确保在编码前充分理解需求，避免后期大规模重构。

**2. 架构决策要早**

Electron 三层架构的选择在项目初期确定，为后续开发奠定了安全、可维护的基础。

**3. AI 辅助而非替代**

Claude Code 是强大的编程助手，但关键决策仍需人工判断。AI 擅长：

- 生成样板代码
- 解释复杂逻辑
- 快速调试问题

### 8.3 项目结构

最终项目结构如下：

```
legbots-kanban/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── services/   # 业务服务
│   │   └── ipc/        # IPC 处理器
│   ├── preload/        # 预加载脚本
│   └── renderer/       # React 前端
│       ├── components/ # UI 组件
│       ├── pages/      # 页面组件
│       └── stores/     # Zustand 状态
├── tools/              # 辅助工具
└── docs/               # 项目文档
```

### 8.4 后续规划

- [ ] 添加单元测试覆盖
- [ ] 实现固件 OTA 升级
- [ ] 支持多语言国际化
- [ ] 优化大数据量查询性能

---

## 结语

通过 BMAD + Pencil + Claude Code 的工具链组合，我们成功从零搭建了一套完整的企业设备管理平台。这套方法论的核心价值在于：

1. **结构化流程** - 从需求到代码有清晰的路径
2. **AI 增强效率** - 在各个环节都有 AI 辅助
3. **质量内建** - 每个阶段都有检查点

希望本文对正在探索 AI 辅助开发的同学有所帮助。

---

> 作者：鸿尘客
> 技术栈：Electron + React + TypeScript + SQLite
> 工具链：BMAD + Pencil + Claude Code
