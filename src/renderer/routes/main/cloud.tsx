import { createFileRoute } from '@tanstack/react-router'
import { PicGoCloud } from '@/components/main/cloud/picgo-cloud'

export const Route = createFileRoute('/main/cloud')({
  component: PicGoCloud
})
