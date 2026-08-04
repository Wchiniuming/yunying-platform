import { spawn } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'
import path from 'node:path'

const suites = [
  'tests/api/00_l0_smoke.test.js',
  'tests/api/01_auth.test.js',
  'tests/api/02_customers.test.js',
  'tests/api/03_orders.test.js',
  'tests/api/04_products.test.js',
  'tests/api/05_settings.test.js',
  'tests/api/06_stats.test.js',
  'tests/api/07_consistency.test.js',
  'tests/api/08_perf.test.js',
]

let totalPassed = 0
let totalFailed = 0
const allBugs = []

console.log(`run-all cwd: ${process.cwd()}`)
console.log(`Looking for package.json marker...`)
if (!process.cwd().endsWith('yunying_platform')) {
  console.error(`\n  WARNING: cwd (${process.cwd()}) does not look like project root.`)
  console.error(`  Please cd to the project root first: cd E:\\workspace\\yunying_platform\n`)
}

for (const suite of suites) {
  console.log(`\n${'='.repeat(60)}\nRunning ${suite}\n${'='.repeat(60)}`)
  const absPath = path.resolve(process.cwd(), suite)
  console.log(`  absPath: ${absPath}`)
  const p = spawn(process.execPath, [absPath], { cwd: process.cwd(), stdio: 'inherit' })
  const code = await new Promise((resolve) => {
    p.once('exit', resolve)
  })
  if (code !== 0) totalFailed++
  else totalPassed++
  await wait(500)
}

console.log(`\n${'='.repeat(60)}`)
console.log(`Suites passed: ${totalPassed} / ${suites.length}`)
console.log(`Suites failed: ${totalFailed}`)
console.log('='.repeat(60))
process.exit(totalFailed > 0 ? 1 : 0)