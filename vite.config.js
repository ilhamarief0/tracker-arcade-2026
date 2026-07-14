import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import express from 'express'
import { createApiRouter } from './server/profile-checker.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'arcade-profile-api',
      configureServer(server) {
        server.middlewares.use(express().use(createApiRouter()))
      },
    },
  ],
})
