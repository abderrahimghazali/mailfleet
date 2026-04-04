import type { QCMQuestion } from '@/types/database'

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'question'; content: QCMQuestion }
  | { type: 'action'; content: { action: string; name: string } }

export function parseAgentMessage(content: string): MessageSegment[] {
  const segments: MessageSegment[] = []
  let remaining = content

  while (remaining.length > 0) {
    // Look for [QUESTION] block
    const qStart = remaining.indexOf('[QUESTION]')
    const aStart = remaining.indexOf('[ACTION]')

    // Find the nearest special block
    let nextSpecial = -1
    let specialType: 'question' | 'action' | null = null

    if (qStart >= 0 && (aStart < 0 || qStart < aStart)) {
      nextSpecial = qStart
      specialType = 'question'
    } else if (aStart >= 0) {
      nextSpecial = aStart
      specialType = 'action'
    }

    if (nextSpecial < 0) {
      // No more special blocks, rest is text
      const trimmed = remaining.trim()
      if (trimmed) segments.push({ type: 'text', content: trimmed })
      break
    }

    // Add text before the special block
    const before = remaining.slice(0, nextSpecial).trim()
    if (before) segments.push({ type: 'text', content: before })

    if (specialType === 'question') {
      const endTag = '[/QUESTION]'
      const endIdx = remaining.indexOf(endTag, nextSpecial)
      if (endIdx >= 0) {
        const json = remaining.slice(nextSpecial + 10, endIdx)
        try {
          const question = JSON.parse(json) as QCMQuestion
          if (question.question && Array.isArray(question.options) && question.options.length > 0) {
            segments.push({ type: 'question', content: question })
          } else {
            // Malformed question — render as text
            segments.push({ type: 'text', content: question.question || json })
          }
        } catch {
          segments.push({ type: 'text', content: json })
        }
        remaining = remaining.slice(endIdx + endTag.length)
      } else {
        // No closing tag — truncated response, treat rest as text
        const rest = remaining.slice(nextSpecial).trim()
        if (rest) segments.push({ type: 'text', content: rest })
        break
      }
    } else if (specialType === 'action') {
      const endTag = '[/ACTION]'
      const endIdx = remaining.indexOf(endTag, nextSpecial)
      if (endIdx >= 0) {
        const json = remaining.slice(nextSpecial + 8, endIdx)
        try {
          const action = JSON.parse(json) as { action: string; name: string }
          segments.push({ type: 'action', content: action })
        } catch {
          segments.push({ type: 'text', content: json })
        }
        remaining = remaining.slice(endIdx + endTag.length)
      } else {
        // No closing tag — truncated response, treat rest as text
        const rest = remaining.slice(nextSpecial).trim()
        if (rest) segments.push({ type: 'text', content: rest })
        break
      }
    }
  }

  return segments
}
