import { spawn } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'
import axios from 'axios'
import fs from 'node:fs'
import path from 'node:path'

const REPO_ROOT = process.cwd()

let serverProcess = null
let currentPort = null
let currentDbPath = null

export function makeDbPath(name) {
  const dir = path.join(REPO_ROOT, 'tests', '.test-data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${name}.db`)
}

export function cleanDb(name) {
  const p = makeDbPath(name)
  if (fs.existsSync(p)) fs.unlinkSync(p)
  const journal = p + '-journal'
  if (fs.existsSync(journal)) fs.unlinkSync(journal)
  const wal = p + '-wal'
  if (fs.existsSync(wal)) fs.unlinkSync(wal)
  const shm = p + '-shm'
  if (fs.existsSync(shm)) fs.unlinkSync(shm)
}

export async function startServer({ port = 13901, dbName = 'apitest', init = true } = {}) {
  if (serverProcess) throw new Error('server already running')
  if (init) cleanDb(dbName)
  const dbPath = makeDbPath(dbName)
  currentDbPath = dbPath
  currentPort = port
  serverProcess = spawn(process.execPath, ['server/index.js'], {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT: String(port), DB_PATH: dbPath, DISABLE_SEED: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  serverProcess.stdout.on('data', (b) => process.stdout.write(`[server] ${b}`))
  serverProcess.stderr.on('data', (b) => process.stderr.write(`[server-err] ${b}`))
  await waitForReady(port, 15000)
}

async function waitForReady(port, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await axios.get(`http://localhost:${port}/api/app/info`, { timeout: 1000 })
      if (r.data && r.data.code === 200) return
    } catch (_) {}
    await wait(150)
  }
  throw new Error(`server not ready on port ${port} after ${timeoutMs}ms`)
}

export async function stopServer() {
  if (!serverProcess) return
  const p = serverProcess
  serverProcess = null
  return new Promise((resolve) => {
    p.once('exit', () => resolve())
    p.kill('SIGTERM')
    setTimeout(() => { try { p.kill('SIGKILL') } catch (_) {} resolve() }, 2000)
  })
}

export function client({ token = null, baseURL = null } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return axios.create({
    baseURL: baseURL || `http://localhost:${currentPort}`,
    timeout: 8000,
    headers,
    validateStatus: () => true,
  })
}

export function getDbPath() { return currentDbPath }
export function getPort() { return currentPort }
export function getRepoRoot() { return REPO_ROOT }
