import { useRef } from 'react'

import { cn } from '@/lib/utils'

type InputOTPProps = {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  className?: string
}

function normalizeDigits(value: string, length: number) {
  return value.replace(/\D/g, '').slice(0, length)
}

export function InputOTP({
  id,
  name,
  value,
  onChange,
  length = 6,
  disabled = false,
  className
}: InputOTPProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const normalized = normalizeDigits(value, length).padEnd(length, ' ')

  const setAt = (index: number, digit: string) => {
    const next = normalized.split('')
    next[index] = digit
    onChange(next.join('').trimEnd())
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input type="hidden" id={id} name={name} value={normalizeDigits(value, length)} />
      {Array.from({ length }).map((_, index) => {
        const char = normalized[index] === ' ' ? '' : normalized[index]
        return (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`Code digit ${index + 1}`}
            className="h-10 w-10 rounded-md border border-input bg-background text-center text-base shadow-xs transition-[color,background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            value={char}
            disabled={disabled}
            maxLength={1}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const digit = event.target.value.replace(/\D/g, '').slice(-1)
              setAt(index, digit)
              if (digit && index < length - 1) {
                refs.current[index + 1]?.focus()
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !char && index > 0) {
                refs.current[index - 1]?.focus()
              }
              if (event.key === 'ArrowLeft' && index > 0) {
                event.preventDefault()
                refs.current[index - 1]?.focus()
              }
              if (event.key === 'ArrowRight' && index < length - 1) {
                event.preventDefault()
                refs.current[index + 1]?.focus()
              }
            }}
            onPaste={(event) => {
              const pasted = normalizeDigits(event.clipboardData.getData('text'), length)
              if (!pasted) {
                return
              }
              event.preventDefault()
              onChange(pasted)
              const focusIndex = Math.min(pasted.length, length - 1)
              refs.current[focusIndex]?.focus()
            }}
          />
        )
      })}
    </div>
  )
}
