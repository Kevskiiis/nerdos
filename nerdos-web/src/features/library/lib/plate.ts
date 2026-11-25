import type { PlateDescendant, PlateElement, PlateValue } from "../types"

/** Converts plain text into Plate paragraph nodes (one paragraph per line). */
export function plainTextToPlate(text: string): PlateValue {
  const lines = text.split("\n")
  return lines.map((line) => ({ type: "p", children: [{ text: line }] }))
}

const INLINE_TYPES = new Set(["a", "inline_equation"])

function isElement(node: PlateDescendant): node is PlateElement {
  return "children" in node
}

function collectText(node: PlateDescendant, out: string[]): void {
  if (!isElement(node)) {
    out.push(node.text)
    return
  }
  if (node.type === "hr") return
  // Void nodes (equations) keep their content in an attribute rather than in children.
  if (typeof node.texExpression === "string") out.push(node.texExpression)
  for (const child of node.children) collectText(child, out)
  if (!INLINE_TYPES.has(node.type)) out.push(" ")
}

/** Flattens a document to searchable plain text. */
export function plateToPlainText(value: PlateValue): string {
  const out: string[] = []
  for (const node of value) collectText(node, out)
  return out.join("")
}

/** Short single-paragraph preview used by list/grid views. */
export function deriveExcerpt(text: string, maxLength = 160): string {
  const collapsed = text.replace(/\s+/g, " ").trim()
  return collapsed.length > maxLength ? `${collapsed.slice(0, maxLength).trimEnd()}…` : collapsed
}
