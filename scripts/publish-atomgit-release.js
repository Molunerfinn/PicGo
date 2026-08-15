const fs = require('fs')
const path = require('path')

const API_URL = process.env.ATOM_API_URL || 'https://api.atomgit.com/api/v5'
const ATOM_PAT = process.env.ATOM_PAT
const ATOM_OWNER = process.env.ATOM_OWNER
const ATOM_REPO = process.env.ATOM_REPO
const RELEASE_TAG = process.env.RELEASE_TAG
const TARGET_COMMITISH = process.env.ATOM_TARGET_COMMITISH
const DIST_DIR = path.resolve(process.env.DIST_DIR || 'dist')
const RELEASE_METADATA_PATH = path.resolve(process.env.GITHUB_RELEASE_JSON || 'github-release.json')
const MAX_ATTEMPTS = 3
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])
const UPLOAD_TIMEOUT_MINUTES = Number.parseInt(process.env.ATOM_UPLOAD_TIMEOUT_MINUTES || '10', 10)

function requireEnvironmentVariable(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
}

function encodePathSegment(value) {
  return encodeURIComponent(value)
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function formatFileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDuration(milliseconds) {
  return `${Math.round(milliseconds / 1000)}s`
}

async function requestWithRetry(url, createOptions, label) {
  let lastError

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, createOptions())
      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_ATTEMPTS) {
        return response
      }

      await response.text()
      console.warn(`[AtomGit] ${label} returned ${response.status}; retrying (${attempt}/${MAX_ATTEMPTS})`)
    } catch (error) {
      lastError = error
      if (attempt === MAX_ATTEMPTS) {
        throw error
      }

      console.warn(`[AtomGit] ${label} failed; retrying (${attempt}/${MAX_ATTEMPTS})`)
    }

    await wait(1000 * attempt)
  }

  throw lastError || new Error(`${label} failed after ${MAX_ATTEMPTS} attempts`)
}

function atomGitApiUrl(relativePath) {
  return `${API_URL}/repos/${encodePathSegment(ATOM_OWNER)}/${encodePathSegment(ATOM_REPO)}${relativePath}`
}

function atomGitHeaders(additionalHeaders = {}) {
  return {
    Authorization: `Bearer ${ATOM_PAT}`,
    Accept: 'application/json',
    ...additionalHeaders
  }
}

async function readResponseBody(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function formatResponseBody(body) {
  return typeof body === 'string' ? body : JSON.stringify(body)
}

async function assertSuccessfulResponse(response, label) {
  const body = await readResponseBody(response)
  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}: ${formatResponseBody(body)}`)
  }

  return body
}

async function verifyCredentials() {
  const response = await requestWithRetry(
    `${API_URL}/user`,
    () => ({ headers: atomGitHeaders() }),
    'credential verification'
  )
  await assertSuccessfulResponse(response, 'AtomGit credential verification')
}

async function getRelease() {
  const response = await requestWithRetry(
    atomGitApiUrl(`/releases/tags/${encodePathSegment(RELEASE_TAG)}`),
    () => ({ headers: atomGitHeaders() }),
    `get release ${RELEASE_TAG}`
  )

  if (response.status === 404) {
    await response.text()
    return null
  }

  return assertSuccessfulResponse(response, `Get AtomGit release ${RELEASE_TAG}`)
}

async function createRelease(metadata) {
  const name = metadata.name || RELEASE_TAG
  const payload = {
    tag_name: RELEASE_TAG,
    name,
    body: metadata.body || `Release ${name}`,
    release_status: metadata.isPrerelease ? 'pre' : 'latest'
  }
  const targetCommitish = TARGET_COMMITISH || metadata.targetCommitish

  if (targetCommitish) {
    payload.target_commitish = targetCommitish
  }

  const response = await requestWithRetry(
    atomGitApiUrl('/releases'),
    () => ({
      method: 'POST',
      headers: atomGitHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    }),
    `create release ${RELEASE_TAG}`
  )

  if (response.status === 409) {
    await response.text()
    return getRelease()
  }

  return assertSuccessfulResponse(response, `Create AtomGit release ${RELEASE_TAG}`)
}

async function getOrCreateRelease(metadata) {
  const existingRelease = await getRelease()
  if (existingRelease) {
    console.log(`[AtomGit] Release ${RELEASE_TAG} already exists`)
    return existingRelease
  }

  console.log(`[AtomGit] Creating release ${RELEASE_TAG}`)
  const createdRelease = await createRelease(metadata)
  if (!createdRelease) {
    throw new Error(`AtomGit release ${RELEASE_TAG} was not available after creation`)
  }

  return createdRelease
}

async function getUploadRequest(fileName) {
  const url = new URL(atomGitApiUrl(`/releases/${encodePathSegment(RELEASE_TAG)}/upload_url`))
  url.searchParams.set('file_name', fileName)

  const response = await requestWithRetry(
    url,
    () => ({ headers: atomGitHeaders() }),
    `request upload URL for ${fileName}`
  )
  const body = await assertSuccessfulResponse(response, `Get upload URL for ${fileName}`)

  if (!body || typeof body !== 'object' || typeof body.url !== 'string' || !body.headers || typeof body.headers !== 'object') {
    throw new Error(`AtomGit returned an invalid upload request for ${fileName}`)
  }

  return body
}

async function uploadAsset(filePath) {
  const fileName = path.basename(filePath)
  const fileBuffer = await fs.promises.readFile(filePath)
  const fileSize = fileBuffer.byteLength
  const startedAt = Date.now()

  console.log(`[AtomGit] Uploading ${fileName} (${formatFileSize(fileSize)})`)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const uploadRequest = await getUploadRequest(fileName)
    const uploadHeaders = new Headers(uploadRequest.headers)
    uploadHeaders.set('Content-Length', String(fileSize))
    let response

    try {
      response = await fetch(uploadRequest.url, {
        method: 'PUT',
        headers: uploadHeaders,
        body: fileBuffer,
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MINUTES * 60 * 1000)
      })
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw error
      }

      console.warn(`[AtomGit] Upload ${fileName} failed; requesting a new upload URL (${attempt}/${MAX_ATTEMPTS})`)
      await wait(1000 * attempt)
      continue
    }

    if (response.ok) {
      await response.text()
      console.log(`[AtomGit] Uploaded ${fileName} in ${formatDuration(Date.now() - startedAt)}`)
      return
    }

    const responseBody = await readResponseBody(response)
    if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_ATTEMPTS) {
      throw new Error(`Upload ${fileName} failed with HTTP ${response.status}: ${formatResponseBody(responseBody)}`)
    }

    console.warn(`[AtomGit] Upload ${fileName} returned ${response.status}; requesting a new upload URL (${attempt}/${MAX_ATTEMPTS})`)
    await wait(1000 * attempt)
  }
}

function readReleaseMetadata() {
  const metadata = JSON.parse(fs.readFileSync(RELEASE_METADATA_PATH, 'utf8'))
  if (metadata.isDraft) {
    throw new Error(`GitHub release ${RELEASE_TAG} is still a draft and will not be mirrored`)
  }

  if (metadata.tagName !== RELEASE_TAG) {
    throw new Error(`GitHub release tag ${metadata.tagName} does not match requested tag ${RELEASE_TAG}`)
  }

  return metadata
}

function findAssets() {
  return fs.readdirSync(DIST_DIR, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(DIST_DIR, entry.name))
    .sort((left, right) => left.localeCompare(right))
}

function getExistingAssetNames(release) {
  if (!Array.isArray(release.assets)) {
    return new Set()
  }

  return new Set(release.assets
    .map(asset => asset && asset.name)
    .filter(name => typeof name === 'string'))
}

async function publishRelease() {
  requireEnvironmentVariable('ATOM_PAT', ATOM_PAT)
  requireEnvironmentVariable('ATOM_OWNER', ATOM_OWNER)
  requireEnvironmentVariable('ATOM_REPO', ATOM_REPO)
  requireEnvironmentVariable('RELEASE_TAG', RELEASE_TAG)
  if (!Number.isInteger(UPLOAD_TIMEOUT_MINUTES) || UPLOAD_TIMEOUT_MINUTES < 1 || UPLOAD_TIMEOUT_MINUTES > 120) {
    throw new Error('ATOM_UPLOAD_TIMEOUT_MINUTES must be an integer between 1 and 120')
  }

  const metadata = readReleaseMetadata()
  const assetPaths = findAssets()
  if (assetPaths.length === 0) {
    throw new Error(`No GitHub release assets found in ${DIST_DIR}`)
  }

  console.log(`[AtomGit] Mirroring ${assetPaths.length} assets to ${ATOM_OWNER}/${ATOM_REPO}@${RELEASE_TAG}`)
  await verifyCredentials()
  const release = await getOrCreateRelease(metadata)
  const existingAssetNames = getExistingAssetNames(release)

  for (const assetPath of assetPaths) {
    const fileName = path.basename(assetPath)
    if (existingAssetNames.has(fileName)) {
      console.log(`[AtomGit] Skipping existing asset ${fileName}`)
      continue
    }

    await uploadAsset(assetPath)
  }

  console.log(`[AtomGit] Release ${RELEASE_TAG} mirror completed`)
}

publishRelease().catch(error => {
  console.error('[AtomGit] Publish failed:', error)
  process.exitCode = 1
})
