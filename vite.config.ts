import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { consoleStrip } from "./vite-plugin-console-strip";

export default defineConfig({
	plugins: [react(), cloudflare(), consoleStrip()],
	server: {
		proxy: {
			// 将 /api/* 请求代理到后端 Wrangler 服务器
			"/api": {
				target: "http://localhost:8787",
				changeOrigin: true,
			},
		},
	},
});
