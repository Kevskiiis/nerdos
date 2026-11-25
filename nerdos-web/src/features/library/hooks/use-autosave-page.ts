import { useCallback, useEffect, useRef, useState } from "react"
import type { Page, PlateValue, UpdatePageInput } from "../types"
import { useUpdatePage } from "./use-library-mutations"

export type SaveStatus = "saved" | "saving" | "error"

export interface PageDraft {
  title: string
  content: PlateValue
}

const AUTOSAVE_DELAY_MS = 700

/**
 * Local draft + debounced autosave for a page. The draft lives in component state so typing
 * never waits on the network; pending edits are flushed on unmount so navigation can't lose them.
 */
export function useAutosavePage(page: Page) {
  const { mutate } = useUpdatePage()
  const [draft, setDraft] = useState<PageDraft>({ title: page.title, content: page.content })
  const [status, setStatus] = useState<SaveStatus>("saved")

  const draftRef = useRef(draft)
  const persistedRef = useRef<PageDraft>(draft)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const flush = useCallback(() => {
    clearTimeout(timerRef.current)
    const current = draftRef.current
    const previous = persistedRef.current

    const patch: UpdatePageInput = {}
    if (current.title !== previous.title) patch.title = current.title
    if (current.content !== previous.content) patch.content = current.content
    if (Object.keys(patch).length === 0) {
      setStatus("saved")
      return
    }

    persistedRef.current = current
    setStatus("saving")
    mutate(
      { id: page.id, patch },
      {
        onSuccess: () => {
          if (draftRef.current === current) setStatus("saved")
        },
        onError: () => {
          persistedRef.current = previous
          setStatus("error")
        },
      }
    )
  }, [mutate, page.id])

  const update = useCallback(
    (changes: Partial<PageDraft>) => {
      draftRef.current = { ...draftRef.current, ...changes }
      setDraft(draftRef.current)
      setStatus("saving")
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, AUTOSAVE_DELAY_MS)
    },
    [flush]
  )

  useEffect(() => flush, [flush])

  return { draft, status, update, retry: flush }
}
