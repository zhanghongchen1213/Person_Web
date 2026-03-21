// PM2 生态系统配置文件
// 使用 .cjs 扩展名因为 package.json 声明了 "type": "module"
// 文档: https://pm2.keymetrics.io/docs/usage/application-declaration/
module.exports = {
  apps: [
    {
      name: "personal-blog-api",
      script: "dist/index.js",

      // 运行模式: fork（单实例，适合小型 VPS）
      exec_mode: "fork",
      instances: 1,

      // 内存限制：超过 400MB 自动重启
      max_memory_restart: "400M",

      // 环境变量从 .env 文件加载，PM2 配置中不硬编码秘密
      // 使用 dotenv/config 在应用启动时加载 .env
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      // 日志配置
      // 注意: 建议安装 pm2-logrotate 模块进行日志轮转: pm2 install pm2-logrotate
      // 配置: pm2 set pm2-logrotate:max_size 50M && pm2 set pm2-logrotate:retain 10
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      max_size: "50M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // 自动重启策略
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,

      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
