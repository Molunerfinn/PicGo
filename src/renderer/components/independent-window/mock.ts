interface TrayBaseItem {
  id: string
  fileName: string
  imgUrl: string
}

export type TrayWaitingItem = TrayBaseItem

export interface TrayUploadedItem extends TrayBaseItem {
  link: string
}

export interface TrayPageState {
  waiting: TrayWaitingItem[]
  uploaded: TrayUploadedItem[]
}

export interface RenameDraftState {
  id: string
  fileName: string
  originalName: string
}

export interface RenameResult {
  id: string
  fileName: string
}

export const toolboxItemType = {
  IsConfigFileBroken: "IS_CONFIG_FILE_BROKEN",
  IsGalleryFileBroken: "IS_GALLERY_FILE_BROKEN",
  HasProblemWithClipboardPicUpload: "HAS_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD",
  HasProblemWithProxy: "HAS_PROBLEM_WITH_PROXY",
} as const

export type ToolboxItemType =
  (typeof toolboxItemType)[keyof typeof toolboxItemType]

export const toolboxItemCheckStatus = {
  Init: "INIT",
  Loading: "LOADING",
  Success: "SUCCESS",
  Error: "ERROR",
} as const

export type ToolboxItemCheckStatus =
  (typeof toolboxItemCheckStatus)[keyof typeof toolboxItemCheckStatus]

type ToolboxTitleKey =
  | "TOOLBOX_CHECK_CONFIG_FILE_BROKEN"
  | "TOOLBOX_CHECK_GALLERY_FILE_BROKEN"
  | "TOOLBOX_CHECK_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD"
  | "TOOLBOX_CHECK_PROBLEM_WITH_PROXY"

type ToolboxHandlerTextKey = "SETTINGS_OPEN_CONFIG_FILE" | "OPEN_FILE_PATH"

type ToolboxMessageKey =
  | ""
  | "TOOLBOX_CHECK_CONFIG_FILE_PATH_TIPS"
  | "TOOLBOX_CHECK_CONFIG_FILE_BROKEN_TIPS"
  | "TOOLBOX_CHECK_GALLERY_FILE_PATH_TIPS"
  | "TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_TIPS"
  | "TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_NOT_EXIST_TIPS"
  | "TOOLBOX_CHECK_PROXY_SUCCESS_TIPS"

interface ToolboxItemTemplate {
  type: ToolboxItemType
  titleKey: ToolboxTitleKey
  hasNoFixMethod?: boolean
  handlerTextKey?: ToolboxHandlerTextKey
}

export interface ToolboxItemState extends ToolboxItemTemplate {
  status: ToolboxItemCheckStatus
  messageKey: ToolboxMessageKey
  messageVariables?: Record<string, string>
  value: string
}

export interface ToolboxCheckResult {
  type: ToolboxItemType
  status: ToolboxItemCheckStatus
  messageKey: ToolboxMessageKey
  messageVariables?: Record<string, string>
  value: string
}

interface MiniUploadOptions {
  files: File[]
  onProgress: (progress: number) => void
}

interface MiniUploadResult {
  uploadedCount: number
}

const trayWaitingTemplate: TrayWaitingItem[] = [
  {
    id: "tray-waiting-1",
    fileName:
      "clipboard-capture-from-very-long-context-menu-selection-for-dark-mode-visual-check.png",
    imgUrl: "https://picsum.photos/seed/picgo-tray-waiting/160/100",
  },
]

const trayUploadedTemplate: TrayUploadedItem[] = [
  {
    id: "tray-uploaded-1",
    fileName: "project-cover.png",
    imgUrl: "https://picsum.photos/seed/picgo-tray-uploaded-1/160/100",
    link: "https://example.com/project-cover.png",
  },
  {
    id: "tray-uploaded-2",
    fileName: "demo-hero.jpg",
    imgUrl: "https://picsum.photos/seed/picgo-tray-uploaded-2/160/100",
    link: "https://example.com/demo-hero.jpg",
  },
  {
    id: "tray-uploaded-3",
    fileName: "release-note.webp",
    imgUrl: "https://picsum.photos/seed/picgo-tray-uploaded-3/160/100",
    link: "https://example.com/release-note.webp",
  },
  {
    id: "tray-uploaded-4",
    fileName:
      "20260227175103382_super_long_file_name_to_verify_two_line_ellipsis_behavior_in_tray_page.png",
    imgUrl: "https://picsum.photos/seed/picgo-tray-uploaded-4/160/100",
    link: "https://example.com/20260227175103382_super_long_file_name_to_verify_two_line_ellipsis_behavior_in_tray_page.png",
  },
  {
    id: "tray-uploaded-5",
    fileName:
      "final_marketing_banner_dark_mode_regression_snapshot_with_annotations_and_notes.jpeg",
    imgUrl:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900&q=80&h=1200&fit=crop&auto=format",
    link: "https://example.com/final_marketing_banner_dark_mode_regression_snapshot_with_annotations_and_notes.jpeg",
  },
]

const renameDraftTemplate: RenameDraftState = {
  id: "rename-file-1",
  fileName: "holiday-screenshot",
  originalName: "holiday-screenshot",
}

const TOOLBOX_CONFIG_PATH = "/Users/example/.picgo/data.json"
const TOOLBOX_GALLERY_PATH = "/Users/example/.picgo/data.db"
const TOOLBOX_CLIPBOARD_PATH = "/Users/example/.picgo/picgo-image-clipboard"

const toolboxItemTemplate: ToolboxItemTemplate[] = [
  {
    type: toolboxItemType.IsConfigFileBroken,
    titleKey: "TOOLBOX_CHECK_CONFIG_FILE_BROKEN",
    handlerTextKey: "SETTINGS_OPEN_CONFIG_FILE",
  },
  {
    type: toolboxItemType.IsGalleryFileBroken,
    titleKey: "TOOLBOX_CHECK_GALLERY_FILE_BROKEN",
  },
  {
    type: toolboxItemType.HasProblemWithClipboardPicUpload,
    titleKey: "TOOLBOX_CHECK_PROBLEM_WITH_CLIPBOARD_PIC_UPLOAD",
    handlerTextKey: "OPEN_FILE_PATH",
  },
  {
    type: toolboxItemType.HasProblemWithProxy,
    titleKey: "TOOLBOX_CHECK_PROBLEM_WITH_PROXY",
    hasNoFixMethod: true,
  },
]

const toolboxFixableTypes = new Set<ToolboxItemType>([
  toolboxItemType.IsConfigFileBroken,
  toolboxItemType.HasProblemWithClipboardPicUpload,
])

function cloneTrayState(state: TrayPageState): TrayPageState {
  return {
    waiting: state.waiting.map((item) => ({ ...item })),
    uploaded: state.uploaded.map((item) => ({ ...item })),
  }
}

function createDefaultTrayState(): TrayPageState {
  return {
    waiting: trayWaitingTemplate.map((item) => ({ ...item })),
    uploaded: trayUploadedTemplate.map((item) => ({ ...item })),
  }
}

function createDefaultRenameDraft(): RenameDraftState {
  return { ...renameDraftTemplate }
}

function createDefaultToolboxItems(): ToolboxItemState[] {
  return toolboxItemTemplate.map((item) => ({
    ...item,
    status: toolboxItemCheckStatus.Init,
    messageKey: "",
    messageVariables: undefined,
    value: "",
  }))
}

function cloneToolboxItemState(items: ToolboxItemState[]): ToolboxItemState[] {
  return items.map((item) => ({
    ...item,
    messageVariables: item.messageVariables ? { ...item.messageVariables } : undefined,
  }))
}

function createToolboxCheckResult(
  type: ToolboxItemType,
  fixedTypes: Set<ToolboxItemType>
): ToolboxCheckResult {
  if (type === toolboxItemType.IsConfigFileBroken) {
    if (fixedTypes.has(type)) {
      return {
        type,
        status: toolboxItemCheckStatus.Success,
        messageKey: "TOOLBOX_CHECK_CONFIG_FILE_PATH_TIPS",
        messageVariables: { path: TOOLBOX_CONFIG_PATH },
        value: TOOLBOX_CONFIG_PATH,
      }
    }

    return {
      type,
      status: toolboxItemCheckStatus.Error,
      messageKey: "TOOLBOX_CHECK_CONFIG_FILE_BROKEN_TIPS",
      value: TOOLBOX_CONFIG_PATH,
    }
  }

  if (type === toolboxItemType.IsGalleryFileBroken) {
    return {
      type,
      status: toolboxItemCheckStatus.Success,
      messageKey: "TOOLBOX_CHECK_GALLERY_FILE_PATH_TIPS",
      messageVariables: { path: TOOLBOX_GALLERY_PATH },
      value: TOOLBOX_GALLERY_PATH,
    }
  }

  if (type === toolboxItemType.HasProblemWithClipboardPicUpload) {
    if (fixedTypes.has(type)) {
      return {
        type,
        status: toolboxItemCheckStatus.Success,
        messageKey: "TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_TIPS",
        messageVariables: { path: TOOLBOX_CLIPBOARD_PATH },
        value: TOOLBOX_CLIPBOARD_PATH,
      }
    }

    return {
      type,
      status: toolboxItemCheckStatus.Error,
      messageKey: "TOOLBOX_CHECK_CLIPBOARD_FILE_PATH_NOT_EXIST_TIPS",
      messageVariables: { path: TOOLBOX_CLIPBOARD_PATH },
      value: TOOLBOX_CLIPBOARD_PATH,
    }
  }

  return {
    type,
    status: toolboxItemCheckStatus.Success,
    messageKey: "TOOLBOX_CHECK_PROXY_SUCCESS_TIPS",
    value: "",
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

let trayState = createDefaultTrayState()
let renameDraft = createDefaultRenameDraft()
let toolboxFixedTypes = new Set<ToolboxItemType>()

export const independentWindowMockApi = {
  async resetMockState() {
    trayState = createDefaultTrayState()
    renameDraft = createDefaultRenameDraft()
    toolboxFixedTypes = new Set<ToolboxItemType>()
  },

  async getTrayPageState(): Promise<TrayPageState> {
    await wait(100)
    return cloneTrayState(trayState)
  },

  async openMainWindow() {
    await wait(80)
  },

  async uploadTrayWaitingItem(itemId: string): Promise<TrayUploadedItem> {
    const waitingItem = trayState.waiting.find((item) => item.id === itemId)
    if (!waitingItem) {
      throw new Error("Waiting upload item not found.")
    }

    await wait(500)

    const uploadedItem: TrayUploadedItem = {
      id: `tray-uploaded-${Date.now()}`,
      fileName: waitingItem.fileName,
      imgUrl: waitingItem.imgUrl,
      link: `https://example.com/${waitingItem.fileName}`,
    }

    trayState = {
      waiting: trayState.waiting.filter((item) => item.id !== itemId),
      uploaded: [uploadedItem, ...trayState.uploaded].slice(0, 5),
    }

    return { ...uploadedItem }
  },

  async copyTrayUploadedLink(itemId: string): Promise<string> {
    const uploadedItem = trayState.uploaded.find((item) => item.id === itemId)
    if (!uploadedItem) {
      throw new Error("Uploaded item not found.")
    }

    await wait(60)
    return uploadedItem.link
  },

  async uploadMiniFiles({
    files,
    onProgress,
  }: MiniUploadOptions): Promise<MiniUploadResult> {
    if (files.length === 0) {
      throw new Error("No files selected.")
    }

    onProgress(0)
    const checkpoints = [15, 35, 55, 75, 90, 100]
    for (const checkpoint of checkpoints) {
      await wait(80)
      onProgress(checkpoint)
    }

    await wait(120)
    return { uploadedCount: files.length }
  },

  async getRenameDraft(): Promise<RenameDraftState> {
    await wait(100)
    return { ...renameDraft }
  },

  async confirmRename(fileName: string): Promise<RenameResult> {
    const normalized = fileName.trim()
    if (!normalized) {
      throw new Error("File name is required.")
    }

    await wait(120)
    renameDraft = {
      ...renameDraft,
      fileName: normalized,
    }

    return {
      id: renameDraft.id,
      fileName: renameDraft.fileName,
    }
  },

  async cancelRename(): Promise<RenameResult> {
    await wait(80)
    renameDraft = {
      ...renameDraft,
      fileName: renameDraft.originalName,
    }

    return {
      id: renameDraft.id,
      fileName: renameDraft.fileName,
    }
  },

  async getToolboxInitialState(): Promise<ToolboxItemState[]> {
    await wait(60)
    return cloneToolboxItemState(createDefaultToolboxItems())
  },

  async runToolboxCheck(type: ToolboxItemType): Promise<ToolboxCheckResult> {
    await wait(220)
    return createToolboxCheckResult(type, toolboxFixedTypes)
  },

  async runToolboxFix(type: ToolboxItemType): Promise<ToolboxCheckResult> {
    if (!toolboxFixableTypes.has(type)) {
      throw new Error("This toolbox item cannot be fixed automatically.")
    }

    await wait(180)
    toolboxFixedTypes.add(type)
    return createToolboxCheckResult(type, toolboxFixedTypes)
  },

  async openToolboxPath(path: string) {
    await wait(40)
    return path
  },

  async restartToolboxAfterFix() {
    await wait(80)
  },
}
