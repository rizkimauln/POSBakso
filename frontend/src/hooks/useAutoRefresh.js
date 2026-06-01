import { useEffect, useRef } from 'react'

export function useAutoRefresh(callback, intervalMs = 30000) {
  const callbackRef = useRef(callback)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.hidden || isRefreshingRef.current) {
        return
      }

      isRefreshingRef.current = true
      Promise.resolve(callbackRef.current()).finally(() => {
        isRefreshingRef.current = false
      })
    }, intervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [intervalMs])
}
