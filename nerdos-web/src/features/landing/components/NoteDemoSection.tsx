import { useState } from "react"
import { Plate, PlateContent, usePlateEditor } from "platejs/react"
import { editorPlugins } from "@/components/editor/editor-plugins"
import { SlashMenu } from "@/components/editor/slash-menu"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { NOTE_DEMO_CONTENT as content } from "../lib/landing-content"

function DemoEditor() {
  const editor = usePlateEditor({ plugins: editorPlugins, value: structuredClone(content.body) }, [])
  return <div className="motion-feedback"><Plate editor={editor}>
    <PlateContent aria-label="Note body" placeholder="Type / for commands" className="mt-3 min-h-[320px] w-full min-w-0 rounded-md border border-border bg-card p-3 text-base leading-relaxed break-words text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    <SlashMenu />
    <p className="mt-3 text-sm text-muted-foreground"><kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-foreground">/</kbd> Type a slash in your note to add a heading, list, callout, and more.</p>
  </Plate></div>
}

/** Lets visitors try a temporary, self-contained structured note. */
export function NoteDemoSection() {
  const [revision, setRevision] = useState(0)
  function reset() { setRevision(current => current + 1) }
  return <section aria-labelledby="note-demo-title" className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-20">
    <div>
      <Badge variant="secondary" className="h-7 px-3">{content.eyebrow}</Badge>
      <h2 id="note-demo-title" className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{content.headline}</h2>
      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{content.description}</p>
      <Link to={content.cta.href} className={buttonVariants({ size: "lg", className: "mt-7 min-h-11 w-full px-6 sm:w-auto" })}>{content.cta.label}</Link>
    </div>
    <Card className="min-w-0 gap-0 border border-border p-4 shadow-none sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="h-7">Live preview — try editing</Badge>
        <Button variant="ghost" className="ml-auto min-h-11" onClick={reset}>Reset</Button>
      </div>
      <Separator />
      <DemoEditor key={revision} />
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">Ready to keep your notes? <Link className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4" to="/register">Get started</Link></p>
    </Card>
  </section>
}
