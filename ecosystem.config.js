module.exports = {
    apps: [
        {
            name: "scriptai-web",
            script: "npm",
            args: "run start -- -p 6001",
            cwd: "/var/www/project-scrape",
            env: {
                NODE_ENV: "production",
                PORT: 6001,
            },
            instances: 1,
            autorestart: true,
            max_memory_restart: "500M",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            error_file: "/var/www/project-scrape/logs/web-error.log",
            out_file: "/var/www/project-scrape/logs/web-out.log",
        },
        {
            // Multi-queue worker: spawns 4 platform-specific BullMQ Worker instances:
            //   script-instagram  → concurrency 10
            //   script-tiktok     → concurrency 10
            //   script-youtube    → concurrency 10
            //   script-linkedin   → concurrency 5
            // Total: up to 35 parallel jobs across all platforms simultaneously.
            // LinkedIn (Apify) never blocks video (transcription) jobs.
            name: "scriptai-worker",
            script: "npm",
            args: "run worker",
            cwd: "/var/www/project-scrape",
            env: {
                NODE_ENV: "production",
            },
            instances: 1,
            autorestart: true,
            max_memory_restart: "800M",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            error_file: "/var/www/project-scrape/logs/worker-error.log",
            out_file: "/var/www/project-scrape/logs/worker-out.log",
        },
    ],
};
