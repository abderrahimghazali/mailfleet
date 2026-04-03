import { useRef, useEffect, useCallback } from 'react'
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
  const onChangeRef = useRef(onChange)
  const contentRef = useRef(content)
  const placeholderRef = useRef(placeholder)

  onChangeRef.current = onChange
  contentRef.current = content
  placeholderRef.current = placeholder

  const handleTextChange = useCallback(() => {
    if (quillInstance.current) {
      onChangeRef.current(quillInstance.current.root.innerHTML)
    }
  }, [])

  useEffect(() => {
    if (!quillRef.current) return
    if (quillRef.current.dataset.quillInitialized === 'true') return
    quillRef.current.dataset.quillInitialized = 'true'

    const quill = new Quill(quillRef.current, {
      theme: 'snow',
      placeholder: placeholderRef.current,
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

    if (contentRef.current) {
      quill.root.innerHTML = contentRef.current
    }

    quill.on('text-change', handleTextChange)

    return () => {
      quillInstance.current?.off('text-change')
      quillInstance.current = null
    }
  }, [handleTextChange])

  useEffect(() => {
    if (quillInstance.current && content !== quillInstance.current.root.innerHTML) {
      quillInstance.current.root.innerHTML = content || ''
    }
  }, [content])

  return (
    <div className="border rounded-md">
      <div ref={quillRef} style={{ minHeight: '400px' }} />
    </div>
  )
}
