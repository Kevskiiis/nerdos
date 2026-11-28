/** Copy for the introductory landing section and interactive preview. */
export const HERO_CONTENT = {
  announcement: "Meet Nerdos Beta",
  headline: "Master what you study, faster.",
  description: "Bring your notes and flashcards together in one focused workspace. Practice active recall and make every study session count.",
  primary: { label: "Start studying free", href: "/register" },
  secondary: { label: "Log in", href: "/login" },
  flashcard: { front: "What is active recall?", back: "Retrieving information from memory to strengthen what you have learned.", hint: "Tap card to flip" },
} as const

/** Features currently available in the study workspace. */
export const EXISTING_SERVICES = [
  { title: "Structured Note Editor", description: "Organize study notes built for clarity." },
  { title: "Flashcards & Study Library", description: "Create, organize, and manage decks in one library." },
  { title: "Focused Study Modes", description: "Practice active recall with focused study sessions." },
  { title: "Study Dashboard", description: "Track your decks and jump back into your study sessions." },
] as const

/** Planned AI capabilities, clearly distinguished from available features. */
export const COMING_SOON_SERVICES = [
  { title: "AI Notes-to-Notecards", description: "Turn structured notes into study-ready flashcards automatically." },
  { title: "AI Tutor", description: "Ask questions, explore weak spots, and get guided explanations on your material." },
] as const

/** Copy for the closing signup invitation. */
export const FINAL_CTA_CONTENT = { headline: "Ready to make studying stick?", description: "Join the Nerdos Beta and build a better study routine.", primary: { label: "Get started", href: "/register" } } as const
