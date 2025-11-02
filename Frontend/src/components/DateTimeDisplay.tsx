import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils'

export function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Actualizar cada minuto
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  return <>{formatDateTime(currentTime)}</>
}