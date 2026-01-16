# 项目技术分析报告 (For Embedded Engineers)

本文档专为具有嵌入式开发背景的工程师编写，旨在通过类比嵌入式系统概念，帮助您快速理解本项目的全栈技术架构。

---

## 1. 核心技术栈映射 (Tech Stack Mapping)

本项目采用现代 Web 全栈架构 (T3 Stack 变体)，以下是各层技术与嵌入式概念的对照表：

| 层级 (Layer)      | Web 技术                | 嵌入式类比 (Embedded Analogy)       | 作用说明                                                                                                                                |
| :---------------- | :---------------------- | :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **语言**          | **TypeScript**          | **C/C++ (Strongly Typed)**          | 提供严格的类型检查。就像 C 语言中 `uint8_t` vs `int` 的区别，防止在编译期出现类型不匹配错误，避免运行时崩溃。                           |
| **前端 (UI)**     | **React 19 + Vite**     | **HMI / 屏幕驱动层**                | 负责界面的渲染。React 组件就像一个个封装好的 UI 控件（如 Button, Label），Vite 则是编译器/链接器，将代码打包成浏览器能运行的“固件”。    |
| **后端 (Server)** | **Node.js + Express**   | **主控 MCU / RTOS 任务**            | 运行在服务器上的主程序。它监听端口（类似中断），接收请求，处理业务逻辑，然后返回数据。                                                  |
| **通讯协议**      | **tRPC**                | **定义严格的通讯协议 (如 DBC/IDL)** | 这里的 API 不是随意的 JSON，而是像 CAN 矩阵一样严格定义了输入输出结构。前端调用后端函数就像调用本地库函数一样，无需关心底层 HTTP 封包。 |
| **数据库**        | **MySQL + Drizzle ORM** | **Flash / EEPROM + 结构体映射**     | MySQL 是物理存储介质。Drizzle ORM 是驱动层，它允许你用操作 TypeScript 对象（结构体）的方式来操作数据库，而不需要手写 SQL（汇编指令）。  |
| **样式**          | **Tailwind CSS**        | **UI 主题库 / 宏定义**              | 不再手动写 `color: #fff; margin: 10px`，而是使用预定义的类名（如 `text-white p-4`），就像使用宏定义来控制样式，保证全局一致性。         |

---

## 2. 项目结构解剖 (Project Anatomy)

项目目录结构清晰，类似于嵌入式项目的分层结构：

```text
Person_Web/
├── client/                 # [前端固件] HMI 代码
│   ├── src/
│   │   ├── components/     # [UI 库] 独立的 UI 模块 (Button, Card...)
│   │   ├── pages/          # [屏幕页面] 各个功能画面 (Home, About...)
│   │   ├── lib/trpc.ts     # [通讯驱动] tRPC 客户端初始化
│   │   └── App.tsx         # [Main入口] UI 线程的入口函数
│   └── index.html          # [启动文件] 类似 Bootloader 加载入口
│
├── server/                 # [后端固件] 主控业务逻辑
│   ├── _core/              # [BSP/HAL] 核心底层驱动 (Auth, Context, Env)
│   ├── routers.ts          # [指令集] 定义了所有可被调用的 API 接口
│   ├── db.ts               # [存储驱动] 数据库连接与操作封装
│   └── index.ts            # [Main入口] 服务器启动入口
│
├── shared/                 # [公共头文件] 前后端共用的类型定义
│   └── types.ts            # 类似于 .h 文件，存放两端都用的 struct/enum
│
├── drizzle/                # [存储配置] 数据库结构定义
│   └── schema.ts           # [EEPROM Map] 定义数据表结构
│
└── package.json            # [Makefile] 项目依赖和构建脚本配置
```

---

## 3. 核心工作流：从点击到数据 (The Data Flow)

以“用户打开文章列表页面”为例，数据流向如下：

1.  **UI 触发 (中断发生)**:
    - 用户访问 `/articles` 页面。
    - React 组件 (`Articles.tsx`) 加载，执行 `trpc.article.list.useQuery()`。
    - **类比**: HMI 屏幕初始化，调用数据获取函数。

2.  **请求发送 (总线通讯)**:
    - tRPC Client 将调用打包成 HTTP 请求，发送给后端。
    - **类比**: 通过 UART/SPI 发送一条指令 `CMD_GET_ARTICLES`。

3.  **后端处理 (中断服务程序 ISR)**:
    - Node.js 接收请求，路由到 `server/routers.ts` 中的 `article.list` 处理器。
    - 处理器调用 `db.getArticles()`。
    - **类比**: MCU 收到指令，解析指令 ID，调用对应的处理函数。

4.  **数据存取 (Flash 读写)**:
    - Drizzle ORM 将请求转换为 SQL：`SELECT * FROM articles ...`。
    - MySQL 返回数据行。
    - **类比**: 驱动层读取 Flash 中的数据块，映射回结构体。

5.  **回传与渲染 (UI 更新)**:
    - 后端将数据返回给前端。
    - React 自动检测到数据变化，更新 DOM。
    - **类比**: 数据通过串口回传给 HMI，HMI 刷新显存显示列表。

---

## 4. 关键代码模式 (Code Patterns)

### 4.1 定义 API (指令集)

在 `server/routers.ts` 中，我们定义接口就像定义函数原型：

```typescript
// 定义一个名为 'list' 的查询接口
list: publicProcedure
  .input(z.object({             // 输入参数定义 (参数检查)
    page: z.number().default(1) // 类似于: struct { int page; }
  }))
  .query(async ({ input }) => { // 具体的处理逻辑
    return db.getArticles(input.page);
  }),
```

### 4.2 调用 API (发送指令)

在前端组件中，调用接口就像调用本地函数，这是 tRPC 的魔力：

```typescript
// Client 端代码
const { data, isLoading } = trpc.article.list.useQuery({ page: 1 });

if (isLoading) return <Spinner />; // 加载中...
return <div>{data.articles.map(a => <Card title={a.title} />)}</div>;
```

---

## 5. 如何开始开发 (Getting Started)

1.  **启动环境 (Power On)**:
    - 确保 Docker (数据库) 和 Node.js 环境就绪。
    - 运行 `pnpm dev`。
    - 这条命令会同时启动前端编译器 (Vite) 和后端服务器 (Node)。

2.  **查看日志 (Serial Monitor)**:
    - 终端会输出服务器日志和前端构建日志。
    - 如果代码有错（编译错误），终端会直接报错（类似于编译失败）。

3.  **调试 (JTAG/Debug)**:
    - **前端调试**: 使用 Chrome 浏览器的 F12 -> Console / Network。
    - **后端调试**: 在 VS Code 中使用 Debug Terminal，或者直接看终端的 `console.log`。

---

## 6. 深入解析：数据库、部署与域名 (Deep Dive)

### 6.1 为什么要有数据库？(Why Database?)

**Q: 我的代码里有变量存数据，为什么还要数据库？**

**A: 变量是 RAM，数据库是 Flash/EEPROM。**

- **变量 (RAM)**: 当你运行程序时，变量存储在内存中。一旦你重启服务器（或者程序崩溃、断电），内存里的数据就**丢了**。这就像单片机的 SRAM，掉电不保存。
- **数据库 (Flash)**: 数据库（MySQL）把数据写在硬盘上。即使服务器爆炸了，只要硬盘还在，数据就在。它负责**持久化存储**文章、用户信息等关键数据。
- **本项目中的数据库**: 我们使用的是 **MySQL**。它就像一个巨大的 Excel 表格集合，用来存放所有“掉电不能丢”的数据。

### 6.2 详细部署指南 (Deployment Handbook)

您之前的理解有一点小误区，这里为您彻底理清：

**误区纠正**：

1.  **不需要在云服务器上安装 Node.js**。这是 Docker 的最大优势。Docker 容器内部已经包含了 Node.js 环境。服务器只需要安装 **Docker** 即可。
2.  **您的项目不是“一个 Docker”**，而是您的**源代码**被 Docker **打包**成了一个镜像（Image）。就像您写的 C 代码被编译成了 `.hex` 文件。
3.  **编译在哪做？** Docker 会读取 `Dockerfile`，在构建镜像的过程中自动完成 `npm build`（编译）。

**完整操作步骤 (Step-by-Step)**：

#### 第一步：服务器环境准备 (Host Setup)

假设您购买了一台新的 Ubuntu 服务器：

1.  **只安装 Docker**:
    ```bash
    # 更新软件源
    sudo apt update
    # 安装 Docker
    sudo apt install docker.io docker-compose -y
    # 启动 Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    ```

#### 第二步：上传代码与启动 (Upload & Boot)

1.  将您的项目代码上传到服务器（例如放在 `/root/Person_Web` 目录）。
2.  进入目录，一条命令启动所有服务：
    ```bash
    # 这条命令会自动：
    # 1. 下载 MySQL 镜像
    # 2. 根据 Dockerfile 编译您的前端和后端代码
    # 3. 启动数据库和网页服务
    sudo docker-compose up -d --build
    ```
3.  **验证**: 此时访问 `http://服务器IP:3000`，应该已经能看到页面了。

#### 第三步：配置域名与 Nginx (Gateway Setup)

现在我们要让 `zhcmqtt.top` 指向您的 3000 端口。

1.  **安装 Nginx**:

    ```bash
    sudo apt install nginx -y
    ```

2.  **配置转发规则**:
    编辑 Nginx 配置文件：`sudo nano /etc/nginx/sites-available/default`
    清空原有内容，填入以下内容（已在项目根目录为您准备了 `nginx.conf` 参考）：

    ```nginx
    server {
        listen 80;
        server_name zhcmqtt.top;  # 您的域名

        location / {
            # 将所有请求转发给本地运行的 Docker 容器 (3000端口)
            proxy_pass http://127.0.0.1:3000;

            # 必须带上的“信头”，否则后端不知道真实用户IP
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **生效配置**:
    ```bash
    sudo nginx -t   # 检查配置有没有写错
    sudo systemctl reload nginx # 重启 Nginx
    ```

#### 第四步：搞定！

现在，用户在浏览器输入 `http://zhcmqtt.top`：

1.  DNS 将域名解析到您的服务器 IP。
2.  请求到达服务器 **80 端口**。
3.  **Nginx** 收到请求，发现是找 `zhcmqtt.top` 的。
4.  Nginx 将请求通过“内部专线”转发给 **3000 端口**。
5.  **Docker 容器** 里的 Node.js 收到请求，处理并返回网页。

### 6.3 域名访问是如何实现的？(Domain Binding)

你输入 `zhcmqtt.top` 就能看到页面，这背后发生了什么？这是一个**地址译码**的过程：

1.  **DNS 解析 (查电话本)**:
    - 浏览器问 DNS 服务器：“`zhcmqtt.top` 的 IP 是多少？”
    - DNS 回答：“是 `1.2.3.4` (你的服务器公网 IP)”。
    - **类比**: 你知道我要找“张三”，查表找到了他的“门牌号”。

2.  **连接服务器 (敲门)**:
    - 浏览器向 IP `1.2.3.4` 的 **80 端口** (HTTP 默认端口) 发起请求。
    - **类比**: 你找到了房子，敲了正门。

3.  **反向代理 Nginx (前台接待)**:
    - 你的服务器上通常运行着一个软件叫 **Nginx** (或者 Caddy/Apache)。它守在 80 端口。
    - 它看你找 `zhcmqtt.top`，就会把请求**转发**给内部的 **3000 端口** (你的 Node.js 项目端口)。
    - **类比**: 前台（Nginx）听到你要找“项目部”，就把你带到了“3000号房间”（Node.js 进程）。如果没有 Nginx，你就得让用户输入 `zhcmqtt.top:3000` 才能访问。

---

## 7. 常见问题 (Troubleshooting)

- **Q: 为什么我改了代码没反应？**
  - A: 检查终端是否有报错。前端代码支持热更新 (HMR)，后端代码改动后服务器会自动重启。
- **Q: 数据库连不上？**
  - A: 检查 Docker 容器是否运行 (`docker ps`)，这相当于检查 Flash 芯片是否供电正常。

---

这份文档应该能帮助您利用已有的嵌入式经验，快速建立起对本项目全栈架构的认知。如果有任何具体模块需要深入，请随时提问！
