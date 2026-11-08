import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 项目页部署在 /<repo>/ 子路径
  base: '/word-machine/',
  plugins: [react()],
})
