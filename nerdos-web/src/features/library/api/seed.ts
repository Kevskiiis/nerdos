import type {
  CardSchedule,
  CardState,
  Folder,
  LibraryStoreData,
  Notecard,
  Page,
  StoredCardSet,
  StudyActivityDay,
} from "../types"
import { deriveExcerpt, plainTextToPlate } from "../lib/plate"
import { createInitialSchedule } from "../lib/scheduler"

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

interface FolderSeed {
  id: string
  name: string
  parentId?: string
  pinned?: boolean
}

interface PageSeed {
  id: string
  folderId: string | null
  title: string
  text: string
  updatedHoursAgo: number
  createdDaysAgo: number
}

interface CardSetSeed {
  id: string
  folderId: string | null
  title: string
  description: string
  updatedHoursAgo: number
  createdDaysAgo: number
}

/** `mastered` is long-interval, `learning` is mid-interval and not yet due, `due` is overdue for review. */
type CardKind = "new" | "due" | "learning" | "mastered"

interface CardSeed {
  setId: string
  kind: CardKind
  front: string
  back: string
}

const FOLDERS: FolderSeed[] = [
  { id: "folder-cs355", name: "CS 355", pinned: true },
  { id: "folder-cs355-lectures", name: "Lectures", parentId: "folder-cs355" },
  { id: "folder-cs355-assignments", name: "Assignments", parentId: "folder-cs355" },
  { id: "folder-math241", name: "MATH 241", pinned: true },
  { id: "folder-math241-problem-sets", name: "Problem Sets", parentId: "folder-math241" },
  { id: "folder-bio101", name: "BIO 101" },
  { id: "folder-bio101-labs", name: "Lab Reports", parentId: "folder-bio101" },
  { id: "folder-phys210", name: "PHYS 210" },
  { id: "folder-engl102", name: "ENGL 102" },
  { id: "folder-hist110", name: "HIST 110" },
  { id: "folder-chem120", name: "CHEM 120" },
  { id: "folder-psyc100", name: "PSYC 100" },
]

const PAGES: PageSeed[] = [
  {
    id: "page-weekly-plan",
    folderId: null,
    title: "Weekly study plan",
    text: "Mon: CS 355 problem set, 2h.\nTue: MATH 241 review, BIO 101 lab write-up.\nWed: Office hours, flashcards.\nThu: PHYS 210 practice exam.\nFri: Light review and plan next week.",
    updatedHoursAgo: 3,
    createdDaysAgo: 14,
  },
  {
    id: "page-reading-list",
    folderId: null,
    title: "Reading list",
    text: "Cormen ch. 15–17, Stewart ch. 14, Campbell Biology ch. 6, and the assigned ENGL 102 essays.",
    updatedHoursAgo: 52,
    createdDaysAgo: 30,
  },
  {
    id: "page-cs355-syllabus",
    folderId: "folder-cs355",
    title: "Course syllabus & grading",
    text: "Grading: 30% homework, 25% midterm, 35% final, 10% participation. Late homework loses 10% per day.",
    updatedHoursAgo: 400,
    createdDaysAgo: 60,
  },
  {
    id: "page-big-o",
    folderId: "folder-cs355-lectures",
    title: "Lecture 4 — Asymptotic analysis",
    text: "Big-O gives an upper bound on growth, Big-Omega a lower bound, and Big-Theta a tight bound. We drop constants and lower-order terms: 3n² + 5n + 2 is Θ(n²).",
    updatedHoursAgo: 5,
    createdDaysAgo: 21,
  },
  {
    id: "page-dp",
    folderId: "folder-cs355-lectures",
    title: "Lecture 9 — Dynamic programming",
    text: "Use DP when a problem has optimal substructure and overlapping subproblems. Define the state, write the recurrence, then check the base cases.",
    updatedHoursAgo: 80,
    createdDaysAgo: 9,
  },
  {
    id: "page-hw3",
    folderId: "folder-cs355-assignments",
    title: "Homework 3 — Graph traversal",
    text: "BFS finds shortest paths in unweighted graphs in O(V + E). DFS yields discovery and finish times, which power topological sort.",
    updatedHoursAgo: 12,
    createdDaysAgo: 6,
  },
  {
    id: "page-multivar",
    folderId: "folder-math241",
    title: "Partial derivatives & the gradient",
    text: "The gradient ∇f points in the direction of steepest ascent, and its magnitude is the maximum rate of change.",
    updatedHoursAgo: 20,
    createdDaysAgo: 25,
  },
  {
    id: "page-lagrange",
    folderId: "folder-math241-problem-sets",
    title: "Problem set 5 — Lagrange multipliers",
    text: "To optimize f subject to g = c, solve ∇f = λ∇g together with the constraint. Compare all candidate points.",
    updatedHoursAgo: 8,
    createdDaysAgo: 4,
  },
  {
    id: "page-cell-respiration",
    folderId: "folder-bio101",
    title: "Cellular respiration overview",
    text: "Glycolysis occurs in the cytoplasm, the Krebs cycle in the mitochondrial matrix, and oxidative phosphorylation across the inner membrane.",
    updatedHoursAgo: 70,
    createdDaysAgo: 28,
  },
  {
    id: "page-enzyme-lab",
    folderId: "folder-bio101-labs",
    title: "Enzyme kinetics lab report",
    text: "Hypothesis: reaction rate increases with substrate concentration until the enzyme saturates. Observed Vmax of 0.42 µmol/min.",
    updatedHoursAgo: 48,
    createdDaysAgo: 11,
  },
  {
    id: "page-kinematics",
    folderId: "folder-phys210",
    title: "Kinematics cheat sheet",
    text: "v = v₀ + at; x = x₀ + v₀t + ½at²; v² = v₀² + 2a(x − x₀). Projectile motion separates into independent components.",
    updatedHoursAgo: 120,
    createdDaysAgo: 35,
  },
  {
    id: "page-essay-outline",
    folderId: "folder-engl102",
    title: "Argumentative essay outline",
    text: "Thesis: Public libraries remain essential infrastructure. Body 1: access and equity. Body 2: community programming.",
    updatedHoursAgo: 26,
    createdDaysAgo: 8,
  },
]

const CARD_SETS: CardSetSeed[] = [
  {
    id: "cards-linux",
    folderId: null,
    title: "Linux commands",
    description: "Everyday shell commands worth knowing by heart.",
    updatedHoursAgo: 6,
    createdDaysAgo: 3,
  },
  {
    id: "cards-security",
    folderId: null,
    title: "Cybersecurity concepts",
    description: "Core terms for the security fundamentals unit.",
    updatedHoursAgo: 30,
    createdDaysAgo: 7,
  },
  {
    id: "cards-big-o",
    folderId: "folder-cs355",
    title: "Complexity classes",
    description: "Big-O, Omega, Theta and common recurrences.",
    updatedHoursAgo: 10,
    createdDaysAgo: 12,
  },
  {
    id: "cards-graphs",
    folderId: "folder-cs355",
    title: "Graph algorithms",
    description: "BFS, DFS, Dijkstra and MST definitions.",
    updatedHoursAgo: 60,
    createdDaysAgo: 10,
  },
  {
    id: "cards-rust",
    folderId: "folder-cs355-lectures",
    title: "Rust ownership",
    description: "Ownership, borrowing and lifetimes.",
    updatedHoursAgo: 14,
    createdDaysAgo: 9,
  },
  {
    id: "cards-derivatives",
    folderId: "folder-math241",
    title: "Derivative rules",
    description: "Chain rule, gradients and directional derivatives.",
    updatedHoursAgo: 14,
    createdDaysAgo: 20,
  },
  {
    id: "cards-organelles",
    folderId: "folder-bio101",
    title: "Cell organelles",
    description: "Structure and function of each organelle.",
    updatedHoursAgo: 40,
    createdDaysAgo: 16,
  },
]

const CARDS: CardSeed[] = [
  { setId: "cards-linux", kind: "due", front: "Which command lists files with permissions and sizes?", back: "`ls -lh`" },
  { setId: "cards-linux", kind: "due", front: "Recursively search for a string in a directory", back: "`grep -rn \"text\" .`" },
  { setId: "cards-linux", kind: "new", front: "Change a file's permissions to rwxr-xr--", back: "`chmod 754 file`" },
  { setId: "cards-linux", kind: "learning", front: "Show the last 50 lines of a log and keep following it", back: "`tail -n 50 -f file.log`" },
  { setId: "cards-linux", kind: "mastered", front: "Print the current working directory", back: "`pwd`" },

  { setId: "cards-security", kind: "due", front: "What does the CIA triad stand for?", back: "Confidentiality, Integrity, Availability" },
  { setId: "cards-security", kind: "new", front: "What is the difference between authentication and authorization?", back: "Authentication proves who you are; authorization decides what you may do." },
  { setId: "cards-security", kind: "learning", front: "What is a salted hash?", back: "A hash of a password plus a random per-user value, defeating precomputed rainbow tables." },
  { setId: "cards-security", kind: "mastered", front: "What attack inserts malicious SQL through user input?", back: "SQL injection" },

  { setId: "cards-big-o", kind: "due", front: "Time complexity of merge sort", back: "Θ(n log n) in every case" },
  { setId: "cards-big-o", kind: "new", front: "What does Big-Theta describe?", back: "A tight bound: both an upper and a lower bound on growth." },
  { setId: "cards-big-o", kind: "mastered", front: "Binary search complexity", back: "O(log n)" },

  { setId: "cards-rust", kind: "due", front: "How many owners can a value have in Rust?", back: "Exactly one. When the owner goes out of scope the value is dropped." },
  { setId: "cards-rust", kind: "due", front: "What is the rule for `&mut T` references?", back: "Only one mutable reference, and no shared references, may exist at the same time." },
  { setId: "cards-rust", kind: "new", front: "What does `'a` mean in `fn longest<'a>(x: &'a str)`?", back: "A lifetime parameter linking how long the returned reference stays valid to its inputs." },
  { setId: "cards-rust", kind: "learning", front: "What happens on `let b = a;` for a `String`?", back: "Ownership moves to `b`; `a` can no longer be used." },

  { setId: "cards-derivatives", kind: "due", front: "State the chain rule", back: "(f∘g)'(x) = f'(g(x)) · g'(x)" },
  { setId: "cards-derivatives", kind: "new", front: "What does the gradient ∇f point toward?", back: "The direction of steepest ascent of f." },

  { setId: "cards-organelles", kind: "mastered", front: "Which organelle produces most of a cell's ATP?", back: "The mitochondrion" },
  { setId: "cards-organelles", kind: "learning", front: "What is the function of the Golgi apparatus?", back: "Modifies, sorts and packages proteins and lipids for secretion or delivery." },
]

/** Builds an FSRS-shaped schedule that matches the story told by `kind`, relative to `now`. */
function scheduleFor(kind: CardKind, now: number): CardSchedule {
  const at = (offsetMs: number) => new Date(now + offsetMs).toISOString()

  switch (kind) {
    case "new":
      return createInitialSchedule(new Date(now))
    case "due":
      return {
        due: at(-DAY_MS),
        stability: 4.2,
        difficulty: 5.6,
        elapsedDays: 4,
        scheduledDays: 4,
        learningSteps: 0,
        reps: 3,
        lapses: 0,
        state: "review",
        lastReview: at(-5 * DAY_MS),
      }
    case "learning":
      return {
        due: at(4 * DAY_MS),
        stability: 8.5,
        difficulty: 5.1,
        elapsedDays: 3,
        scheduledDays: 7,
        learningSteps: 0,
        reps: 4,
        lapses: 1,
        state: "review",
        lastReview: at(-3 * DAY_MS),
      }
    case "mastered":
      return {
        due: at(26 * DAY_MS),
        stability: 48,
        difficulty: 3.1,
        elapsedDays: 14,
        scheduledDays: 40,
        learningSteps: 0,
        reps: 8,
        lapses: 0,
        state: "review",
        lastReview: at(-14 * DAY_MS),
      }
  }
}

const STATE_FOR_KIND: Record<CardKind, CardState> = { new: "new", due: "review", learning: "review", mastered: "review" }

/** Realistic starter workspace, with timestamps relative to `now` so relative times look natural. */
export function createSeedData(now: number = Date.now()): LibraryStoreData {
  const folders: Folder[] = FOLDERS.map((seed, index) => {
    const timestamp = new Date(now - (FOLDERS.length - index) * DAY_MS).toISOString()
    return {
      id: seed.id,
      name: seed.name,
      parentId: seed.parentId ?? null,
      isPinned: seed.pinned ?? false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  })

  const pages: Page[] = PAGES.map((seed) => ({
    id: seed.id,
    folderId: seed.folderId,
    title: seed.title,
    excerpt: deriveExcerpt(seed.text),
    content: plainTextToPlate(seed.text),
    createdAt: new Date(now - seed.createdDaysAgo * DAY_MS).toISOString(),
    updatedAt: new Date(now - seed.updatedHoursAgo * HOUR_MS).toISOString(),
  }))

  const cardSets: StoredCardSet[] = CARD_SETS.map((seed) => ({
    id: seed.id,
    folderId: seed.folderId,
    title: seed.title,
    description: seed.description,
    createdAt: new Date(now - seed.createdDaysAgo * DAY_MS).toISOString(),
    updatedAt: new Date(now - seed.updatedHoursAgo * HOUR_MS).toISOString(),
  }))

  const studyActivity: StudyActivityDay[] = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(now)
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - (4 - index))
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      reviewed: [7, 11, 4, 13, 6][index],
    }
  })

  const cards: Notecard[] = CARDS.map((seed, index) => {
    const schedule = scheduleFor(seed.kind, now)
    if (schedule.state !== STATE_FOR_KIND[seed.kind]) throw new Error(`Seed card ${index} has an inconsistent state.`)
    const created = new Date(now - (CARDS.length - index) * HOUR_MS).toISOString()
    return {
      id: `card-seed-${index + 1}`,
      setId: seed.setId,
      front: seed.front,
      back: seed.back,
      schedule,
      createdAt: created,
      updatedAt: created,
    }
  })

  return { folders, pages, cardSets, cards, reviewLogs: [], studyActivity }
}
