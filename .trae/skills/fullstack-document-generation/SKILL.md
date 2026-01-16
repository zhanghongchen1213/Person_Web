---
name: "fullstack-document-generation"
description: "专为全栈项目（Web/App/Backend）设计。自动生成包含应用架构、API接口文档、数据库模型及容器化部署方案的技术文档。"
---

# 全栈开发文档专家 (Full Stack Document Generator)

本技能专注于 Web 和全栈应用的技术文档生成。通过分析 `package.json`, `requirements.txt`, `docker-compose.yml`, 路由文件及数据库模型，自动构建应用分层架构、API 列表和数据字典。

## 目标

1.  **架构分层 (Layered Architecture)**：清晰展示前端组件、后端 Controller/Service/Dao 分层及微服务结构。
2.  **接口文档化 (API Documentation)**：自动提取 RESTful 或 GraphQL 接口定义，生成 Swagger 风格文档。
3.  **数据可视化 (Data Visualization)**：解析数据库 Schema，生成 ER 图描述或数据字典。
4.  **部署自动化 (Deployment)**：生成 Docker 容器编排和 CI/CD 流水线说明。
5.  **规范输出**：输出**全中文** Markdown 文档。

## 文档模板

```markdown
# [项目名称] 全栈开发文档

> 前端技术：[如：React / Vue3 + TypeScript]
> 后端技术：[如：Node.js (NestJS) / Python (FastAPI) / Go (Gin)]
> 数据库：[如：PostgreSQL / MongoDB / Redis]

## 1. 项目概述 (Overview)

### 1.1 产品简介
[描述产品的核心业务价值和用户群体]

### 1.2 技术选型
- **前端**：Vite + Vue3 + Pinia + Element Plus
- **后端**：Spring Boot + MyBatis Plus
- **基础设施**：Docker + Nginx + MySQL

## 2. 系统架构 (System Architecture)

### 2.1 逻辑架构
- **接入层**：Nginx 反向代理 / API Gateway
- **业务层**：
    - 用户服务 (User Service)
    - 订单服务 (Order Service)
- **数据层**：MySQL (主数据), Redis (缓存)

### 2.2 目录结构
```bash
Root/
├── frontend/           # 前端项目
│   ├── src/components/ # 公共组件
│   └── src/views/      # 页面视图
├── backend/            # 后端项目
│   ├── src/main/java/  # 源码
│   └── src/main/resources/ # 配置
└── deploy/             # 部署脚本 (Docker)
```

## 3. API 接口文档 (API Reference)

### 3.1 用户模块 (User)

#### 3.1.1 登录
- **路径**：`POST /api/v1/auth/login`
- **请求体 (Body)**：
  ```json
  {
    "username": "admin",
    "password": "encrypted_string"
  }
  ```
- **响应 (Response)**：
  ```json
  {
    "code": 200,
    "data": { "token": "jwt_token_string" }
  }
  ```

### 3.2 业务模块 (Business)
- **GET /api/v1/orders**: 获取订单列表
- **POST /api/v1/orders**: 创建新订单

## 4. 数据库设计 (Database Schema)

### 4.1 实体关系 (ER Diagram Description)
- 用户 (User) 1:N 订单 (Order)
- 订单 (Order) N:N 商品 (Product)

### 4.2 数据字典
**表名：users (用户表)**

| 字段名 | 类型 | 约束 | 说明 |
|-------|-----|-----|------|
| id | BIGINT | PK, AI | 用户 ID |
| username | VARCHAR(50) | Unique | 用户名 |
| status | TINYINT | Default 1 | 状态 (1:正常, 0:禁用) |

## 5. 核心业务流程 (Business Logic)

### 5.1 订单创建流程
1. 校验库存 (Redis 预减库存)。
2. 创建订单记录 (状态：待支付)。
3. 发送消息到 MQ (延迟队列用于超时取消)。
4. 返回订单号给前端。

## 6. 部署与运维 (Deployment)

### 6.1 本地开发
```bash
# 启动数据库
docker-compose up -d mysql redis

# 启动后端
cd backend && mvn spring-boot:run

# 启动前端
cd frontend && npm install && npm run dev
```

### 6.2 生产环境部署
- **构建镜像**：`docker build -t my-app:v1 .`
- **环境变量**：
    - `DB_HOST`: 数据库地址
    - `JWT_SECRET`: 令牌密钥

## 7. 附录
- [错误码对照表]
- [权限角色说明]
```
