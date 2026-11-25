import type {
  CreateCardInput,
  CreateCardSetInput,
  CreateFolderInput,
  CreatePageInput,
  Folder,
  LibraryStoreData,
  Notecard,
  NotecardSet,
  Page,
  PageSummary,
  ReviewCardInput,
  ReviewLog,
  StoredCardSet,
  StudyActivityDay,
  UpdateCardInput,
  UpdateCardSetInput,
  UpdateFolderInput,
  UpdatePageInput,
} from "../types"
import { getDescendantIds } from "../lib/folder-tree"
import { deriveExcerpt, plainTextToPlate, plateToPlainText } from "../lib/plate"
import { createInitialSchedule, isDue, scheduleReview } from "../lib/scheduler"
import { LibraryRepositoryError, type LibraryRepository, type ReviewResult } from "./library-repository"
import { createSeedData } from "./seed"

const STORAGE_KEY = "nerdos:library:v2"
const MAX_NAME_LENGTH = 120
const MAX_CARD_SIDE_LENGTH = 2000

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function isStoreData(value: unknown): value is Omit<LibraryStoreData, "studyActivity"> & { studyActivity?: unknown } {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    Array.isArray(candidate.folders) &&
    Array.isArray(candidate.pages) &&
    Array.isArray(candidate.cardSets) &&
    Array.isArray(candidate.cards) &&
    Array.isArray(candidate.reviewLogs)
  )
}

function normalizeStoreData(value: Omit<LibraryStoreData, "studyActivity"> & { studyActivity?: unknown }): LibraryStoreData {
  const studyActivity = Array.isArray(value.studyActivity)
    ? value.studyActivity.filter(
        (day): day is StudyActivityDay =>
          typeof day === "object" &&
          day !== null &&
          typeof (day as Record<string, unknown>).date === "string" &&
          typeof (day as Record<string, unknown>).reviewed === "number"
      )
    : []
  return { ...value, studyActivity }
}

function toSummary(page: Page): PageSummary {
  return {
    id: page.id,
    folderId: page.folderId,
    title: page.title,
    excerpt: page.excerpt,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  }
}

function normalizeName(raw: string): string {
  const name = raw.trim()
  if (!name) throw new LibraryRepositoryError("validation", "Name cannot be empty.")
  if (name.length > MAX_NAME_LENGTH) {
    throw new LibraryRepositoryError("validation", `Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
  }
  return name
}

function normalizeCardSide(raw: string, label: string): string {
  const text = raw.trim()
  if (!text) throw new LibraryRepositoryError("validation", `${label} cannot be empty.`)
  if (text.length > MAX_CARD_SIDE_LENGTH) {
    throw new LibraryRepositoryError("validation", `${label} must be ${MAX_CARD_SIDE_LENGTH} characters or fewer.`)
  }
  return text
}

/**
 * localStorage-backed repository. Every method is async and simulates network latency so the
 * UI already exercises its loading/optimistic paths exactly as it would against a cloud API.
 */
export class LocalLibraryRepository implements LibraryRepository {
  private readonly storage: Storage
  private readonly latencyMs: number

  constructor(storage: Storage = window.localStorage, latencyMs = 120) {
    this.storage = storage
    this.latencyMs = latencyMs
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, this.latencyMs))
  }

  private read(): LibraryStoreData {
    try {
      const raw = this.storage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isStoreData(parsed)) return normalizeStoreData(parsed)
      }
    } catch {
      // Corrupt or unreadable data falls through to a fresh seed.
    }
    const seed = createSeedData()
    this.write(seed)
    return seed
  }

  private write(data: LibraryStoreData): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      throw new LibraryRepositoryError("storage", "Could not save changes to local storage.")
    }
  }

  private requireFolder(data: LibraryStoreData, id: string): Folder {
    const folder = data.folders.find((candidate) => candidate.id === id)
    if (!folder) throw new LibraryRepositoryError("not-found", "Folder not found.")
    return folder
  }

  private requirePage(data: LibraryStoreData, id: string): Page {
    const page = data.pages.find((candidate) => candidate.id === id)
    if (!page) throw new LibraryRepositoryError("not-found", "Page not found.")
    return page
  }

  private requireCardSet(data: LibraryStoreData, id: string): StoredCardSet {
    const cardSet = data.cardSets.find((candidate) => candidate.id === id)
    if (!cardSet) throw new LibraryRepositoryError("not-found", "Card set not found.")
    return cardSet
  }

  private requireCard(data: LibraryStoreData, id: string): Notecard {
    const card = data.cards.find((candidate) => candidate.id === id)
    if (!card) throw new LibraryRepositoryError("not-found", "Card not found.")
    return card
  }

  private assertFolderExists(data: LibraryStoreData, id: string | null): void {
    if (id !== null) this.requireFolder(data, id)
  }

  /** Counts are derived at read time, so they can never drift from the cards themselves. */
  private withCounts(data: LibraryStoreData, set: StoredCardSet, now: Date): NotecardSet {
    const cards = data.cards.filter((card) => card.setId === set.id)
    return { ...set, cardCount: cards.length, dueCount: cards.filter((card) => isDue(card.schedule, now)).length }
  }

  /** Removes card sets and everything that depends on them. */
  private withoutCardSets(data: LibraryStoreData, doomedSetIds: ReadonlySet<string>): LibraryStoreData {
    const doomedCardIds = new Set(data.cards.filter((card) => doomedSetIds.has(card.setId)).map((card) => card.id))
    return {
      ...data,
      cardSets: data.cardSets.filter((set) => !doomedSetIds.has(set.id)),
      cards: data.cards.filter((card) => !doomedCardIds.has(card.id)),
      reviewLogs: data.reviewLogs.filter((log) => !doomedCardIds.has(log.cardId)),
    }
  }

  async listFolders(): Promise<Folder[]> {
    await this.delay()
    return this.read().folders
  }

  async createFolder(input: CreateFolderInput): Promise<Folder> {
    await this.delay()
    const data = this.read()
    this.assertFolderExists(data, input.parentId)

    const now = new Date().toISOString()
    const folder: Folder = {
      id: crypto.randomUUID(),
      name: normalizeName(input.name),
      parentId: input.parentId,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    }
    this.write({ ...data, folders: [...data.folders, folder] })
    return folder
  }

  async updateFolder(id: string, patch: UpdateFolderInput): Promise<Folder> {
    await this.delay()
    const data = this.read()
    const current = this.requireFolder(data, id)

    if (patch.parentId !== undefined) {
      this.assertFolderExists(data, patch.parentId)
      const wouldNest =
        patch.parentId === id || (patch.parentId !== null && getDescendantIds(id, data.folders).has(patch.parentId))
      if (wouldNest) {
        throw new LibraryRepositoryError("invalid-move", "A folder cannot be moved into itself or its subfolders.")
      }
    }

    const updated: Folder = {
      ...current,
      name: patch.name !== undefined ? normalizeName(patch.name) : current.name,
      parentId: patch.parentId !== undefined ? patch.parentId : current.parentId,
      isPinned: patch.isPinned ?? current.isPinned,
      updatedAt: new Date().toISOString(),
    }
    this.write({ ...data, folders: data.folders.map((folder) => (folder.id === id ? updated : folder)) })
    return updated
  }

  async deleteFolder(id: string): Promise<void> {
    await this.delay()
    const data = this.read()
    this.requireFolder(data, id)

    const doomedFolders = getDescendantIds(id, data.folders)
    doomedFolders.add(id)
    const doomedSets = new Set(
      data.cardSets.filter((set) => set.folderId !== null && doomedFolders.has(set.folderId)).map((set) => set.id)
    )
    const remaining = this.withoutCardSets(data, doomedSets)
    this.write({
      ...remaining,
      folders: data.folders.filter((folder) => !doomedFolders.has(folder.id)),
      pages: data.pages.filter((page) => page.folderId === null || !doomedFolders.has(page.folderId)),
    })
  }

  async listPages(): Promise<PageSummary[]> {
    await this.delay()
    return this.read().pages.map(toSummary)
  }

  async getPage(id: string): Promise<Page | null> {
    await this.delay()
    return this.read().pages.find((page) => page.id === id) ?? null
  }

  async createPage(input: CreatePageInput): Promise<Page> {
    await this.delay()
    const data = this.read()
    this.assertFolderExists(data, input.folderId)

    const now = new Date().toISOString()
    const page: Page = {
      id: crypto.randomUUID(),
      folderId: input.folderId,
      title: input.title?.trim() ?? "",
      excerpt: "",
      content: plainTextToPlate(""),
      createdAt: now,
      updatedAt: now,
    }
    this.write({ ...data, pages: [...data.pages, page] })
    return page
  }

  async updatePage(id: string, patch: UpdatePageInput): Promise<Page> {
    await this.delay()
    const data = this.read()
    const current = this.requirePage(data, id)
    if (patch.folderId !== undefined) this.assertFolderExists(data, patch.folderId)

    const updated: Page = {
      ...current,
      title: patch.title ?? current.title,
      folderId: patch.folderId !== undefined ? patch.folderId : current.folderId,
      content: patch.content ?? current.content,
      // A backend derives the excerpt from the document body, so the client never sends it.
      excerpt: patch.content ? deriveExcerpt(plateToPlainText(patch.content)) : current.excerpt,
      updatedAt: new Date().toISOString(),
    }
    this.write({ ...data, pages: data.pages.map((page) => (page.id === id ? updated : page)) })
    return updated
  }

  async duplicatePage(id: string): Promise<Page> {
    await this.delay()
    const data = this.read()
    const source = this.requirePage(data, id)

    const now = new Date().toISOString()
    const copy: Page = {
      ...source,
      id: crypto.randomUUID(),
      title: source.title.trim() ? `${source.title} (copy)` : "Untitled (copy)",
      createdAt: now,
      updatedAt: now,
    }
    this.write({ ...data, pages: [...data.pages, copy] })
    return copy
  }

  async deletePage(id: string): Promise<void> {
    await this.delay()
    const data = this.read()
    this.requirePage(data, id)
    this.write({ ...data, pages: data.pages.filter((page) => page.id !== id) })
  }

  async listCardSets(): Promise<NotecardSet[]> {
    await this.delay()
    const data = this.read()
    const now = new Date()
    return data.cardSets.map((set) => this.withCounts(data, set, now))
  }

  async getCardSet(id: string): Promise<NotecardSet | null> {
    await this.delay()
    const data = this.read()
    const set = data.cardSets.find((candidate) => candidate.id === id)
    return set ? this.withCounts(data, set, new Date()) : null
  }

  async createCardSet(input: CreateCardSetInput): Promise<NotecardSet> {
    await this.delay()
    const data = this.read()
    this.assertFolderExists(data, input.folderId)

    const now = new Date().toISOString()
    const set: StoredCardSet = {
      id: crypto.randomUUID(),
      folderId: input.folderId,
      title: input.title?.trim() ?? "",
      description: input.description?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    }
    const next = { ...data, cardSets: [...data.cardSets, set] }
    this.write(next)
    return this.withCounts(next, set, new Date())
  }

  async updateCardSet(id: string, patch: UpdateCardSetInput): Promise<NotecardSet> {
    await this.delay()
    const data = this.read()
    const current = this.requireCardSet(data, id)
    if (patch.folderId !== undefined) this.assertFolderExists(data, patch.folderId)

    const updated: StoredCardSet = {
      ...current,
      title: patch.title !== undefined ? normalizeName(patch.title) : current.title,
      description: patch.description ?? current.description,
      folderId: patch.folderId !== undefined ? patch.folderId : current.folderId,
      updatedAt: new Date().toISOString(),
    }
    const next = { ...data, cardSets: data.cardSets.map((set) => (set.id === id ? updated : set)) }
    this.write(next)
    return this.withCounts(next, updated, new Date())
  }

  async deleteCardSet(id: string): Promise<void> {
    await this.delay()
    const data = this.read()
    this.requireCardSet(data, id)
    this.write(this.withoutCardSets(data, new Set([id])))
  }

  async resetCardSetProgress(id: string): Promise<void> {
    await this.delay()
    const data = this.read()
    this.requireCardSet(data, id)

    const now = new Date()
    const setCardIds = new Set(data.cards.filter((card) => card.setId === id).map((card) => card.id))
    this.write({
      ...data,
      cards: data.cards.map((card) =>
        card.setId === id ? { ...card, schedule: createInitialSchedule(now), updatedAt: now.toISOString() } : card
      ),
      reviewLogs: data.reviewLogs.filter((log) => !setCardIds.has(log.cardId)),
    })
  }

  async listCards(setId: string): Promise<Notecard[]> {
    await this.delay()
    const data = this.read()
    this.requireCardSet(data, setId)
    return data.cards.filter((card) => card.setId === setId)
  }

  async listAllCards(): Promise<Notecard[]> {
    await this.delay()
    return this.read().cards
  }

  async listStudyActivity(): Promise<StudyActivityDay[]> {
    await this.delay()
    return this.read().studyActivity
  }

  async createCard(input: CreateCardInput): Promise<Notecard> {
    await this.delay()
    const data = this.read()
    this.requireCardSet(data, input.setId)

    const now = new Date()
    const card: Notecard = {
      id: crypto.randomUUID(),
      setId: input.setId,
      front: normalizeCardSide(input.front, "Front"),
      back: normalizeCardSide(input.back, "Back"),
      sourceNoteId: input.sourceNoteId,
      schedule: createInitialSchedule(now),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    this.write({ ...data, cards: [...data.cards, card] })
    return card
  }

  async updateCard(id: string, patch: UpdateCardInput): Promise<Notecard> {
    await this.delay()
    const data = this.read()
    const current = this.requireCard(data, id)

    const updated: Notecard = {
      ...current,
      front: patch.front !== undefined ? normalizeCardSide(patch.front, "Front") : current.front,
      back: patch.back !== undefined ? normalizeCardSide(patch.back, "Back") : current.back,
      updatedAt: new Date().toISOString(),
    }
    this.write({ ...data, cards: data.cards.map((card) => (card.id === id ? updated : card)) })
    return updated
  }

  async deleteCard(id: string): Promise<void> {
    await this.delay()
    const data = this.read()
    this.requireCard(data, id)
    this.write({
      ...data,
      cards: data.cards.filter((card) => card.id !== id),
      reviewLogs: data.reviewLogs.filter((log) => log.cardId !== id),
    })
  }

  async reviewCard(id: string, input: ReviewCardInput): Promise<ReviewResult> {
    await this.delay()
    const data = this.read()
    const current = this.requireCard(data, id)

    const reviewedAt = new Date(input.reviewedAt)
    if (Number.isNaN(reviewedAt.getTime())) {
      throw new LibraryRepositoryError("validation", "Review time is not a valid date.")
    }

    const outcome = scheduleReview(current.schedule, input.rating, reviewedAt)
    const card: Notecard = { ...current, schedule: outcome.schedule, updatedAt: reviewedAt.toISOString() }
    const log: ReviewLog = {
      id: crypto.randomUUID(),
      cardId: id,
      setId: current.setId,
      rating: input.rating,
      stateBefore: outcome.stateBefore,
      reviewedAt: reviewedAt.toISOString(),
      scheduledDays: outcome.schedule.scheduledDays,
      elapsedDays: outcome.elapsedDays,
    }
    const date = localDateKey(reviewedAt)
    const existingDay = data.studyActivity.find((day) => day.date === date)
    const studyActivity = existingDay
      ? data.studyActivity.map((day) => (day.date === date ? { ...day, reviewed: day.reviewed + 1 } : day))
      : [...data.studyActivity, { date, reviewed: 1 }]

    this.write({
      ...data,
      cards: data.cards.map((candidate) => (candidate.id === id ? card : candidate)),
      reviewLogs: [...data.reviewLogs, log],
      studyActivity,
    })
    return { card, log }
  }
}
