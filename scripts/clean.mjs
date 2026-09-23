import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

for (const dir of ['dist', 'dist-ssr', 'src/generated', 'public/image']) {
  const target = path.join(root, dir)
  fs.rmSync(target, { recursive: true, force: true })
  console.log('removed', dir)
}
