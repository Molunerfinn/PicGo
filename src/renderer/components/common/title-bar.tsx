import { useEffect, useState, type CSSProperties } from 'react'
import { Copy, Maximize2, Minus, Shrink, Square, X } from 'lucide-react'
import { WINDOW_STATE_CHANGED } from '#/events/constants'
import { windowControlsAdapter } from '@/adapters/window-controls'
import { ipc } from '@/utils/bridge'
import { cn } from '@/lib/utils'

interface TitleBarProps {
  isMac?: boolean
}

export function TitleBar ({ isMac = false }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    async function syncWindowState () {
      try {
        const state = await windowControlsAdapter.getWindowState()
        setIsMaximized(state.isMaximized)
      } catch (error) {
        console.error(error)
      }
    }

    syncWindowState()

    const handleWindowStateChange = (state: { isMaximized: boolean }) => {
      setIsMaximized(state.isMaximized)
    }

    return ipc.on(WINDOW_STATE_CHANGED, handleWindowStateChange)
  }, [])

  const toggleMaximize = () => {
    setIsMaximized((value) => !value)
    windowControlsAdapter.maximizeWindow()
  }

  const maximizeIcon = isMaximized
    ? <Copy className="size-[14px]" />
    : <Square className="size-[14px]" />

  const macMaximizeIcon = isMaximized
    ? <Copy size={8} className="text-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
    : <Maximize2 size={8} className="text-black/50 opacity-0 transition-opacity group-hover:opacity-100" />

  const macWindowControls = (
    <div
      className="group flex items-center gap-2"
      style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}
    >
      <div className="flex size-3 items-center justify-center overflow-hidden rounded-full border border-[#E0443E] bg-[#FF5F57]">
        <button
          type="button"
          className="flex h-full w-full cursor-pointer items-center justify-center"
          aria-label="Close window"
          onClick={() => {
            windowControlsAdapter.closeWindow()
          }}
        >
          <X size={8} className="text-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>
      <div className="flex size-3 items-center justify-center overflow-hidden rounded-full border border-[#D89E24] bg-[#FEBC2E]">
        <button
          type="button"
          className="flex h-full w-full cursor-pointer items-center justify-center"
          aria-label="Minimize window"
          onClick={() => {
            windowControlsAdapter.minimizeWindow()
          }}
        >
          <Minus size={8} className="text-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </div>
      <div className="flex size-3 items-center justify-center overflow-hidden rounded-full border border-[#1AAB29] bg-[#28C840]">
        <button
          type="button"
          className="flex h-full w-full cursor-pointer items-center justify-center"
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
          onClick={toggleMaximize}
        >
          {macMaximizeIcon}
        </button>
      </div>
    </div>
  )

  const desktopWindowControls = (
    <div
      className="flex h-full"
      style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}
    >
      <button
        type="button"
        aria-label="Minimize window"
        className="flex h-full w-12 cursor-pointer items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        onClick={() => {
          windowControlsAdapter.minimizeWindow()
        }}
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Open mini window"
        className="flex h-full w-12 cursor-pointer items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        onClick={() => {
          windowControlsAdapter.openMiniWindow()
        }}
      >
        <Shrink className="size-4" />
      </button>
      <button
        type="button"
        aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        className="flex h-full w-12 cursor-pointer items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        onClick={toggleMaximize}
      >
        {maximizeIcon}
      </button>
      <button
        type="button"
        aria-label="Close window"
        className="flex h-full w-12 cursor-pointer items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white"
        onClick={() => {
          windowControlsAdapter.closeWindow()
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  )

  return (
    <div
      className={cn(
        'relative z-50 flex h-8 w-full shrink-0 items-center justify-between select-none text-foreground transition-colors duration-300'
      )}
      style={{ WebkitAppRegion: 'drag' } as CSSProperties}
    >
      <div className="flex h-full items-center px-4">
        {isMac ? macWindowControls : null}
      </div>

      <div className="flex h-full items-center">
        {!isMac ? desktopWindowControls : null}
      </div>
    </div>
  )
}
