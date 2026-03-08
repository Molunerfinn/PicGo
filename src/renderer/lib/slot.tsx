import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value)
    return
  }

  if (ref && typeof ref === "object") {
    ;(ref as React.MutableRefObject<T | null>).current = value
  }
}

function composeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      assignRef(ref, value)
    })
  }
}

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...props },
  forwardedRef
) {
  if (!children) {
    return null
  }

  const child = React.Children.only(children)

  if (!React.isValidElement(child)) {
    return null
  }

  const childElement = child as React.ReactElement<
    React.ComponentPropsWithRef<"div">
  >
  const mergedProps = mergeProps(
    props as React.ComponentPropsWithRef<"div">,
    childElement.props
  ) as React.ComponentPropsWithRef<"div">
  const childRef = (
    childElement as React.ReactElement & { ref?: React.Ref<HTMLElement> }
  ).ref

  const clonedProps = {
    ...mergedProps,
    ref: composeRefs(childRef, forwardedRef),
  } satisfies React.ComponentPropsWithRef<"div">

  return React.cloneElement(childElement, clonedProps)
})
