import { useRef, useEffect } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function PlateEditor({ content, onChange, placeholder = "Start typing..." }: RichTextEditorProps) {
  const quillRef = useRef<HTMLDivElement>(null)
  const quillInstance = useRef<Quill | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!quillRef.current || quillInstance.current) return

    // Create new Quill instance
    const quill = new Quill(quillRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['blockquote'],
          [{ 'align': [] }],
          ['link', 'image'],
          [{ 'color': [] }, { 'background': [] }],
          ['clean']
        ],
      }
    })

    quillInstance.current = quill

    // Set initial content
    if (content) {
      quill.root.innerHTML = content
    }

    // Listen for changes
    quill.on('text-change', () => {
      const html = quill.root.innerHTML
      onChange(html)
    })

    return () => {
      if (quillInstance.current) {
        quillInstance.current.off('text-change')
        quillInstance.current = null
      }
    }
  }, [])

  // Remove duplicate toolbars caused by React Strict Mode
  useEffect(() => {
    if (containerRef.current) {
      const toolbars = containerRef.current.querySelectorAll('.ql-toolbar')
      if (toolbars.length > 1) {
        // Remove all but the last toolbar (keep the most recent one)
        for (let i = 0; i < toolbars.length - 1; i++) {
          toolbars[i].remove()
        }
      }
    }
  })

  // Update content when prop changes
  useEffect(() => {
    if (quillInstance.current && content !== quillInstance.current.root.innerHTML) {
      quillInstance.current.root.innerHTML = content || ''
    }
  }, [content])

  return (
    <div ref={containerRef} className="border rounded-md">
      <div ref={quillRef} style={{ minHeight: '400px' }} />
    </div>
  )
}