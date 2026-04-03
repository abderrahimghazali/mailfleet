import { useRef, useEffect } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function PlateEditor({ content, onChange, placeholder = "Start typing..." }: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  const contentRef = useRef(content)

  // Keep refs in sync
  onChangeRef.current = onChange
  contentRef.current = content

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear container and create a fresh editor div
    const editorDiv = document.createElement('div')
    editorDiv.style.minHeight = '400px'
    container.innerHTML = ''
    container.appendChild(editorDiv)

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          ['blockquote'],
          [{ 'align': [] }],
          ['link', 'image'],
          [{ 'color': [] }, { 'background': [] }],
          ['clean']
        ],
      }
    })

    if (contentRef.current) {
      quill.root.innerHTML = contentRef.current
    }

    quill.on('text-change', () => {
      onChangeRef.current(quill.root.innerHTML)
    })

    return () => {
      quill.off('text-change')
      container.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="border rounded-md" ref={containerRef} />
  )
}
