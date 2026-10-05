/**
 * Verify that the app.asar produced by electron-builder contains every runtime dependency of the main/preload bundles.
 *
 * Background: several releases built and signed fine but crashed on launch because electron-builder silently dropped
 * runtime deps from app.asar (pnpm >= 10.29.3 + electron-builder 26.1.0 dropped `array-timsort`; electron-builder
 * 26.13.1 ~ 26.17.0 dropped `picgo` itself because the root package shares its name). This script makes such builds
 * fail in CI instead of after release.
 *
 * Two layers:
 *   1. Static closure check: collect every bare module specifier that the packaged main/preload bundles still
 *      `require`/`import` at runtime (renderer code is bundled by vite and is ignored), then walk each package's
 *      `dependencies` inside the asar using Node's node_modules lookup algorithm. Missing optional dependencies are
 *      ignored (they are usually platform specific), everything else is reported with its full chain.
 *   2. Runtime smoke test: run the packaged Electron binary with ELECTRON_RUN_AS_NODE=1 and `require` every external
 *      from inside app.asar. Only MODULE_NOT_FOUND errors fail the check; other errors are reported as warnings since
 *      some modules may legitimately expect a full Electron environment.
 *
 * Usage:
 *   node scripts/verify-packaged-deps.js [--dist <dir>] [--asar <path/to/app.asar>]... [--skip-runtime]
 *
 * Without `--asar`, every app.asar found under `--dist` (default `dist`) is checked.
 */

const fs = require('fs')
const path = require('path')
const { builtinModules } = require('module')
const { spawnSync } = require('child_process')
const ts = require('typescript')

const ROOT_DIR = path.join(__dirname, '..')

// Modules provided by the runtime itself rather than by node_modules.
const RUNTIME_PROVIDED_MODULES = new Set(['electron', ...builtinModules])

// Marker used to find the JSON result in the smoke test output, since required modules may print to stdout.
const RESULT_MARKER = '__PICGO_VERIFY_PACKAGED_DEPS_RESULT__'

const RUNTIME_TIMEOUT_MS = 60 * 1000

function loadAsar () {
  try {
    return require('@electron/asar')
  } catch {
    // @electron/asar is a dependency of electron-builder (app-builder-lib); resolve it from there if it is not hoisted.
    const appBuilderLibDir = path.dirname(require.resolve('app-builder-lib/package.json', {
      paths: [path.dirname(require.resolve('electron-builder/package.json'))]
    }))
    return require(require.resolve('@electron/asar', { paths: [appBuilderLibDir] }))
  }
}

const asar = loadAsar()

function parseArgs (argv) {
  const options = { dist: path.join(ROOT_DIR, 'dist'), asarPaths: [], skipRuntime: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dist') {
      options.dist = path.resolve(argv[++i])
    } else if (arg === '--asar') {
      options.asarPaths.push(path.resolve(argv[++i]))
    } else if (arg === '--skip-runtime') {
      options.skipRuntime = true
    } else if (arg === '-h' || arg === '--help') {
      console.log('Usage: node scripts/verify-packaged-deps.js [--dist <dir>] [--asar <path/to/app.asar>]... [--skip-runtime]')
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return options
}

/**
 * Find packaged apps under the electron-builder output dir, e.g. `dist/mac-arm64/PicGo.app/Contents/Resources/app.asar`,
 * `dist/linux-unpacked/resources/app.asar` or `dist/win-unpacked/resources/app.asar`.
 */
function findAsarFiles (distDir) {
  if (!fs.existsSync(distDir)) return []
  const results = []
  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const outDir = path.join(distDir, entry.name)
    const candidates = [path.join(outDir, 'resources', 'app.asar')]
    for (const child of fs.readdirSync(outDir)) {
      if (child.endsWith('.app')) candidates.push(path.join(outDir, child, 'Contents', 'Resources', 'app.asar'))
    }
    results.push(...candidates.filter(candidate => fs.existsSync(candidate)))
  }
  return results
}

/**
 * Locate the Electron executable that ships next to the asar, so the smoke test runs with the exact runtime users get.
 */
function findAppExecutable (asarPath) {
  const resourcesDir = path.dirname(asarPath)
  if (path.basename(path.dirname(resourcesDir)) === 'Contents') {
    const macOSDir = path.join(path.dirname(resourcesDir), 'MacOS')
    const binaries = fs.existsSync(macOSDir) ? fs.readdirSync(macOSDir) : []
    return binaries.length > 0 ? { platform: 'darwin', file: path.join(macOSDir, binaries[0]) } : null
  }
  const appDir = path.dirname(resourcesDir)
  for (const file of fs.readdirSync(appDir)) {
    const fullPath = path.join(appDir, file)
    if (!fs.statSync(fullPath).isFile()) continue
    if (file.toLowerCase() === 'picgo.exe') return { platform: 'win32', file: fullPath }
    if (file === 'PicGo' || file === 'picgo') return { platform: 'linux', file: fullPath }
  }
  return null
}

class AsarArchive {
  constructor (asarPath) {
    this.asarPath = asarPath
    this.entries = asar.listPackage(asarPath, { isPack: false }).map(entry => entry.split(path.sep).join('/'))
  }

  exists (filename) {
    try {
      asar.statFile(this.asarPath, filename.replace(/^\//, ''), true)
      return true
    } catch {
      return false
    }
  }

  readText (filename) {
    return asar.extractFile(this.asarPath, filename.replace(/^\//, ''), true).toString('utf8')
  }

  readJson (filename) {
    return JSON.parse(this.readText(filename))
  }
}

function getPackageName (specifier) {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

function isExternalPackageSpecifier (specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(specifier)) return false
  if (specifier.startsWith('node:')) return false
  return !RUNTIME_PROVIDED_MODULES.has(getPackageName(specifier))
}

/**
 * Collect module specifiers from require()/import()/import/export-from with string literal arguments. Parsing the AST
 * (instead of grepping) avoids false positives from examples inside comments such as `require('yaku')`.
 */
function collectModuleSpecifiers (code, fileName) {
  const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS)
  const specifiers = new Set()
  const visit = node => {
    if (ts.isCallExpression(node) && node.arguments.length > 0 && ts.isStringLiteralLike(node.arguments[0])) {
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require'
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword
      if (isRequire || isDynamicImport) specifiers.add(node.arguments[0].text)
    } else if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
      specifiers.add(node.moduleSpecifier.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return specifiers
}

/**
 * Collect external packages required by the packaged main/preload code. Returns Map<specifier, Set<file>>.
 */
function collectExternalModules (archive) {
  const externals = new Map()
  const entryFiles = archive.entries.filter(entry => (
    /\.(c|m)?js$/.test(entry) &&
    !entry.split('/').includes('node_modules') &&
    !entry.startsWith('/dist_electron/renderer/')
  ))
  for (const file of entryFiles) {
    for (const specifier of collectModuleSpecifiers(archive.readText(file), file)) {
      if (!isExternalPackageSpecifier(specifier)) continue
      if (!externals.has(specifier)) externals.set(specifier, new Set())
      externals.get(specifier).add(file.replace(/^\//, ''))
    }
  }
  return { externals, entryFiles }
}

/**
 * Node's node_modules lookup: from `fromDir` walk up to the archive root, trying `<dir>/node_modules/<name>`.
 */
function resolvePackageDir (archive, fromDir, packageName) {
  let dir = fromDir
  while (true) {
    if (path.posix.basename(dir) !== 'node_modules') {
      const candidate = path.posix.join(dir, 'node_modules', packageName)
      if (archive.exists(`${candidate}/package.json`)) return candidate
    }
    if (dir === '/') return null
    dir = path.posix.dirname(dir)
  }
}

function checkStaticClosure (archive, externals) {
  const missing = []
  const visited = new Set()
  // Each queue item carries the dependency chain that led to it, so a failure can be reported as `a -> b -> c`.
  const queue = []

  for (const [specifier, files] of externals) {
    const packageName = getPackageName(specifier)
    const fromFile = [...files][0]
    const packageDir = resolvePackageDir(archive, path.posix.dirname(`/${fromFile}`), packageName)
    if (!packageDir) {
      missing.push({ chain: [`${fromFile} (require)`, packageName] })
      continue
    }
    queue.push({ packageDir, chain: [packageName] })
  }

  while (queue.length > 0) {
    const { packageDir, chain } = queue.shift()
    if (visited.has(packageDir)) continue
    visited.add(packageDir)

    const pkg = archive.readJson(`${packageDir}/package.json`)
    const optionalDependencies = pkg.optionalDependencies || {}
    const dependencyNames = new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(optionalDependencies)])

    for (const dependencyName of dependencyNames) {
      const dependencyDir = resolvePackageDir(archive, packageDir, dependencyName)
      if (dependencyDir) {
        queue.push({ packageDir: dependencyDir, chain: [...chain, dependencyName] })
      } else if (!(dependencyName in optionalDependencies)) {
        // Missing optional dependencies are expected: they are usually native binaries for other platforms/arches.
        missing.push({ chain: [...chain, dependencyName] })
      }
    }
  }

  return { missing, checkedPackages: visited.size }
}

/**
 * Root `dependencies` that are not in the asar at all. Most of them are renderer deps bundled by vite, so this is only
 * a diagnostic hint (it makes the "root package name collision" failure mode obvious) and never fails the check.
 */
function findMissingRootDependencies (archive) {
  const pkg = archive.readJson('/package.json')
  return Object.keys(pkg.dependencies || {}).filter(name => !resolvePackageDir(archive, '/', name))
}

// Executed inside the packaged Electron binary with ELECTRON_RUN_AS_NODE=1; argv: [asarPath, marker, ...specifiers].
const RUNTIME_CHECK_SOURCE = `
const path = require('path')
const { createRequire } = require('module')
const [asarPath, marker, ...specifiers] = process.argv.slice(1)
const requireFromApp = createRequire(path.join(asarPath, 'dist_electron', 'main', 'index.js'))
const results = []
for (const specifier of specifiers) {
  try {
    requireFromApp(specifier)
    results.push({ specifier, ok: true })
  } catch (error) {
    results.push({ specifier, ok: false, code: error && error.code, message: String(error && error.message || error).split('\\n')[0] })
  }
}
process.stdout.write('\\n' + marker + JSON.stringify(results) + '\\n', () => process.exit(0))
`

function runRuntimeCheck (asarPath, specifiers) {
  const executable = findAppExecutable(asarPath)
  if (!executable) {
    return { skipped: 'packaged Electron executable not found' }
  }
  if (executable.platform !== process.platform) {
    return { skipped: `executable is for ${executable.platform}, current platform is ${process.platform}` }
  }

  const result = spawnSync(executable.file, ['-e', RUNTIME_CHECK_SOURCE, asarPath, RESULT_MARKER, ...specifiers], {
    cwd: path.dirname(asarPath),
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    encoding: 'utf8',
    timeout: RUNTIME_TIMEOUT_MS,
    maxBuffer: 64 * 1024 * 1024
  })

  const markerLine = (result.stdout || '').split('\n').find(line => line.startsWith(RESULT_MARKER))
  if (!markerLine) {
    const details = [
      result.error ? `spawn error: ${result.error.message}` : `exit code: ${result.status}, signal: ${result.signal}`,
      (result.stderr || '').trim().split('\n').slice(-20).join('\n')
    ].filter(Boolean).join('\n')
    return { fatal: `failed to run ${executable.file} with ELECTRON_RUN_AS_NODE=1\n${details}` }
  }

  return { results: JSON.parse(markerLine.slice(RESULT_MARKER.length)), executable: executable.file }
}

function verifyAsar (asarPath, options) {
  const relativeAsarPath = path.relative(ROOT_DIR, asarPath) || asarPath
  console.log(`\n[verify-packaged-deps] Checking ${relativeAsarPath}`)

  const archive = new AsarArchive(asarPath)
  const { externals, entryFiles } = collectExternalModules(archive)
  if (entryFiles.length === 0) {
    console.error('  [x] No main/preload JS files found in the asar')
    return false
  }
  if (externals.size === 0) {
    console.error(`  [x] No external modules found in ${entryFiles.join(', ')}; refusing to report success on an empty check`)
    return false
  }

  const specifiers = [...externals.keys()].sort()
  console.log(`  Entry files: ${entryFiles.map(file => file.replace(/^\//, '')).join(', ')}`)
  console.log(`  External modules (${specifiers.length}): ${specifiers.join(', ')}`)

  let ok = true

  const { missing, checkedPackages } = checkStaticClosure(archive, externals)
  if (missing.length > 0) {
    ok = false
    console.error(`  [x] Static check: ${missing.length} missing dependenc${missing.length === 1 ? 'y' : 'ies'} in app.asar:`)
    for (const { chain } of missing) console.error(`      ${chain.join(' -> ')}`)
  } else {
    console.log(`  [ok] Static check: ${checkedPackages} packages in the runtime dependency closure all resolve`)
  }

  const missingRootDependencies = findMissingRootDependencies(archive)
  if (missingRootDependencies.length > 0) {
    console.warn(`  [warn] Root package.json dependencies not present in app.asar (${missingRootDependencies.length}): ${missingRootDependencies.join(', ')}`)
  }

  if (options.skipRuntime) {
    console.log('  [skip] Runtime check: --skip-runtime')
    return ok
  }

  const runtime = runRuntimeCheck(asarPath, specifiers)
  if (runtime.skipped) {
    console.warn(`  [skip] Runtime check: ${runtime.skipped}`)
  } else if (runtime.fatal) {
    ok = false
    console.error(`  [x] Runtime check: ${runtime.fatal}`)
  } else {
    const notFound = runtime.results.filter(result => !result.ok && result.code === 'MODULE_NOT_FOUND')
    const otherErrors = runtime.results.filter(result => !result.ok && result.code !== 'MODULE_NOT_FOUND')
    for (const result of otherErrors) {
      // Not a packaging problem by itself: the module may depend on a full Electron environment when loaded.
      console.warn(`  [warn] Runtime check: require('${result.specifier}') threw ${result.code || 'an error'}: ${result.message}`)
    }
    if (notFound.length > 0) {
      ok = false
      console.error(`  [x] Runtime check: ${notFound.length} module(s) failed with MODULE_NOT_FOUND:`)
      for (const result of notFound) console.error(`      require('${result.specifier}'): ${result.message}`)
    } else {
      console.log(`  [ok] Runtime check: required ${runtime.results.length - otherErrors.length}/${runtime.results.length} externals with ${path.relative(ROOT_DIR, runtime.executable)} (ELECTRON_RUN_AS_NODE=1)`)
    }
  }

  return ok
}

function main () {
  const options = parseArgs(process.argv.slice(2))
  const asarPaths = options.asarPaths.length > 0 ? options.asarPaths : findAsarFiles(options.dist)
  if (asarPaths.length === 0) {
    console.error(`[verify-packaged-deps] No app.asar found under ${options.dist}. Run electron-builder with a \`dir\` target first.`)
    process.exit(1)
  }

  const failed = asarPaths.filter(asarPath => !verifyAsar(asarPath, options))
  if (failed.length > 0) {
    console.error(`\n[verify-packaged-deps] FAILED: ${failed.length}/${asarPaths.length} packaged app(s) are missing runtime dependencies.`)
    process.exit(1)
  }
  console.log(`\n[verify-packaged-deps] OK: ${asarPaths.length} packaged app(s) verified.`)
}

main()
