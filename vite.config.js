import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      three: "three",
    },
  },
  server: {
    headers: {
      "X-Frame-Options": "", // Allow iframe embedding
      "Content-Security-Policy": "frame-ancestors *;", // Allow all websites to embed
    },
  },
});
