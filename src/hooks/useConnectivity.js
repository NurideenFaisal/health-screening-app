import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connection restored', {
        description: 'You are back online.',
        duration: 3000,
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Connection lost', {
        description: 'You are currently offline. Some features may not work.',
        duration: 5000,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}