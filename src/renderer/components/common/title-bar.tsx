import { Maximize2, Minus, Square, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TitleBarProps {
  isMac?: boolean
}

export function TitleBar({ isMac = true }: TitleBarProps) {
  return (
    <div
      className={cn(
        "h-8 w-full flex items-center justify-between select-none transition-colors duration-300 shrink-0 relative z-50 text-foreground"
      )}
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Left Side (macOS Controls or Title) */}
      <div className="flex h-full items-center px-4">
        {isMac && (
          <div
            className="flex items-center gap-2 group"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <div className="flex size-3 items-center justify-center overflow-hidden rounded-full border border-[#E0443E] bg-[#FF5F57]">
              <X size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
            </div>
            <div className="flex size-3 items-center justify-center overflow-hidden rounded-full border border-[#D89E24] bg-[#FEBC2E]">
              <Minus size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
            </div>
            <div className="flex size-3 items-center justify-center overflow-hidden rounded-full border border-[#1AAB29] bg-[#28C840]">
              <Maximize2 size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
            </div>
          </div>
        )}
      </div>

      {/* Center Title (Absolute positioning to ensure true center) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium opacity-50">
        PicGo - 3.0.0
      </div>

      {/* Right Side (Windows Controls) */}
      <div className="flex h-full items-center">
        {!isMac && (
          <div
            className="flex h-full"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <button className="flex h-full w-12 items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
              <Minus size={16} />
            </button>
            <button className="flex h-full w-12 items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
              <Square size={14} />
            </button>
            <button className="flex h-full w-12 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
