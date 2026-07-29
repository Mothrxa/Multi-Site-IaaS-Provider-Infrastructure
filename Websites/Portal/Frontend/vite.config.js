import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { homedir } from 'os'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    sourcemap: true,
    outDir: resolve(homedir(), 'Desktop/Workplace/Portal/dist'),
    emptyOutDir: true,
  },
})
