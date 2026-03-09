import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type RefObject,
} from "react"

import { GalleryViewMode } from "../utils"

export type SelectionBox = {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isVisible: boolean
}

type UseGallerySelectionBoxOptions = {
  viewMode: GalleryViewMode
  scrollViewportRef: RefObject<HTMLDivElement | null>
  itemRefs: MutableRefObject<Map<number, HTMLDivElement>>
  selectedIdsRef: MutableRefObject<number[]>
  isInspectorOpenRef: MutableRefObject<boolean>
  isSelectingRef: MutableRefObject<boolean>
  setSelection: (next: number[] | ((prev: number[]) => number[])) => void
  setInspectorOpen: (open: boolean) => void
}

type UseGallerySelectionBoxResult = {
  selectionBox: SelectionBox
  handleMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void
  consumeSuppressCardClick: () => boolean
}

const emptySelectionBox: SelectionBox = {
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  isVisible: false,
}

/**
 * Handles drag-to-select for the masonry gallery.
 * - Starts selection on any non-interactive target.
 * - Suppresses card click when a drag actually happens.
 * - Keeps inspector closed during drag and opens it after mouseup if needed.
 */
export function useGallerySelectionBox({
  viewMode,
  scrollViewportRef,
  itemRefs,
  selectedIdsRef,
  isInspectorOpenRef,
  isSelectingRef,
  setSelection,
  setInspectorOpen,
}: UseGallerySelectionBoxOptions): UseGallerySelectionBoxResult {
  const [selectionBox, setSelectionBox] = useState<SelectionBox>(emptySelectionBox)
  const [isSelecting, setIsSelecting] = useState(false)
  const setSelectionRef = useRef(setSelection)
  const setInspectorOpenRef = useRef(setInspectorOpen)
  const selectionRef = useRef<SelectionBox>(emptySelectionBox)
  const selectionFrameRef = useRef<number | null>(null)
  const initialSelectionRef = useRef<number[]>([])
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const clearOnDragRef = useRef(false)
  const pendingClearRef = useRef(false)
  const suppressCardClickRef = useRef(false)

  useEffect(() => {
    setSelectionRef.current = setSelection
    setInspectorOpenRef.current = setInspectorOpen
  }, [setInspectorOpen, setSelection])

  const consumeSuppressCardClick = () => {
    if (!suppressCardClickRef.current) return false
    suppressCardClickRef.current = false
    return true
  }

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (viewMode !== GalleryViewMode.Masonry) return
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest("[data-gallery-interactive='true']")) return
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const rect = viewport.getBoundingClientRect()
    const startX = event.clientX - rect.left + viewport.scrollLeft
    const startY = event.clientY - rect.top + viewport.scrollTop

    pointerStartRef.current = { x: startX, y: startY }
    isSelectingRef.current = true
    pendingClearRef.current =
      !isInspectorOpenRef.current && selectedIdsRef.current.length > 0
    selectionRef.current = {
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      isVisible: false,
    }
    setSelectionBox({ ...selectionRef.current })
    clearOnDragRef.current = !event.shiftKey
    initialSelectionRef.current = event.shiftKey
      ? selectedIdsRef.current
      : []
    setIsSelecting(true)
  }

  useEffect(() => {
    if (!isSelecting) return

    const viewport = scrollViewportRef.current
    if (!viewport) return

    const updateSelectionBox = () => {
      if (selectionFrameRef.current !== null) return
      selectionFrameRef.current = window.requestAnimationFrame(() => {
        selectionFrameRef.current = null
        setSelectionBox({ ...selectionRef.current })
      })
    }

    const handleMouseMove = (event: MouseEvent) => {
      const start = pointerStartRef.current
      if (!start) return

      const rect = viewport.getBoundingClientRect()
      const currentX = event.clientX - rect.left + viewport.scrollLeft
      const currentY = event.clientY - rect.top + viewport.scrollTop

      // Delay showing the selection box to avoid accidental drags.
      const delta =
        Math.abs(currentX - start.x) + Math.abs(currentY - start.y)
      if (!selectionRef.current.isVisible && delta < 4) {
        return
      }

      if (!selectionRef.current.isVisible) {
        selectionRef.current.isVisible = true
        suppressCardClickRef.current = true
        if (clearOnDragRef.current) {
          setSelectionRef.current([])
          clearOnDragRef.current = false
        }
      }

      selectionRef.current.currentX = currentX
      selectionRef.current.currentY = currentY
      updateSelectionBox()

      const boxLeft = Math.min(start.x, currentX)
      const boxRight = Math.max(start.x, currentX)
      const boxTop = Math.min(start.y, currentY)
      const boxBottom = Math.max(start.y, currentY)

      const nextSelected: number[] = []
      itemRefs.current.forEach((node, id) => {
        const itemRect = node.getBoundingClientRect()
        const itemLeft = itemRect.left - rect.left + viewport.scrollLeft
        const itemTop = itemRect.top - rect.top + viewport.scrollTop
        const itemRight = itemLeft + itemRect.width
        const itemBottom = itemTop + itemRect.height

        if (
          !(
            boxRight < itemLeft ||
            boxLeft > itemRight ||
            boxBottom < itemTop ||
            boxTop > itemBottom
          )
        ) {
          nextSelected.push(id)
        }
      })

      const merged = new Set([...initialSelectionRef.current, ...nextSelected])
      setSelectionRef.current(Array.from(merged))
    }

    const handleMouseUp = () => {
      const didDrag = selectionRef.current.isVisible
      const shouldClearOnClick = pendingClearRef.current && !didDrag
      pendingClearRef.current = false
      selectionRef.current.isVisible = false
      pointerStartRef.current = null
      isSelectingRef.current = false
      setSelectionBox({ ...selectionRef.current })
      setIsSelecting(false)
      if (suppressCardClickRef.current) {
        setTimeout(() => {
          suppressCardClickRef.current = false
        }, 0)
      }
      if (shouldClearOnClick) {
        setSelectionRef.current([])
        return
      }
      if (!isInspectorOpenRef.current && selectedIdsRef.current.length > 0) {
        setInspectorOpenRef.current(true)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      if (selectionFrameRef.current !== null) {
        window.cancelAnimationFrame(selectionFrameRef.current)
      }
    }
  }, [
    isInspectorOpenRef,
    isSelecting,
    isSelectingRef,
    itemRefs,
    scrollViewportRef,
    selectedIdsRef,
  ])

  return {
    selectionBox,
    handleMouseDown,
    consumeSuppressCardClick,
  }
}
