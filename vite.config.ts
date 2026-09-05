import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // Served as a project Pages site (github.com/MuhammadHussain2004/My-Portfolio)
  // rather than a user Pages site, so it lives under a /My-Portfolio/ subpath
  // instead of the domain root - every asset URL needs that prefix.
  base: '/My-Portfolio/',
  plugins: [react(), tailwindcss()],
})
