import { useState } from 'react'
import { getPlatform } from '@/utils/bridge'

export function useOS () {
  const [os] = useState(getPlatform())
  return os
}
