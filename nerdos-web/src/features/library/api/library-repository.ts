import type {
  CreateCardInput,
  CreateCardSetInput,
  CreateFolderInput,
  CreatePageInput,
  Folder,
  Notecard,
  NotecardSet,
  Page,
  PageSummary,
  ReviewCardInput,
  ReviewLog,
  StudyActivityDay,
  UpdateCardInput,
  UpdateCardSetInput,
  UpdateFolderInput,
  UpdatePageInput,
} from "../types"

export type LibraryErrorCode = "not-found" | "invalid-move" | "validation" | "storage"

export class LibraryRepositoryError extends Error {
  readonly code: LibraryErrorCode

  constructor(code: LibraryErrorCode, message: string) {
    super(message)
    this.name = "LibraryRepositoryError"
    this.code = code
  }
}

export interface ReviewResult {
  card: Notecard
  log: ReviewLog
}

/**
 * Persistence contract for the Library. The UI only depends on this interface, so the
 * localStorage implementation can be replaced by an HTTP client without touching
 * hooks or components.
 */
export interface LibraryRepository {
  listFolders(): Promise<Folder[]>
  createFolder(input: CreateFolderInput): Promise<Folder>
  updateFolder(id: string, patch: UpdateFolderInput): Promise<Folder>
  /** Deletes the folder together with every subfolder, page, card set and card inside it. */
  deleteFolder(id: string): Promise<void>

  listPages(): Promise<PageSummary[]>
  /** Resolves to `null` when the page does not exist. */
  getPage(id: string): Promise<Page | null>
  createPage(input: CreatePageInput): Promise<Page>
  updatePage(id: string, patch: UpdatePageInput): Promise<Page>
  duplicatePage(id: string): Promise<Page>
  deletePage(id: string): Promise<void>

  /** Card sets always carry `cardCount` and `dueCount` computed from their cards at read time. */
  listCardSets(): Promise<NotecardSet[]>
  /** Resolves to `null` when the set does not exist. */
  getCardSet(id: string): Promise<NotecardSet | null>
  createCardSet(input: CreateCardSetInput): Promise<NotecardSet>
  updateCardSet(id: string, patch: UpdateCardSetInput): Promise<NotecardSet>
  /** Deletes the set together with its cards and review history. */
  deleteCardSet(id: string): Promise<void>
  /** Turns every card back into a new card and clears the set's review history. */
  resetCardSetProgress(id: string): Promise<void>

  listCards(setId: string): Promise<Notecard[]>
  /** Dashboard-wide card queue; no UI aggregation of separate per-set requests. */
  listAllCards(): Promise<Notecard[]>
  createCard(input: CreateCardInput): Promise<Notecard>
  updateCard(id: string, patch: UpdateCardInput): Promise<Notecard>
  deleteCard(id: string): Promise<void>
  /** Grades a card, advances FSRS scheduling and increments the same local day's activity count. */
  reviewCard(id: string, input: ReviewCardInput): Promise<ReviewResult>
  listStudyActivity(): Promise<StudyActivityDay[]>
}
