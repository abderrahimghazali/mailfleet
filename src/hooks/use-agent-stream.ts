import { useState, useCallback, useRef, useEffect } from 'react'

export function useTypewriter() {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const typeText = useCallback((fullText: string, speed = 8) => {
    return new Promise<void>((resolve) => {
      setDisplayText('')
      setIsTyping(true)

      let index = 0
      intervalRef.current = setInterval(() => {
        if (index < fullText.length) {
          const chunkSize = Math.min(2 + Math.floor(Math.random() * 3), fullText.length - index)
          index += chunkSize
          setDisplayText(fullText.slice(0, index))
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setIsTyping(false)
          resolve()
        }
      }, speed)
    })
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setDisplayText('')
    setIsTyping(false)
  }, [])

  return { displayText, isTyping, typeText, reset }
}
