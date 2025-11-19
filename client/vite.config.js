import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// React Fast Refresh injects eval, so keep it off unless explicitly enabled
const allowFastRefresh = process.env.ENABLE_FAST_REFRESH === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ fastRefresh: allowFastRefresh })],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
