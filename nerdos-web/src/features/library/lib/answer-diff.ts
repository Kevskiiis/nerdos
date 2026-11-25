export interface AnswerSegment {
  text: string
  /** True when this word also appears, in order, in the other text. */
  match: boolean
}

export interface AnswerDiff {
  typed: AnswerSegment[]
  expected: AnswerSegment[]
  isExact: boolean
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
}

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

/** Word-level longest-common-subsequence diff, ignoring case and surrounding punctuation. */
export function diffAnswer(typed: string, expected: string): AnswerDiff {
  const a = words(typed)
  const b = words(expected)
  const na = a.map(normalizeWord)
  const nb = b.map(normalizeWord)

  const lengths: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i][j] = na[i] === nb[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1])
    }
  }

  const typedSegments: AnswerSegment[] = a.map((text) => ({ text, match: false }))
  const expectedSegments: AnswerSegment[] = b.map((text) => ({ text, match: false }))
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (na[i] === nb[j]) {
      typedSegments[i].match = true
      expectedSegments[j].match = true
      i++
      j++
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) i++
    else j++
  }

  const isExact = a.length === b.length && typedSegments.every((segment) => segment.match)
  return { typed: typedSegments, expected: expectedSegments, isExact }
}
