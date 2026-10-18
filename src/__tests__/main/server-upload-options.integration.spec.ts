import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer } from 'node:net'
import childProcess, { ChildProcess } from 'node:child_process'
import { PassThrough } from 'node:stream'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { IImgInfo, IPicGo, IPlugin, IUploaderConfigItem, PicGo } from 'picgo'

interface TestProfile extends IUploaderConfigItem {
  endpoint: string
}

interface UploadCapture {
  uploader: string
  endpoint: string
  origins: string[]
}

interface UploadResponse {
  success: boolean
  result: string[]
  items: Array<{
    imgUrl?: string
    fileName?: string
    origin?: string
    type?: string
  }>
  code?: string
  message?: string
}

type GuiServer = {
  startup: () => void
  shutdown: () => void
}

const testState = vi.hoisted(() => ({
  configPath: '',
  formImagePath: ''
}))

const mocks = vi.hoisted(() => {
  const availableWebContents = {
    send: vi.fn(),
    isDestroyed: vi.fn(() => false)
  }
  const trayWebContents = {
    send: vi.fn(),
    isDestroyed: vi.fn(() => false)
  }
  const settingWebContents = {
    send: vi.fn(),
    isDestroyed: vi.fn(() => false)
  }

  return {
    availableWebContents,
    trayWebContents,
    settingWebContents,
    albumInsertMock: vi.fn(),
    handleCopyUrlMock: vi.fn(),
    showNotificationMock: vi.fn(),
    reportUploadDataMock: vi.fn(async () => {}),
    privacyCheckMock: vi.fn(async () => true),
    getClipboardFilePathListMock: vi.fn((): string[] => []),
    clipboardReadImageMock: vi.fn(() => ({
      isEmpty: () => false,
      toPNG: () => Buffer.from('builtin clipboard image')
    })),
    ipcMainOnMock: vi.fn(),
    ipcMainOnceMock: vi.fn(),
    ipcMainRemoveListenerMock: vi.fn()
  }
})

vi.mock('apis/core/datastore/dbChecker', () => ({
  dbChecker: () => {},
  dbPathChecker: () => testState.configPath,
  getFormImageFolderPath: () => testState.formImagePath
}))

vi.mock('electron', () => ({
  BrowserWindow: class {},
  clipboard: {
    readImage: mocks.clipboardReadImageMock
  },
  ipcMain: {
    on: mocks.ipcMainOnMock,
    once: mocks.ipcMainOnceMock,
    removeListener: mocks.ipcMainRemoveListenerMock
  },
  shell: {
    openExternal: vi.fn(async () => {})
  }
}))

vi.mock('apis/app/window/windowManager', () => ({
  default: {
    getAvailableWindow: () => ({ webContents: mocks.availableWebContents }),
    get: (name: string) => {
      if (name === 'TRAY_WINDOW') return { webContents: mocks.trayWebContents }
      if (name === 'SETTING_WINDOW') return { webContents: mocks.settingWebContents }
      return undefined
    },
    has: (name: string) => name === 'SETTING_WINDOW',
    create: vi.fn(),
    deleteById: vi.fn()
  }
}))

vi.mock('~/main/apis/core/datastore', () => ({
  AlbumDB: {
    getInstance: () => ({
      insert: mocks.albumInsertMock
    })
  }
}))

vi.mock('~/main/utils/common', () => ({
  getClipboardFilePathList: mocks.getClipboardFilePathListMock,
  handleCopyUrl: mocks.handleCopyUrlMock,
  handleUrlEncodeWithSetting: (url: string) => url,
  showNotification: mocks.showNotificationMock
}))

vi.mock('~/main/utils/privacyManager', () => ({
  privacyManager: {
    check: mocks.privacyCheckMock
  }
}))

vi.mock('~/main/utils/dataReport', () => ({
  dataReportManager: {
    reportUploadData: mocks.reportUploadDataMock
  }
}))

vi.mock('~/main/i18n', () => ({
  T: (key: string) => key
}))

vi.mock('~/main/i18n/index', () => ({
  T: (key: string) => key
}))

const reservePort = async (): Promise<number> => {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') {
    server.close()
    throw new Error('Failed to reserve an integration-test port')
  }
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  })
  return address.port
}

const waitForServer = async (baseUrl: string): Promise<void> => {
  let lastError: unknown
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/heartbeat`, { method: 'POST' })
      if (response.ok) return
    } catch (error: unknown) {
      lastError = error
    }
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw lastError instanceof Error ? lastError : new Error('GUI server did not start')
}

const makeProfile = (id: string, name: string, endpoint: string): TestProfile => ({
  _id: id,
  _configName: name,
  _createdAt: 1,
  _updatedAt: 1,
  endpoint
})

const parseUploadResponse = async (response: Response): Promise<UploadResponse> => {
  return await response.json() as UploadResponse
}

describe('GUI server upload options integration', () => {
  const uploaderA = 'integration-uploader-a'
  const uploaderB = 'integration-uploader-b'
  const transformer = 'integration-transformer'
  const defaultA = makeProfile('a-default-id', 'Default A', 'a-default')
  const namedA = makeProfile('a-named-id', 'Named A', 'a-named')
  const defaultB = makeProfile('b-default-id', 'Default B', 'b-default')
  const selectedB = makeProfile('b-selected-id', 'Selected B', 'b-selected')
  const uploadCaptures: UploadCapture[] = []
  let tempPath = ''
  let jsonImagePath = ''
  let configFileBeforeUploads = ''
  let rootConfigBeforeUploads: unknown
  let baseUrl = ''
  let picgo: PicGo
  let guiServer: GuiServer

  const expectConfigUnchanged = async () => {
    expect(structuredClone(picgo.getConfig())).toEqual(rootConfigBeforeUploads)
    await expect(readFile(testState.configPath, 'utf8')).resolves.toBe(configFileBeforeUploads)
  }

  const integrationTransformer: IPlugin = {
    handle: async (ctx: IPicGo) => {
      ctx.output = await Promise.all(ctx.input.map(async (input): Promise<IImgInfo> => {
        if (typeof input !== 'string') return { ...input }
        const buffer = await readFile(input)
        return {
          buffer,
          contentType: 'image/png',
          extname: path.extname(input) || '.png',
          fileName: path.basename(input),
          filePath: input,
          origin: input,
          size: buffer.byteLength
        }
      }))
    }
  }

  const integrationUploader: IPlugin = {
    handle: (ctx: IPicGo) => {
      const uploader = ctx.getConfig<string>('picBed.uploader')
      const profile = ctx.getConfig<TestProfile>(`picBed.${uploader}`)
      uploadCaptures.push({
        uploader,
        endpoint: profile.endpoint,
        origins: ctx.output.map(item => item.origin ?? '')
      })
      ctx.output = ctx.output.map(item => ({
        ...item,
        imgUrl: `https://uploads.test/${profile.endpoint}/${item.fileName}`
      }))
    }
  }

  beforeAll(async () => {
    tempPath = await mkdtemp(path.join(tmpdir(), 'picgo-gui-server-options-'))
    testState.configPath = path.join(tempPath, 'config.json')
    testState.formImagePath = path.join(tempPath, 'picgo-form-images')
    jsonImagePath = path.join(tempPath, 'json image.png')
    await mkdir(path.join(tempPath, 'picgo-clipboard-images'), { recursive: true })
    await writeFile(testState.configPath, '{}')
    await writeFile(jsonImagePath, 'json image')

    const port = await reservePort()
    baseUrl = `http://127.0.0.1:${port}`

    picgo = (await import('@core/picgo')).default
    picgo.helper.transformer.register(transformer, integrationTransformer)
    picgo.helper.uploader.register(uploaderA, integrationUploader)
    picgo.helper.uploader.register(uploaderB, integrationUploader)
    picgo.saveConfig({
      'picBed.current': uploaderA,
      'picBed.uploader': uploaderA,
      'picBed.transformer': transformer,
      [`picBed.${uploaderA}`]: defaultA,
      [`picBed.${uploaderB}`]: defaultB,
      [`uploader.${uploaderA}`]: {
        configList: [defaultA, namedA],
        defaultId: defaultA._id
      },
      [`uploader.${uploaderB}`]: {
        configList: [defaultB, selectedB],
        defaultId: defaultB._id
      },
      'settings.server': {
        enable: true,
        host: '127.0.0.1',
        port
      },
      'settings.useBuiltinClipboard': true,
      'settings.pasteStyle': 'URL',
      'settings.customLink': '$url',
      'settings.rename': false,
      'settings.autoRename': false,
      'settings.uploadNotification': false
    })

    guiServer = (await import('../../main/server')).default
    guiServer.startup()
    await waitForServer(baseUrl)

    rootConfigBeforeUploads = structuredClone(picgo.getConfig())
    configFileBeforeUploads = await readFile(testState.configPath, 'utf8')
  })

  beforeEach(() => {
    uploadCaptures.length = 0
    mocks.albumInsertMock.mockClear()
    mocks.handleCopyUrlMock.mockClear()
    mocks.showNotificationMock.mockClear()
  })

  afterAll(async () => {
    guiServer?.shutdown()
    if (tempPath !== '') {
      await rm(tempPath, { recursive: true, force: true })
    }
  })

  it('selects a named profile for a JSON path upload and keeps raw GUI results', async () => {
    const query = new URLSearchParams({ uploader: uploaderA, configName: namedA._configName })
    const response = await fetch(`${baseUrl}/upload?${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ list: [jsonImagePath] })
    })
    const body = await parseUploadResponse(response)
    const expectedUrl = `https://uploads.test/${namedA.endpoint}/json image.png`

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.result).toEqual([expectedUrl])
    expect(body.items[0]).toMatchObject({ imgUrl: expectedUrl, type: uploaderA })
    expect(uploadCaptures).toEqual([{ uploader: uploaderA, endpoint: namedA.endpoint, origins: [jsonImagePath] }])
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: expectedUrl, type: uploaderA, _configId: namedA._id, _configName: namedA._configName }))
    await expectConfigUnchanged()
  })

  it('selects a profile by ID for a multipart upload', async () => {
    const formData = new FormData()
    formData.append('files', new Blob(['multipart image'], { type: 'image/png' }), 'multipart image.png')
    const response = await fetch(`${baseUrl}/upload?configId=${selectedB._id}`, {
      method: 'POST',
      body: formData
    })
    const body = await parseUploadResponse(response)
    const expectedUrl = `https://uploads.test/${selectedB.endpoint}/multipart image.png`

    expect(response.status).toBe(200)
    expect(body.result).toEqual([expectedUrl])
    expect(body.items[0]).toMatchObject({ imgUrl: expectedUrl, fileName: 'multipart image.png', type: uploaderB })
    expect(uploadCaptures[0]).toMatchObject({ uploader: uploaderB, endpoint: selectedB.endpoint })
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: expectedUrl, type: uploaderB, _configId: selectedB._id, _configName: selectedB._configName }))
    await expectConfigUnchanged()
  })

  it('uses configName fallback after a missing ID on the builtin clipboard path', async () => {
    const query = new URLSearchParams({
      uploader: uploaderA,
      configId: 'missing-id',
      configName: defaultA._configName
    })
    const response = await fetch(`${baseUrl}/upload?${query}`, { method: 'POST' })
    const body = await parseUploadResponse(response)

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.result[0]).toMatch(new RegExp(`^https://uploads\\.test/${defaultA.endpoint}/\\d+\\.png$`))
    expect(uploadCaptures[0]).toMatchObject({ uploader: uploaderA, endpoint: defaultA.endpoint })
    expect(mocks.clipboardReadImageMock).toHaveBeenCalled()
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: body.result[0], type: uploaderA, _configId: defaultA._id, _configName: defaultA._configName }))
    await expectConfigUnchanged()
  })

  it('attributes a different uploader without a profile selector to its own active config', async () => {
    const response = await fetch(`${baseUrl}/upload?uploader=${uploaderB}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ list: [jsonImagePath] })
    })
    const body = await parseUploadResponse(response)

    expect(response.status).toBe(200)
    expect(body.items[0]).toMatchObject({ type: uploaderB })
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ type: uploaderB, _configId: defaultB._id }))
    await expectConfigUnchanged()
  })

  // 本用例依赖 Core 3.1.0 的行为：PicGo.upload 在 input 为空时先校验一次 options、再 await
  // 读取系统剪贴板，之后才在 lifecycle.start 中真正解析 options。因此在剪贴板读取挂起期间
  // 切换活动 profile，未做固定的实现会解析到切换后的 profile——这正是本用例的判别力来源。
  // 只 mock 掉"启动系统剪贴板助手"这一层外部依赖，其余（HTTP 路由、快照、resolveUploadOptions、
  // lifecycle.start、上传器插件、相册归属）都走真实链路。
  it.each([false, true])('pins an uploader-only clipboard request across an active-profile switch (mirror differs: %s)', async (mirrorDiffers) => {
    // 手工构造 ChildProcess 并挂上 PassThrough，以便精确控制剪贴板助手何时返回路径。
    const stdout = new PassThrough()
    const clipboardProcess = new ChildProcess()
    clipboardProcess.stdout = stdout
    let reportClipboardStart: () => void = () => undefined
    const clipboardStarted = new Promise<void>(resolve => { reportClipboardStart = resolve })
    // 配置必须在安装 spy 之前写入：若 saveConfig 抛错，try/finally 尚未进入，spy 会泄漏到后续用例。
    picgo.saveConfig({
      'settings.useBuiltinClipboard': false,
      [`picBed.${uploaderB}`]: mirrorDiffers ? { ...defaultB, endpoint: 'b-mirror' } : defaultB
    })
    const spawnSpy = vi.spyOn(childProcess, 'spawn').mockImplementation(() => {
      reportClipboardStart()
      return clipboardProcess
    })
    try {
      const request = fetch(`${baseUrl}/upload?uploader=${uploaderB}`, { method: 'POST' })
      await clipboardStarted
      expect(uploadCaptures).toEqual([])
      picgo.saveConfig({
        [`picBed.${uploaderB}`]: selectedB,
        [`uploader.${uploaderB}.defaultId`]: selectedB._id
      })
      stdout.write(jsonImagePath)
      const response = await request
      const body = await parseUploadResponse(response)
      const expectedUrl = 'https://uploads.test/b-default/json image.png'

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.result).toEqual([expectedUrl])
      expect(uploadCaptures).toEqual([{ uploader: uploaderB, endpoint: 'b-default', origins: [jsonImagePath] }])
      expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({
        imgUrl: expectedUrl,
        type: uploaderB,
        _configId: 'b-default-id',
        _configName: 'Default B'
      }))
    } finally {
      stdout.end()
      spawnSpy.mockRestore()
      picgo.saveConfig({
        'settings.useBuiltinClipboard': true,
        [`picBed.${uploaderB}`]: defaultB,
        [`uploader.${uploaderB}.defaultId`]: defaultB._id
      })
    }
    await expectConfigUnchanged()
  })

  it('keeps each profile attribution isolated across concurrent requests', async () => {
    const [responseA, responseB] = await Promise.all([
      fetch(`${baseUrl}/upload?configId=${namedA._id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      }),
      fetch(`${baseUrl}/upload?configId=${selectedB._id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      })
    ])
    const [bodyA, bodyB] = await Promise.all([parseUploadResponse(responseA), parseUploadResponse(responseB)])

    expect(responseA.status).toBe(200)
    expect(responseB.status).toBe(200)
    expect(bodyA.items[0]).toMatchObject({ type: uploaderA })
    expect(bodyB.items[0]).toMatchObject({ type: uploaderB })
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: bodyA.items[0].imgUrl, _configId: namedA._id }))
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: bodyB.items[0].imgUrl, _configId: selectedB._id }))
    await expectConfigUnchanged()
  })

  it('retains the root default when no upload options are supplied', async () => {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ list: [jsonImagePath] })
    })
    const body = await parseUploadResponse(response)
    const expectedUrl = `https://uploads.test/${defaultA.endpoint}/json image.png`

    expect(response.status).toBe(200)
    expect(body.result).toEqual([expectedUrl])
    expect(uploadCaptures).toEqual([{ uploader: uploaderA, endpoint: defaultA.endpoint, origins: [jsonImagePath] }])
    expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({ imgUrl: expectedUrl, type: uploaderA }))
    await expectConfigUnchanged()
  })

  it('attributes an upload without options to picBed.uploader when it differs from picBed.current', async () => {
    picgo.saveConfig({ 'picBed.uploader': uploaderB })
    try {
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      })
      const body = await parseUploadResponse(response)
      const expectedUrl = `https://uploads.test/${defaultB.endpoint}/json image.png`

      expect(response.status).toBe(200)
      expect(body.result).toEqual([expectedUrl])
      expect(uploadCaptures).toEqual([{ uploader: uploaderB, endpoint: defaultB.endpoint, origins: [jsonImagePath] }])
      expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({
        imgUrl: expectedUrl,
        type: uploaderB,
        _configId: defaultB._id,
        _configName: defaultB._configName
      }))
    } finally {
      picgo.saveConfig({ 'picBed.uploader': uploaderA })
    }
    await expectConfigUnchanged()
  })

  it('does not persist a stale config when Core falls back from an unregistered uploader', async () => {
    const cloudUploader = picgo.helper.uploader.get('picgo-cloud')
    expect(cloudUploader).toBeDefined()
    if (!cloudUploader) return

    const cloudHandle = vi.spyOn(cloudUploader, 'handle').mockImplementation((ctx: IPicGo) => {
      ctx.output = ctx.output.map(item => ({ ...item, imgUrl: `https://uploads.test/cloud/${item.fileName}` }))
    })
    picgo.saveConfig({
      'picBed.uploader': 'missing-plugin',
      'picBed.missing-plugin': { _id: 'stale-id', _configName: 'Stale' }
    })
    try {
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      })
      const body = await parseUploadResponse(response)
      const expectedUrl = 'https://uploads.test/cloud/json image.png'

      expect(response.status).toBe(200)
      expect(body.result).toEqual([expectedUrl])
      expect(body.items[0]).toMatchObject({ imgUrl: expectedUrl, type: 'picgo-cloud' })
      expect(mocks.albumInsertMock).toHaveBeenCalledOnce()
      const stored = mocks.albumInsertMock.mock.calls[0][0] as IImgInfo
      expect(stored.type).toBe('picgo-cloud')
      expect(stored).not.toHaveProperty('_configId')
      expect(stored).not.toHaveProperty('_configName')
    } finally {
      cloudHandle.mockRestore()
      picgo.saveConfig({ 'picBed.uploader': uploaderA })
      picgo.removeConfig('picBed', 'missing-plugin')
    }
    await expectConfigUnchanged()
  })

  it('keeps the saved profile aligned with a default upload when the global profile switches during transform', async () => {
    let releaseTransform: () => void = () => undefined
    let reportTransformStart: () => void = () => undefined
    const holdTransform = new Promise<void>(resolve => { releaseTransform = resolve })
    const transformStarted = new Promise<void>(resolve => { reportTransformStart = resolve })
    const originalHandle = integrationTransformer.handle
    const transformSpy = vi.spyOn(integrationTransformer, 'handle').mockImplementation(async (ctx: IPicGo) => {
      reportTransformStart()
      await holdTransform
      await originalHandle(ctx)
    })
    try {
      const request = fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      })
      await transformStarted
      picgo.saveConfig({
        [`picBed.${uploaderA}`]: namedA,
        [`uploader.${uploaderA}.defaultId`]: namedA._id
      })
      releaseTransform()
      const response = await request
      const body = await parseUploadResponse(response)
      const expectedUrl = `https://uploads.test/${defaultA.endpoint}/json image.png`

      expect(response.status).toBe(200)
      expect(body.result).toEqual([expectedUrl])
      expect(mocks.albumInsertMock).toHaveBeenCalledWith(expect.objectContaining({
        imgUrl: expectedUrl,
        type: uploaderA,
        _configId: defaultA._id,
        _configName: defaultA._configName
      }))
    } finally {
      releaseTransform()
      transformSpy.mockRestore()
      picgo.saveConfig({
        [`picBed.${uploaderA}`]: defaultA,
        [`uploader.${uploaderA}.defaultId`]: defaultA._id
      })
    }
    await expectConfigUnchanged()
  })

  it('preserves the active mirror upload target when a saved profile with the same ID differs', async () => {
    const mirror = { ...defaultA, endpoint: 'a-mirror-new' }
    picgo.saveConfig({ [`picBed.${uploaderA}`]: mirror })
    try {
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      })
      const body = await parseUploadResponse(response)
      const expectedUrl = 'https://uploads.test/a-mirror-new/json image.png'

      expect(response.status).toBe(200)
      expect(body.result).toEqual([expectedUrl])
      expect(uploadCaptures).toEqual([{ uploader: uploaderA, endpoint: mirror.endpoint, origins: [jsonImagePath] }])
      expect(mocks.albumInsertMock).toHaveBeenCalledOnce()
      const stored = mocks.albumInsertMock.mock.calls[0][0] as IImgInfo
      expect(stored.imgUrl).toBe(expectedUrl)
      expect(stored.type).toBe(uploaderA)
      expect(stored).not.toHaveProperty('_configId')
      expect(stored).not.toHaveProperty('_configName')
    } finally {
      picgo.saveConfig({ [`picBed.${uploaderA}`]: defaultA })
    }
    await expectConfigUnchanged()
  })

  it('does not attribute a legacy mirror to the wrong profile when it changes during upload', async () => {
    let releaseTransform: () => void = () => undefined
    let reportTransformStart: () => void = () => undefined
    const holdTransform = new Promise<void>(resolve => { releaseTransform = resolve })
    const transformStarted = new Promise<void>(resolve => { reportTransformStart = resolve })
    const originalHandle = integrationTransformer.handle
    const transformSpy = vi.spyOn(integrationTransformer, 'handle').mockImplementation(async (ctx: IPicGo) => {
      reportTransformStart()
      await holdTransform
      await originalHandle(ctx)
    })
    const configFileBeforeLegacyUpload = await readFile(testState.configPath, 'utf8')
    picgo.removeConfig('uploader', uploaderA)
    try {
      const request = fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      })
      await transformStarted
      picgo.saveConfig({ [`picBed.${uploaderA}`]: namedA })
      releaseTransform()
      const response = await request
      const body = await parseUploadResponse(response)
      const expectedUrl = `https://uploads.test/${namedA.endpoint}/json image.png`

      expect(response.status).toBe(200)
      expect(body.result).toEqual([expectedUrl])
      expect(mocks.albumInsertMock).toHaveBeenCalledOnce()
      const stored = mocks.albumInsertMock.mock.calls[0][0] as IImgInfo
      expect(stored.imgUrl).toBe(expectedUrl)
      expect(stored.type).toBe(uploaderA)
      expect(stored._configId).not.toBe(defaultA._id)
    } finally {
      releaseTransform()
      transformSpy.mockRestore()
      picgo.saveConfig(rootConfigBeforeUploads as IStringKeyMap)
    }
    expect(structuredClone(picgo.getConfig())).toEqual(rootConfigBeforeUploads)
    await expect(readFile(testState.configPath, 'utf8')).resolves.toBe(configFileBeforeLegacyUpload)
  })

  it.each([
    ['switches to B and then back to A', true],
    ['switches from A to B after the uploader reads A', false]
  ])('leaves an unpinned upload unattributed when the config %s', async (_description, switchBeforeRead) => {
    const mirror = { ...defaultA, endpoint: 'a-mirror-new' }
    let releaseTransform: () => void = () => undefined
    let reportTransformStart: () => void = () => undefined
    let releaseUpload: () => void = () => undefined
    let reportUploadRead: () => void = () => undefined
    const holdTransform = new Promise<void>(resolve => { releaseTransform = resolve })
    const transformStarted = new Promise<void>(resolve => { reportTransformStart = resolve })
    const holdUpload = new Promise<void>(resolve => { releaseUpload = resolve })
    const uploadRead = new Promise<void>(resolve => { reportUploadRead = resolve })
    const originalTransform = integrationTransformer.handle
    const transformSpy = vi.spyOn(integrationTransformer, 'handle').mockImplementation(async (ctx: IPicGo) => {
      reportTransformStart()
      await holdTransform
      await originalTransform(ctx)
    })
    const originalUpload = integrationUploader.handle
    const uploaderSpy = vi.spyOn(integrationUploader, 'handle').mockImplementation(async (ctx: IPicGo) => {
      await originalUpload(ctx)
      reportUploadRead()
      await holdUpload
    })
    picgo.saveConfig({ [`picBed.${uploaderA}`]: mirror })
    try {
      const request = fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      })
      await transformStarted
      if (switchBeforeRead) picgo.saveConfig({ [`picBed.${uploaderA}`]: namedA })
      releaseTransform()
      await uploadRead
      picgo.saveConfig({ [`picBed.${uploaderA}`]: switchBeforeRead ? mirror : namedA })
      releaseUpload()
      const response = await request
      const body = await parseUploadResponse(response)
      const expectedEndpoint = switchBeforeRead ? namedA.endpoint : mirror.endpoint
      const expectedUrl = `https://uploads.test/${expectedEndpoint}/json image.png`

      expect(response.status).toBe(200)
      expect(body.result).toEqual([expectedUrl])
      expect(mocks.albumInsertMock).toHaveBeenCalledOnce()
      const stored = mocks.albumInsertMock.mock.calls[0][0] as IImgInfo
      expect(stored.imgUrl).toBe(expectedUrl)
      expect(stored.type).toBe(uploaderA)
      expect(stored).not.toHaveProperty('_configId')
      expect(stored).not.toHaveProperty('_configName')
    } finally {
      releaseTransform()
      releaseUpload()
      transformSpy.mockRestore()
      uploaderSpy.mockRestore()
      picgo.saveConfig({ [`picBed.${uploaderA}`]: defaultA })
    }
    await expectConfigUnchanged()
  })

  it('does not persist attribution copied from an input image after fallback to cloud', async () => {
    const cloudUploader = picgo.helper.uploader.get('picgo-cloud')
    expect(cloudUploader).toBeDefined()
    if (!cloudUploader) return

    const cloudHandle = vi.spyOn(cloudUploader, 'handle').mockImplementation((ctx: IPicGo) => {
      ctx.output = ctx.output.map(item => ({ ...item, imgUrl: `https://uploads.test/cloud/${item.fileName}` }))
    })
    const originalHandle = integrationTransformer.handle
    const transformerSpy = vi.spyOn(integrationTransformer, 'handle').mockImplementation(async (ctx: IPicGo) => {
      await originalHandle(ctx)
      ctx.output.forEach(item => {
        item._configId = 'stale-id'
        item._configName = 'Old upload'
      })
    })
    picgo.saveConfig({ 'picBed.uploader': 'missing-plugin' })
    try {
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ list: [jsonImagePath] })
      })
      const body = await parseUploadResponse(response)

      expect(response.status).toBe(200)
      expect(body.items[0].type).toBe('picgo-cloud')
      expect(mocks.albumInsertMock).toHaveBeenCalledOnce()
      const stored = mocks.albumInsertMock.mock.calls[0][0] as IImgInfo
      expect(stored).not.toHaveProperty('_configId')
      expect(stored).not.toHaveProperty('_configName')
    } finally {
      transformerSpy.mockRestore()
      cloudHandle.mockRestore()
      picgo.saveConfig({ 'picBed.uploader': uploaderA })
    }
    await expectConfigUnchanged()
  })

  it('rejects invalid options before invoking the GUI upload adapter', async () => {
    const response = await fetch(`${baseUrl}/upload?uploader=missing-uploader`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ list: [jsonImagePath] })
    })
    const body = await parseUploadResponse(response)

    expect(response.status).toBe(400)
    expect(body).toMatchObject({ success: false, code: 'UNKNOWN_UPLOADER', result: [], items: [] })
    expect(uploadCaptures).toEqual([])
    expect(mocks.albumInsertMock).not.toHaveBeenCalled()
    await expectConfigUnchanged()
  })
})
