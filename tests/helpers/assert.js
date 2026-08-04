export class TestRunner {
  constructor(suiteName) {
    this.suite = suiteName
    this.cases = []
    this.passed = 0
    this.failed = 0
    this.bugs = []
  }
  case(name, fn) {
    this.cases.push({ name, fn })
    return this
  }
  async run() {
    console.log(`\n=== ${this.suite} ===`)
    for (const c of this.cases) {
      try {
        await c.fn()
        this.passed++
        console.log(`  ✓ ${c.name}`)
      } catch (err) {
        this.failed++
        const bug = {
          suite: this.suite,
          case: c.name,
          message: err.message,
          stack: err.stack,
          actual: err.actual,
          expected: err.expected,
        }
        this.bugs.push(bug)
        console.log(`  ✗ ${c.name}: ${err.message}`)
      }
    }
    console.log(`  → ${this.passed} passed, ${this.failed} failed`)
    return { passed: this.passed, failed: this.failed, bugs: this.bugs }
  }
}

export function assert(cond, msg, meta = {}) {
  if (!cond) {
    const e = new Error(msg)
    Object.assign(e, meta)
    throw e
  }
}

export function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw Object.assign(new Error(`${msg || 'assertEqual failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`), { actual, expected })
  }
}

export function assertOk(res, msg = 'response not ok') {
  if (!res || res.data?.code !== 200) {
    throw Object.assign(new Error(`${msg}: ${JSON.stringify(res?.data)}`), { actual: res?.data })
  }
}

export function assertHasFields(obj, fields, msg) {
  const missing = fields.filter(f => !(f in (obj || {})))
  if (missing.length) {
    throw Object.assign(new Error(`${msg || 'missing fields'}: ${missing.join(',')}`), { actual: obj })
  }
}
