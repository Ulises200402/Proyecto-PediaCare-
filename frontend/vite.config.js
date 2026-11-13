import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vitest/config'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url))
const localKey = path.join(frontendDirectory, '.certs', 'localhost-key.pem')
const localCertificate = path.join(frontendDirectory, '.certs', 'localhost.pem')
const localHttps = existsSync(localKey) && existsSync(localCertificate)
  ? {
      key: readFileSync(localKey),
      cert: readFileSync(localCertificate),
    }
  : undefined

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: './src/test-setup.js',
  },
  server: {
    https: localHttps,
    proxy: {
      '/api/auth': 'http://localhost:3001',
      '/api/patients': 'http://localhost:3001',
      '/api/clinical': 'http://localhost:3002',
      '/api/consultations': 'http://localhost:3002',
      '/api/appointments': 'http://localhost:3003',
      '/api/notifications': 'http://localhost:3003',
      '/api/health': 'http://localhost:3003',
      '/api/docs': 'http://localhost:3001',
      '/api/openapi.json': 'http://localhost:3001',
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
