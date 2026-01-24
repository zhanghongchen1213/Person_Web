# MCP Tools Documentation

## Overview

This document catalogs all Model Context Protocol (MCP) tools available in this development environment. MCP enables Claude to interact with external services, APIs, and tools through a standardized protocol.

### Configuration Hierarchy

MCP tools are configured at two levels:

1. **Project-Level**: `.claude/settings.local.json` in the project directory
   - Defines project-specific tool permissions
   - Can restrict access to specific tools for security
   - Overrides user-level settings for this project

2. **User-Level**: `~/.claude/settings.local.json` in the user's home directory
   - Defines global MCP server availability
   - Enables/disables MCP servers across all projects
   - Contains authentication credentials

3. **MCP Server Definitions**: `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/`
   - Contains configuration for each available MCP server
   - Defines connection type (stdio, SSE, HTTP, WebSocket)
   - Specifies commands, URLs, and authentication methods

---

## MCP Server Types

MCP servers can connect using four different protocols:

| Type | Description | Best For | Example |
|------|-------------|----------|---------|
| **stdio** | Local process execution | Custom/NPM servers, local tools | `npx @upstash/context7-mcp` |
| **SSE** | Server-Sent Events | Cloud services with OAuth | `https://mcp.asana.com/sse` |
| **HTTP** | REST API | Token-based authentication | `https://api.githubcopilot.com/mcp/` |
| **WebSocket** | Bidirectional streaming | Real-time communication | (Not currently configured) |

---

## Project-Level MCP Configuration

**Location**: `Person_Web/.claude/settings.local.json`

This project restricts MCP tool access to specific Puppeteer browser automation tools only.

### Allowed Tools

The following 8 Puppeteer tools are permitted at the project level:

| Tool | Purpose |
|------|---------|
| `mcp__puppeteer__browser_init` | Initialize browser instance |
| `mcp__puppeteer__navigate` | Navigate to URLs |
| `mcp__puppeteer__browser_close` | Close browser instance |
| `mcp__puppeteer__find_selector` | Find elements by CSS selector |
| `mcp__puppeteer__type` | Type text into input fields |
| `mcp__puppeteer__click` | Click on elements |
| `mcp__puppeteer__wait` | Wait for conditions/elements |
| `mcp__puppeteer__get_content` | Extract page content |

### Configuration Example

```json
{
  "permissions": {
    "allow": [
      "mcp__puppeteer__browser_init",
      "mcp__puppeteer__navigate",
      "mcp__puppeteer__browser_close",
      "mcp__puppeteer__find_selector",
      "mcp__puppeteer__type",
      "mcp__puppeteer__click",
      "mcp__puppeteer__wait",
      "mcp__puppeteer__get_content"
    ]
  }
}
```

---

## User-Level MCP Configuration

**Location**: `C:\Users\thinkpad\.claude\settings.local.json`

The user-level configuration enables broader MCP server access across all projects.

### Global Settings

```json
{
  "permissions": {
    "allow": [
      "mcp__ssh-mcp__exec"
    ]
  },
  "enabledMcpjsonServers": [
    "agentvibes"
  ],
  "enableAllProjectMcpServers": true
}
```

**Key Settings:**
- **SSH Execution**: Allows remote command execution via SSH MCP
- **Enabled Servers**: "agentvibes" server is enabled
- **Project Servers**: All project-level MCP servers are enabled

---

## Available MCP Servers (13 Total)

The following MCP servers are configured in the user's plugin directory:
`C:\Users\thinkpad\.claude\plugins\marketplaces\claude-plugins-official\external_plugins\`

### 1. Asana (Project Management)

**Type**: SSE (Server-Sent Events)
**Status**: Configured
**Use Case**: Project and task management integration

```json
{
  "asana": {
    "type": "sse",
    "url": "https://mcp.asana.com/sse"
  }
}
```

---

### 2. Context7 (Documentation & Code Examples)

**Type**: stdio
**Status**: ✅ Installed and Active
**Use Case**: Retrieve up-to-date documentation and code examples for any library

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  }
}
```

**Installed Version**: f70b65538da0 (installed 2026-01-19)

---

### 3. Firebase (Backend Services)

**Type**: stdio
**Status**: Configured
**Use Case**: Firebase tools and services integration

```json
{
  "firebase": {
    "command": "npx",
    "args": ["-y", "firebase-tools@latest", "mcp"]
  }
}
```

---

### 4. GitHub (Version Control)

**Type**: HTTP
**Status**: Configured
**Use Case**: GitHub API integration for repositories, issues, PRs

```json
{
  "github": {
    "type": "http",
    "url": "https://api.githubcopilot.com/mcp/",
    "headers": {
      "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
    }
  }
}
```

**Authentication**: Requires `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable

---

### 5. GitLab (Version Control)

**Type**: HTTP
**Status**: Configured
**Use Case**: GitLab API integration for repositories, issues, merge requests

```json
{
  "gitlab": {
    "type": "http",
    "url": "https://gitlab.com/api/v4/mcp"
  }
}
```

---

### 6. Greptile (Code Search)

**Type**: HTTP
**Status**: Configured
**Use Case**: Advanced code search and analysis

```json
{
  "greptile": {
    "type": "http",
    "url": "https://api.greptile.com/mcp",
    "headers": {
      "Authorization": "Bearer ${GREPTILE_API_KEY}"
    }
  }
}
```

**Authentication**: Requires `GREPTILE_API_KEY` environment variable

---

### 7. Laravel Boost (PHP Development)

**Type**: stdio
**Status**: Configured
**Use Case**: Laravel framework development tools

```json
{
  "laravel-boost": {
    "command": "php",
    "args": ["artisan", "boost:mcp"]
  }
}
```

---

### 8. Linear (Issue Tracking)

**Type**: HTTP
**Status**: Configured
**Use Case**: Linear issue and project tracking integration

```json
{
  "linear": {
    "type": "http",
    "url": "https://mcp.linear.app/mcp"
  }
}
```

---

### 9. Playwright (Browser Automation)

**Type**: stdio
**Status**: Configured
**Use Case**: Browser automation and testing

```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest"]
  }
}
```

---

### 10. Serena (Python Tool)

**Type**: stdio
**Status**: Configured
**Use Case**: Python-based development tool

```json
{
  "serena": {
    "command": "uvx",
    "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server"]
  }
}
```

---

### 11. Slack (Team Communication)

**Type**: SSE (Server-Sent Events)
**Status**: Configured
**Use Case**: Slack workspace integration for messaging and notifications

```json
{
  "slack": {
    "type": "sse",
    "url": "https://mcp.slack.com/sse"
  }
}
```

---

### 12. Stripe (Payment Processing)

**Type**: HTTP
**Status**: Configured
**Use Case**: Stripe payment and subscription management

```json
{
  "mcpServers": {
    "stripe": {
      "type": "http",
      "url": "https://mcp.stripe.com"
    }
  }
}
```

---

### 13. Supabase (Backend as a Service)

**Type**: HTTP
**Status**: Configured
**Use Case**: Supabase database and backend services integration

```json
{
  "supabase": {
    "type": "http",
    "url": "https://mcp.supabase.com/mcp"
  }
}
```

---

## Currently Active MCP Servers in This Session

The following MCP servers are currently active and available in this Claude Code session:

### 1. vibe_kanban (Task Management)

**Status**: ✅ Active
**Purpose**: Task and project management server

**Available Tools:**
- `list_projects` - List all available projects
- `list_tasks` - List tasks in a project (requires `project_id`)
- `create_task` - Create new task (requires `project_id`)
- `get_task` - Get task details (requires `task_id`)
- `update_task` - Update task status/details (requires `task_id`)
- `delete_task` - Delete a task (requires `task_id`)
- `list_repos` - List repositories in a project (requires `project_id`)
- `get_repo` - Get repository details (requires `repo_id`)
- `update_setup_script` - Update repo setup script (requires `repo_id`)
- `update_cleanup_script` - Update repo cleanup script (requires `repo_id`)
- `update_dev_server_script` - Update dev server script (requires `repo_id`)
- `start_workspace_session` - Start working on a task (requires `task_id`, `executor`, `repos`)

**Usage Note**: Most tools require `project_id`, `task_id`, or `repo_id` parameters. Use list tools to get available IDs.

---

### 2. context7 (Documentation & Code Examples)

**Status**: ✅ Active
**Purpose**: Retrieve up-to-date documentation and code examples for any programming library or framework

**Available Tools:**
- `resolve-library-id` - Resolve package name to Context7-compatible library ID
- `query-docs` - Query documentation with library ID and question

**Usage Pattern:**
1. Call `resolve-library-id` with library name and query
2. Use returned library ID to call `query-docs` for specific documentation

**Example Library IDs:**
- `/mongodb/docs` - MongoDB documentation
- `/vercel/next.js` - Next.js framework
- `/supabase/supabase` - Supabase platform
- `/vercel/next.js/v14.3.0-canary.87` - Specific version

---

### 3. chrome_devtools (Browser Automation)

**Status**: ✅ Active
**Purpose**: Browser automation and web testing via Chrome DevTools Protocol

**Available Tools:**
- `list_pages` - Get list of open browser pages
- `select_page` - Select a page for operations
- `new_page` - Create new browser page
- `close_page` - Close a page by ID
- `navigate_page` - Navigate to URL or back/forward
- `take_snapshot` - Take text snapshot of page (a11y tree)
- `take_screenshot` - Capture page or element screenshot
- `click` - Click on element by UID
- `fill` - Fill input/textarea/select element
- `fill_form` - Fill multiple form elements at once
- `hover` - Hover over element
- `press_key` - Press key or key combination
- `wait_for` - Wait for text to appear
- `evaluate_script` - Execute JavaScript in page
- `list_network_requests` - List network requests
- `get_network_request` - Get request details
- `list_console_messages` - List console messages
- `get_console_message` - Get console message details
- `emulate` - Emulate device features (CPU, network, geolocation)
- `resize_page` - Resize browser window
- `performance_start_trace` - Start performance recording
- `performance_stop_trace` - Stop performance recording
- `performance_analyze_insight` - Analyze performance insights

---

## Configuration Examples by Server Type

### stdio Type Configuration

**Description**: Executes local commands via standard input/output

**Example 1: NPM Package**
```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  }
}
```

**Example 2: Local Script**
```json
{
  "custom-server": {
    "command": "node",
    "args": ["./path/to/server.js"],
    "env": {
      "LOG_LEVEL": "info",
      "API_KEY": "${MY_API_KEY}"
    }
  }
}
```

**Example 3: PHP Command**
```json
{
  "laravel-boost": {
    "command": "php",
    "args": ["artisan", "boost:mcp"]
  }
}
```

---

### SSE Type Configuration

**Description**: Server-Sent Events for cloud services with OAuth authentication

**Example 1: Asana**
```json
{
  "asana": {
    "type": "sse",
    "url": "https://mcp.asana.com/sse"
  }
}
```

**Example 2: Slack**
```json
{
  "slack": {
    "type": "sse",
    "url": "https://mcp.slack.com/sse"
  }
}
```

**Key Features:**
- Persistent connection for real-time updates
- OAuth-based authentication handled by the service
- Best for cloud-based integrations

---

### HTTP Type Configuration

**Description**: REST API with token-based authentication

**Example 1: GitHub (with Bearer token)**
```json
{
  "github": {
    "type": "http",
    "url": "https://api.githubcopilot.com/mcp/",
    "headers": {
      "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
    }
  }
}
```

**Example 2: Greptile (with API key)**
```json
{
  "greptile": {
    "type": "http",
    "url": "https://api.greptile.com/mcp",
    "headers": {
      "Authorization": "Bearer ${GREPTILE_API_KEY}"
    }
  }
}
```

**Example 3: GitLab (no auth headers)**
```json
{
  "gitlab": {
    "type": "http",
    "url": "https://gitlab.com/api/v4/mcp"
  }
}
```

**Key Features:**
- Token-based authentication via headers
- Environment variable substitution with `${VAR_NAME}`
- Best for API-based integrations

---

## Quick Reference: MCP Server Summary

| Server | Type | Status | Primary Use Case |
|--------|------|--------|------------------|
| **asana** | SSE | Configured | Project management |
| **context7** | stdio | ✅ Active | Documentation queries |
| **firebase** | stdio | Configured | Firebase services |
| **github** | HTTP | Configured | GitHub integration |
| **gitlab** | HTTP | Configured | GitLab integration |
| **greptile** | HTTP | Configured | Code search |
| **laravel-boost** | stdio | Configured | Laravel development |
| **linear** | HTTP | Configured | Issue tracking |
| **playwright** | stdio | Configured | Browser automation |
| **serena** | stdio | Configured | Python tool |
| **slack** | SSE | Configured | Team communication |
| **stripe** | HTTP | Configured | Payment processing |
| **supabase** | HTTP | Configured | Backend services |

---

## Usage Tips

### Enabling MCP Servers

**User-Level (Global)**
Edit `~/.claude/settings.local.json`:
```json
{
  "enabledMcpjsonServers": [
    "context7",
    "github",
    "firebase"
  ],
  "enableAllProjectMcpServers": true
}
```

**Project-Level (Specific Project)**
Edit `.claude/settings.local.json` in project directory:
```json
{
  "permissions": {
    "allow": [
      "mcp__server_name__tool_name"
    ]
  }
}
```

---

### Environment Variables

Many MCP servers require environment variables for authentication:

```bash
# GitHub
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxxx"

# Greptile
export GREPTILE_API_KEY="your_api_key_here"

# Custom variables
export MY_API_KEY="your_key_here"
```

**Windows (PowerShell)**:
```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxxx"
```

---

### Troubleshooting

**MCP Server Not Available:**
1. Check if server is enabled in `enabledMcpjsonServers`
2. Verify configuration file exists in external_plugins directory
3. Ensure required environment variables are set
4. Restart Claude Code after configuration changes

**Authentication Errors:**
1. Verify environment variable names match configuration
2. Check token/API key validity
3. Ensure proper Bearer token format in headers

**stdio Server Fails:**
1. Verify command is installed (npx, php, uvx, etc.)
2. Check network access for npx packages
3. Review server logs for error messages

---

## File Locations Reference

### Configuration Files

**User-Level Settings:**
```
C:\Users\thinkpad\.claude\settings.local.json
```

**Project-Level Settings:**
```
Person_Web\.claude\settings.local.json
```

**MCP Server Definitions:**
```
C:\Users\thinkpad\.claude\plugins\marketplaces\claude-plugins-official\external_plugins\
├── asana\.mcp.json
├── context7\.mcp.json
├── firebase\.mcp.json
├── github\.mcp.json
├── gitlab\.mcp.json
├── greptile\.mcp.json
├── laravel-boost\.mcp.json
├── linear\.mcp.json
├── playwright\.mcp.json
├── serena\.mcp.json
├── slack\.mcp.json
├── stripe\.mcp.json
└── supabase\.mcp.json
```

**Installed Plugins:**
```
C:\Users\thinkpad\.claude\plugins\installed_plugins.json
```

---

## Conclusion

This document provides a comprehensive overview of all MCP tools available in this development environment. The configuration hierarchy allows for flexible control:

- **Project-level** settings restrict access for security and project-specific needs
- **User-level** settings enable global MCP server availability
- **13 external MCP servers** are configured and ready to use
- **3 MCP servers** are currently active in this session (vibe_kanban, context7, chrome_devtools)

### Key Takeaways

1. **stdio servers** are best for local tools and NPM packages
2. **SSE servers** provide real-time cloud service integration
3. **HTTP servers** offer REST API access with token authentication
4. Environment variables enable secure credential management
5. Project-level permissions can override user-level settings

### Next Steps

To enable additional MCP servers:
1. Add server name to `enabledMcpjsonServers` in user settings
2. Set required environment variables for authentication
3. Restart Claude Code to apply changes
4. Verify server availability in session

---

**Document Generated**: 2026-01-24
**Total MCP Servers Documented**: 13
**Active Servers**: 3 (vibe_kanban, context7, chrome_devtools)
**Configuration Locations**: Project-level + User-level
