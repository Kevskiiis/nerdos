import { useCallback, useState } from "react"

/**
 * `useState` that persists to localStorage. Stored values are validated with `isValid`
 * so stale or tampered data safely falls back to `fallback`.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T
): readonly [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw)
        if (isValid(parsed)) return parsed
      }
    } catch {
      // Unavailable storage or invalid JSON: use the fallback.
    }
    return fallback
  })

  const update = useCallback(
    (value: T) => {
      setState(value)
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Persistence is best-effort; the in-memory state still applies.
      }
    },
    [key]
  )

  return [state, update] as const
}
