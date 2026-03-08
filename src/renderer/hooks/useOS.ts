import { useState } from 'react'
import { getAppPlatform } from '@/lib/platform'

export function useOS () {
  const [os] = useState(getAppPlatform())
  return os
}
