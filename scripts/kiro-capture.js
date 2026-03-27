// kiro-capture.js — playwright frame-by-frame capture
import { chromium } from 'playwright'
import { execSync, spawn } from 'child_process'
import { mkdirSync, existsSync, rmSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const FRAMES_DIR = resolve(ROOT, 'output', 'kiro-frames')
const PORT = 4180

async function main() {
  // clean + create frames dir
  if (existsSync(FRAMES_DIR)) rmSync(FRAMES_DIR, { recursive: true })
  mkdirSync(FRAMES_DIR, { recursive: true })

  // build
  console.log('→ building project...')
  execSync('npx vite build', { cwd: ROOT, stdio: 'inherit' })

  // kill anything on our port
  try { execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'pipe' }) } catch (e) {}

  // start preview server
  console.log('→ starting preview server...')
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    cwd: ROOT, stdio: 'pipe',
  })
  await new Promise((r) => setTimeout(r, 3000))

  console.log('→ launching browser...')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })

  await page.goto(`http://localhost:${PORT}/?capture`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__kiroReady === true, { timeout: 10000 })

  const duration = await page.evaluate(() => window.__kiroDuration)
  const fps = await page.evaluate(() => window.__kiroFPS)
  const totalFrames = Math.ceil(duration * fps)

  console.log(`→ capturing ${totalFrames} frames (${duration}s @ ${fps}fps)...`)

  const startTime = Date.now()
  for (let i = 0; i < totalFrames; i++) {
    const progress = totalFrames <= 1 ? 0 : i / (totalFrames - 1)
    // set progress and force a render tick
    await page.evaluate((p) => {
      window.__kiroTimeline.progress(p)
      // force layout recalc
      document.body.offsetHeight
    }, progress)
    const framePath = resolve(FRAMES_DIR, `frame-${String(i).padStart(4, '0')}.png`)
    await page.screenshot({ path: framePath })
    if (i % 60 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`  frame ${i}/${totalFrames} (${elapsed}s elapsed)`)
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  const frameCount = readdirSync(FRAMES_DIR).filter((f) => f.endsWith('.png')).length
  console.log(`→ captured ${frameCount} frames in ${totalTime}s`)

  await browser.close()
  server.kill()
}

main().catch((e) => { console.error(e); process.exit(1) })
