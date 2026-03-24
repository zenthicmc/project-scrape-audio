module.exports = {
    apps: [
        {
            name: "scriptai-web",
            script: "node_modules/.bin/next",
            args: "start -p 6001",
            cwd: "/var/www/ai-scrape",
            env: {
                NODE_ENV: "production",
                PORT: 6001,
            },
            instances: 1,
            autorestart: true,
            max_memory_restart: "500M",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            error_file: "/var/www/ai-scrape/logs/web-error.log",
            out_file: "/var/www/ai-scrape/logs/web-out.log",
        },
        {
            name: "scriptai-worker",
            script: "node_modules/.bin/tsx",
            args: "src/lib/worker.ts",
            cwd: "/var/www/ai-scrape",
            env: {
                NODE_ENV: "production",
            },
            instances: 1,
            autorestart: true,
            max_memory_restart: "500M",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            error_file: "/var/www/ai-scrape/logs/worker-error.log",
            out_file: "/var/www/ai-scrape/logs/worker-out.log",
        },
    ],
};
