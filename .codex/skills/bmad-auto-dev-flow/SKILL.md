---
name: bmad-auto-dev-flow
description: 自动化开发流程：识别 backlog 状态的 story，依次执行 create-story → dev-story → code-review，完成整个 epic 后通知用户
---

# BMAD Auto Dev Flow

自动化执行 BMAD 开发流程,从 sprint-status.yaml 中识别待处理的 story,依次执行创建、开发、审查流程。

## 触发条件

当用户说:
- "自动开发"
- "auto dev"
- "开始自动化开发流程"
- "执行 auto dev flow"

## 前置条件

- ✅ 已完成 Sprint Planning (`/bmad-bmm-sprint-planning`)
- ✅ 存在 `_bmad-output/implementation-artifacts/sprint-status.yaml` 文件
- ✅ 至少有一个 epic 和 story 处于 backlog 或 in-progress 状态

## 错误处理

如果遇到以下情况:
- **sprint-status.yaml 不存在**: 提示用户先运行 `/bmad-bmm-sprint-planning`
- **所有 story 都是 done**: 通知用户所有任务已完成,结束流程
- **子代理执行失败**: 记录错误,询问用户是否跳过该 story 或重试
- **状态更新失败**: 警告用户并继续执行,避免中断整个流程

---

## 执行流程

### 步骤 1: 解析 Sprint Status

读取 `_bmad-output/implementation-artifacts/sprint-status.yaml` 文件,解析 `development_status` 部分:

- Epic 状态: `backlog` | `in-progress` | `done`
- Story 状态: `backlog` | `ready-for-dev` | `in-progress` | `review` | `done`

### 步骤 2: 查找下一个待处理 Story

按优先级查找:

1. 优先处理 `in-progress` epic 中状态为 `backlog` 或 `ready-for-dev` 的 story
2. 若无 in-progress epic,将第一个 `backlog` epic 标记为 `in-progress` 并处理其首个 story
3. 若所有 epic 都是 `done`,通知用户所有开发任务已完成并结束

### 步骤 3: 执行 Story 开发流程

对每个待处理 story,使用 Agent 工具启动独立子代理依次执行以下流程:

#### 3.1 创建 Story 详情

使用 Agent 工具启动子代理:
```
Agent(
  subagent_type="general-purpose",
  description="Create story details",
  prompt="执行 /bmad-bmm-create-story 为 story [story-id],从 epic 文件提取详情并创建完整 story 文件。确保包含所有任务、子任务和验收标准。"
)
```

**状态转换**: `backlog` → `ready-for-dev`

#### 3.2 开发 Story

使用 Agent 工具启动子代理:
```
Agent(
  subagent_type="general-purpose",
  description="Develop story implementation",
  prompt="执行 /bmad-bmm-dev-story 为 story [story-id],实现所有任务/子任务,编写单元测试和集成测试,验证所有验收标准。完成后更新 story 状态。"
)
```

**状态转换**: `ready-for-dev` → `review`

#### 3.3 代码审查

使用 Agent 工具启动子代理:
```
Agent(
  subagent_type="general-purpose",
  description="Code review and fixes",
  prompt="执行 /bmad-bmm-code-review 为 story [story-id],进行对抗性代码审查,识别 3-10 个具体问题(安全、性能、可维护性等),提出修复方案并在用户批准后自动修复。"
)
```

**状态转换**: `review` → `done`

#### 3.4 强制执行 Compact (不可跳过)

每个 story 完成(状态变为 `done`)后,**必须立即执行 `/compact`**,释放上下文窗口空间,防止后续 story 因 "prompt is too long" 中断。

此步骤为强制性要求,在开始下一个 story 之前不可省略。

### 步骤 4: 循环与通知

1. 完成一个 story 并执行 `/compact` 后,返回步骤 2 查找下一个 story
2. 当 epic 所有 story 完成时:
   - 更新 epic 状态为 `done`
   - **通知用户: Epic [名称] 已完成!**
   - 询问用户是否继续下一个 epic

### 步骤 5: 状态同步

每完成一个步骤后,立即更新 `sprint-status.yaml` 中对应项的状态

---

## 重要提示

- 每个 story 完成后必须执行 `/compact`
- 使用 Agent 工具创建独立子代理执行每个步骤
- 及时更新 sprint-status.yaml 状态
- Epic 完成后通知用户并等待确认

---

## 使用示例

**场景**: 用户已完成 Sprint Planning,有 3 个 epic,每个包含 2-3 个 story

```
用户: "开始自动化开发流程"

系统执行:
1. 读取 sprint-status.yaml
2. 找到第一个 backlog epic,标记为 in-progress
3. 处理第一个 story:
   - 启动子代理执行 create-story
   - 启动子代理执行 dev-story
   - 启动子代理执行 code-review
   - 执行 /compact
4. 继续处理下一个 story...
5. Epic 完成后通知用户,询问是否继续
```

---

## 完成提示

当所有 epic 完成后,告知用户:
- ✅ 所有开发任务已完成
- ✅ 可以运行 `/bmad-bmm-sprint-status` 查看最终状态
- ✅ 建议运行 `/bmad-bmm-retrospective` 进行回顾
