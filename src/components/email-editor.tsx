import { useRef, useCallback } from 'react'
import { Editor } from '@maily-to/core'
import '@maily-to/core/style.css'
import type { JSONContent } from '@tiptap/react'

interface EmailEditorProps {
  contentJson?: JSONContent
  contentHtml?: string
  onChange?: (json: JSONContent, html: string) => void
}

export function EmailEditor({ contentJson, contentHtml, onChange }: EmailEditorProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = useCallback((editor: any) => {
    const json = editor.getJSON()
    const html = editor.getHTML()
    onChangeRef.current?.(json, html)
  }, [])

  return (
    <div className="maily-editor-wrapper">
      <Editor
        contentJson={contentJson}
        contentHtml={contentHtml}
        onUpdate={handleUpdate}
        config={{
          hasMenuBar: false,
          spellCheck: true,
          autofocus: 'end',
        }}
      />
    </div>
  )
}
