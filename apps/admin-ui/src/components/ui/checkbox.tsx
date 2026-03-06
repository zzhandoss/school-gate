import * as React from "react"

import { cn } from "@/lib/utils"

type CheckboxProps = Omit<React.ComponentPropsWithoutRef<"input">, "type" | "checked"> & {
  checked?: boolean | "indeterminate"
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null)

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

    React.useEffect(() => {
      if (!innerRef.current) {
        return
      }

      innerRef.current.indeterminate = checked === "indeterminate"
    }, [checked])

    return (
      <input
        ref={innerRef}
        type="checkbox"
        checked={checked === "indeterminate" ? false : checked}
        className={cn(
          "h-4 w-4 rounded border border-input bg-background text-primary shadow-xs outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
