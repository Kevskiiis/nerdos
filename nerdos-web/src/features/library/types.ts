/** Domain models for the Library feature. Shapes mirror what a cloud API would return. */

/** Plate rich-text JSON. Kept structural so the storage layer doesn't depend on the editor library. */
export interface PlateText {
  text: string
  [mark: string]: unknown
}
export interface PlateElement {
  type: string
  children: PlateDescendant[]
  [attribute: string]: unknown
}
export type PlateDescendant = PlateElement | PlateText
export type PlateValue = PlateElement[]

export interface Folder {
  id: string
  name: string
  /** `null` for folders at the top level of the Library. */
  parentId: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: string
  /** `null` for unfiled quick items. */
  folderId: string | null
  title: string
  excerpt: string
  content: PlateValue
  createdAt: string
  updatedAt: string
}

/** Lightweight page shape used by lists; omits the heavy document body. */
export type PageSummary = Omit<Page, "content">

export type CardState = "new" | "learning" | "review" | "relearning"

/** Serializable FSRS memory state. Only the scheduling wrapper interprets these numbers. */
export interface CardSchedule {
  /** ISO timestamp of the next review. */
  due: string
  stability: number
  difficulty: number
  /** Days between the previous review and the latest one. */
  elapsedDays: number
  scheduledDays: number
  /** Position inside the (re)learning steps; required to resume FSRS scheduling. */
  learningSteps: number
  reps: number
  lapses: number
  state: CardState
  lastReview?: string
}

export interface Notecard {
  id: string
  setId: string
  front: string
  back: string
  /** Future seam: the note this card was extracted from. */
  sourceNoteId?: string
  schedule: CardSchedule
  createdAt: string
  updatedAt: string
}

export type ReviewRating = "again" | "hard" | "good" | "easy"

/** Append-only record of one graded review, kept for analytics and future optimizer training. */
export interface ReviewLog {
  id: string
  cardId: string
  setId: string
  rating: ReviewRating
  stateBefore: CardState
  reviewedAt: string
  scheduledDays: number
  elapsedDays: number
}

/** One local-calendar day's reviewed-card count. Persisted with the Library, not in a separate store. */
export interface StudyActivityDay {
  /** Local date formatted as `YYYY-MM-DD`. */
  date: string
  reviewed: number
}

/** A set as persisted; the counts are derived from its cards on every read. */
export interface StoredCardSet {
  id: string
  folderId: string | null
  title: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface NotecardSet extends StoredCardSet {
  cardCount: number
  /** Cards whose `schedule.due` is at or before the time of the read. */
  dueCount: number
}

export interface LibraryStoreData {
  folders: Folder[]
  pages: Page[]
  cardSets: StoredCardSet[]
  cards: Notecard[]
  reviewLogs: ReviewLog[]
  studyActivity: StudyActivityDay[]
}

export interface CreateFolderInput {
  name: string
  parentId: string | null
}

export interface UpdateFolderInput {
  name?: string
  parentId?: string | null
  isPinned?: boolean
}

export interface CreatePageInput {
  folderId: string | null
  title?: string
}

export interface UpdatePageInput {
  title?: string
  folderId?: string | null
  content?: PlateValue
}

export interface CreateCardSetInput {
  folderId: string | null
  title?: string
  description?: string
}

export interface UpdateCardSetInput {
  title?: string
  description?: string
  folderId?: string | null
}

export interface CreateCardInput {
  setId: string
  front: string
  back: string
  sourceNoteId?: string
}

export interface UpdateCardInput {
  front?: string
  back?: string
}

export interface ReviewCardInput {
  rating: ReviewRating
  /** ISO timestamp supplied by the client so retries and local previews compute identical schedules. */
  reviewedAt: string
}

/** Discriminated union used wherever pages and card sets are listed together. */
export type LibraryItem =
  | { kind: "page"; item: PageSummary }
  | { kind: "cardSet"; item: NotecardSet }
