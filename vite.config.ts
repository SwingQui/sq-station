import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { consoleStrip } from "./vite-plugin-console-strip";
import path from "path";

export default defineConfig({
	plugins: [react(), cloudflare(), consoleStrip()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src/react-app"),
			"@components": path.resolve(__dirname, "./src/react-app/components"),
			"@pages": path.resolve(__dirname, "./src/react-app/pages"),
			"@api": path.resolve(__dirname, "./src/react-app/api"),
			"@utils": path.resolve(__dirname, "./src/react-app/utils"),
			"@types": path.resolve(__dirname, "./src/react-app/types"),
		},
	},
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
