import { getMasteryBreakdown, type MasteryBreakdown } from "@/features/library/lib/card-status"
import { getDescendantIds, indexFolders, formatFolderPath } from "@/features/library/lib/folder-tree"
import { isDue } from "@/features/library/lib/scheduler"
import type {
  Folder,
  LibraryItem,
  Notecard,
  NotecardSet,
  PageSummary,
  StudyActivityDay,
} from "@/features/library/types"

export interface DueSetGroup {
  set: NotecardSet
  /** Short, scannable label for a set in the daily queue. */
  label: string
  dueCount: number
}

export interface PinnedCourse {
  folder: Folder
  pageCount: number
  setCount: number
}

export interface DailyActivity {
  reviewedToday: number
  streak: number
}

export interface DashboardAggregate {
  dueGroups: DueSetGroup[]
  dueCount: number
  recent: LibraryItem[]
  pinned: PinnedCourse[]
  activity: DailyActivity
  mastery: MasteryBreakdown
}

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function activityStreak(days: readonly StudyActivityDay[], now: Date): number {
  const totals = new Map(days.map((day) => [day.date, day.reviewed]))
  const cursor = new Date(now)
  cursor.setHours(12, 0, 0, 0)

  // A streak remains alive until today's day is over; start from yesterday when no study happened today.
  if ((totals.get(localDateKey(cursor)) ?? 0) === 0) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while ((totals.get(localDateKey(cursor)) ?? 0) > 0) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function recentItems(pages: readonly PageSummary[], sets: readonly NotecardSet[]): LibraryItem[] {
  const items: LibraryItem[] = [
    ...pages.map((item): LibraryItem => ({ kind: "page", item })),
    ...sets.map((item): LibraryItem => ({ kind: "cardSet", item })),
  ]
  return items.sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt)).slice(0, 5)
}

function getPinnedCourses(
  folders: readonly Folder[],
  pages: readonly PageSummary[],
  sets: readonly NotecardSet[]
): PinnedCourse[] {
  return folders
    .filter((folder) => folder.isPinned)
    .map((folder) => {
      const folderIds = getDescendantIds(folder.id, folders)
      folderIds.add(folder.id)
      return {
        folder,
        pageCount: pages.filter((page) => page.folderId !== null && folderIds.has(page.folderId)).length,
        setCount: sets.filter((set) => set.folderId !== null && folderIds.has(set.folderId)).length,
      }
    })
    .sort((a, b) => a.folder.name.localeCompare(b.folder.name))
}

function buildDueGroups(
  cards: readonly Notecard[],
  sets: readonly NotecardSet[],
  folders: readonly Folder[],
  now: Date
): DueSetGroup[] {
  const counts = new Map<string, number>()
  for (const card of cards) {
    if (isDue(card.schedule, now)) counts.set(card.setId, (counts.get(card.setId) ?? 0) + 1)
  }

  const folderIndex = indexFolders(folders)
  return sets
    .flatMap((set) => {
      const dueCount = counts.get(set.id) ?? 0
      if (dueCount === 0) return []
      const folderLabel = set.folderId ? formatFolderPath(set.folderId, folderIndex) : "Unfiled"
      return [{ set, dueCount, label: folderLabel === "Unfiled" ? set.title : folderLabel }]
    })
    .sort((a, b) => b.dueCount - a.dueCount || a.label.localeCompare(b.label))
}

/** Pure aggregation boundary for the dashboard. It does not read storage or call UI APIs. */
export function aggregateDashboard(
  folders: readonly Folder[],
  pages: readonly PageSummary[],
  sets: readonly NotecardSet[],
  cards: readonly Notecard[],
  studyActivity: readonly StudyActivityDay[],
  now: Date
): DashboardAggregate {
  const dueGroups = buildDueGroups(cards, sets, folders, now)
  const today = localDateKey(now)

  return {
    dueGroups,
    dueCount: dueGroups.reduce((total, group) => total + group.dueCount, 0),
    recent: recentItems(pages, sets),
    pinned: getPinnedCourses(folders, pages, sets),
    activity: {
      reviewedToday: studyActivity.find((day) => day.date === today)?.reviewed ?? 0,
      streak: activityStreak(studyActivity, now),
    },
    mastery: getMasteryBreakdown(cards),
  }
}
