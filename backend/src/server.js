import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(currentDir, '../.env') })
dotenv.config()

import app from './app.js'

const port = Number(process.env.PORT) || 3000

app.listen(port, () => {
  console.log(`PediaCare API disponible en http://localhost:${port}`)
})
