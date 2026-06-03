// vite.config.ts
import { defineConfig } from "file:///C:/code/ai2/2D%20%E6%A8%AA%E7%89%88%E9%97%AF%E5%85%B3%E8%81%94%E6%9C%BA/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/code/ai2/2D%20%E6%A8%AA%E7%89%88%E9%97%AF%E5%85%B3%E8%81%94%E6%9C%BA/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import Inspector from "file:///C:/code/ai2/2D%20%E6%A8%AA%E7%89%88%E9%97%AF%E5%85%B3%E8%81%94%E6%9C%BA/node_modules/unplugin-vue-dev-locator/dist/vite.mjs";
import traeBadgePlugin from "file:///C:/code/ai2/2D%20%E6%A8%AA%E7%89%88%E9%97%AF%E5%85%B3%E8%81%94%E6%9C%BA/node_modules/vite-plugin-trae-solo-badge/dist/vite-plugin.esm.js";
var __vite_injected_original_dirname = "C:\\code\\ai2\\2D \u6A2A\u7248\u95EF\u5173\u8054\u673A";
var vite_config_default = defineConfig({
  build: {
    sourcemap: "hidden"
  },
  plugins: [
    vue(),
    Inspector(),
    traeBadgePlugin({
      variant: "dark",
      position: "bottom-right",
      prodOnly: true,
      clickable: true,
      clickUrl: "https://www.trae.ai/solo?showJoin=1",
      autoTheme: true,
      autoThemeTarget: "#app"
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
      // ✅ 定义 @ = src
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxjb2RlXFxcXGFpMlxcXFwyRCBcdTZBMkFcdTcyNDhcdTk1RUZcdTUxNzNcdTgwNTRcdTY3M0FcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXGNvZGVcXFxcYWkyXFxcXDJEIFx1NkEyQVx1NzI0OFx1OTVFRlx1NTE3M1x1ODA1NFx1NjczQVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovY29kZS9haTIvMkQlMjAlRTYlQTglQUElRTclODklODglRTklOTclQUYlRTUlODUlQjMlRTglODElOTQlRTYlOUMlQkEvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IEluc3BlY3RvciBmcm9tICd1bnBsdWdpbi12dWUtZGV2LWxvY2F0b3Ivdml0ZSdcbmltcG9ydCB0cmFlQmFkZ2VQbHVnaW4gZnJvbSAndml0ZS1wbHVnaW4tdHJhZS1zb2xvLWJhZGdlJ1xuXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiAnaGlkZGVuJyxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIEluc3BlY3RvcigpLFxuICAgIHRyYWVCYWRnZVBsdWdpbih7XG4gICAgICB2YXJpYW50OiAnZGFyaycsXG4gICAgICBwb3NpdGlvbjogJ2JvdHRvbS1yaWdodCcsXG4gICAgICBwcm9kT25seTogdHJ1ZSxcbiAgICAgIGNsaWNrYWJsZTogdHJ1ZSxcbiAgICAgIGNsaWNrVXJsOiAnaHR0cHM6Ly93d3cudHJhZS5haS9zb2xvP3Nob3dKb2luPTEnLFxuICAgICAgYXV0b1RoZW1lOiB0cnVlLFxuICAgICAgYXV0b1RoZW1lVGFyZ2V0OiAnI2FwcCcsXG4gICAgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSwgLy8gXHUyNzA1IFx1NUI5QVx1NEU0OSBAID0gc3JjXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJTLFNBQVMsb0JBQW9CO0FBQ3hVLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFDakIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8scUJBQXFCO0FBSjVCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQSxFQUNiO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixVQUFVO0FBQUEsSUFDVixnQkFBZ0I7QUFBQSxNQUNkLFNBQVM7QUFBQSxNQUNULFVBQVU7QUFBQSxNQUNWLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLElBQ25CLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUE7QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
