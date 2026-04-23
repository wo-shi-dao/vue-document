import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    open: true, // 设置服务启动时是否自动打开浏览器
    cors: true, // 允许跨域
    host: true,
    // 设置代理，根据我们项目实际情况配置
    proxy: {
      // 项目原有的通用代理配置
      "/dev-api": {
        target: "http://localhost:8081/pageoffice6-springboot2-back",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev-api/, ""),
        ws: true, //必须，启用websocket。
      },
    },
  },
});
