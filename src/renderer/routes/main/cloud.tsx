import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { WorkspacePlaceholder } from '@/components/common/workspace-placeholder'

function CloudRouteComponent () {
  const { t } = useTranslation()
  return <WorkspacePlaceholder title={t('PICGO_CLOUD_TITLE')} />
}

export const Route = createFileRoute('/main/cloud')({
  component: CloudRouteComponent
})
