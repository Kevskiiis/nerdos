import type { ReactNode } from "react"
import type { TCodeBlockElement } from "platejs"
import {
  PlateElement,
  PlateLeaf,
  useEditorRef,
  type PlateElementProps,
  type PlateLeafProps,
} from "platejs/react"

export const CODE_LANGUAGES: readonly { value: string; label: string }[] = [
  { value: "", label: "Plain text" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "r", label: "R" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "xml", label: "HTML / XML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
]

export function CodeBlockElement({ children, ...props }: PlateElementProps<TCodeBlockElement>): ReactNode {
  const editor = useEditorRef()
  const { element } = props

  return (
    <PlateElement {...props} className="py-1">
      <div className="relative rounded-2xl bg-muted/60">
        <pre className="overflow-x-auto p-4 pt-10 font-mono text-sm leading-relaxed [tab-size:2]">
          <code>{children}</code>
        </pre>
        <div contentEditable={false} className="absolute top-2 right-3 select-none">
          <select
            aria-label="Code language"
            value={element.lang ?? ""}
            onChange={(event) => {
              const at = editor.api.findPath(element)
              if (!at) return
              if (event.target.value) editor.tf.setNodes({ lang: event.target.value }, { at })
              else editor.tf.unsetNodes("lang", { at })
            }}
            className="cursor-pointer rounded-md bg-transparent px-1 py-0.5 text-xs text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {CODE_LANGUAGES.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </PlateElement>
  )
}

export function CodeLineElement(props: PlateElementProps): ReactNode {
  return <PlateElement {...props} />
}

export function CodeSyntaxLeaf(props: PlateLeafProps): ReactNode {
  return <PlateLeaf {...props} className={props.leaf.className as string | undefined} />
}
