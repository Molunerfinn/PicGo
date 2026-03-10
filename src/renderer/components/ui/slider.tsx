import * as React from 'react'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'

import { cn } from '@/lib/utils'

interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {}

function Slider ({
  className,
  min = 0,
  max = 100,
  step = 1,
  ...props
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      min={min}
      max={max}
      step={step}
      className={cn(
        'relative inline-flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full items-center">
        <SliderPrimitive.Track className="bg-border relative h-1 w-full overflow-hidden rounded-full">
          <SliderPrimitive.Indicator className="bg-primary absolute h-full rounded-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="border-primary/30 bg-background ring-ring/35 block size-4 rounded-full border shadow-sm outline-none transition-[box-shadow,transform] hover:scale-105 focus-visible:ring-3" />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
