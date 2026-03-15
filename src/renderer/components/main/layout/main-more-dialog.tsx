import { useEffect, useMemo, useState } from 'react'
import { QrCodeIcon, WrenchIcon, InfoIcon, HeartHandshakeIcon, ShieldCheckIcon, Code2Icon, CopyIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { clipboard, ipcRenderer } from 'electron'

import { SHOW_MAIN_PAGE_DONATION, SHOW_MAIN_PAGE_QRCODE } from '#/events/constants'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { getConfig, getPicBeds } from '@/utils/dataSender'
import { toast } from 'sonner'
import { mainMoreAdapter } from '@/adapters/main-more'

interface MainMoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MainMoreDialog ({ open, onOpenChange }: MainMoreDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [donationOpen, setDonationOpen] = useState(false)
  const [qrcodeOpen, setQrcodeOpen] = useState(false)
  const [picBeds, setPicBeds] = useState<IPicBedType[]>([])
  const [selectedPicBeds, setSelectedPicBeds] = useState<string[]>([])
  const [picBedConfigString, setPicBedConfigString] = useState('')

  useEffect(() => {
    const handleDonation = () => {
      setDonationOpen(true)
    }

    const handleQrcode = () => {
      setQrcodeOpen(true)
    }

    ipcRenderer.on(SHOW_MAIN_PAGE_DONATION, handleDonation)
    ipcRenderer.on(SHOW_MAIN_PAGE_QRCODE, handleQrcode)

    return () => {
      ipcRenderer.removeListener(SHOW_MAIN_PAGE_DONATION, handleDonation)
      ipcRenderer.removeListener(SHOW_MAIN_PAGE_QRCODE, handleQrcode)
    }
  }, [])

  useEffect(() => {
    if (!open && !qrcodeOpen) {
      return
    }

    async function loadPicBeds () {
      const nextPicBeds = await getPicBeds()
      setPicBeds(nextPicBeds.filter((item) => item.visible))
    }

    loadPicBeds()
  }, [open, qrcodeOpen])

  useEffect(() => {
    async function syncQrcodeConfig () {
      if (selectedPicBeds.length === 0) {
        setPicBedConfigString('')
        return
      }

      const picBedConfig = await getConfig<Record<string, unknown>>('picBed')

      if (!picBedConfig) {
        setPicBedConfigString('')
        return
      }

      const selectedConfig = Object.fromEntries(
        selectedPicBeds
          .filter((key) => key in picBedConfig)
          .map((key) => [key, picBedConfig[key]])
      )

      setPicBedConfigString(JSON.stringify(selectedConfig))
    }

    syncQrcodeConfig()
  }, [selectedPicBeds])

  const moreItems = useMemo(() => [
    {
      key: 'about',
      label: t('ABOUT'),
      icon: <InfoIcon className='size-4' />,
      action: () => {
        onOpenChange(false)
        navigate({
          to: '/main/settings/settings',
          search: {
            section: 'about'
          }
        })
      }
    },
    {
      key: 'donation',
      label: t('SPONSOR_PICGO'),
      icon: <HeartHandshakeIcon className='size-4' />,
      action: () => {
        onOpenChange(false)
        setDonationOpen(true)
      }
    },
    {
      key: 'qrcode',
      label: t('SHOW_PICBED_QRCODE'),
      icon: <QrCodeIcon className='size-4' />,
      action: () => {
        onOpenChange(false)
        setQrcodeOpen(true)
      }
    },
    {
      key: 'toolbox',
      label: t('OPEN_TOOLBOX'),
      icon: <WrenchIcon className='size-4' />,
      action: () => {
        onOpenChange(false)
        mainMoreAdapter.openToolboxWindow()
      }
    },
    {
      key: 'devtools',
      label: t('SHOW_DEVTOOLS'),
      icon: <Code2Icon className='size-4' />,
      action: () => {
        onOpenChange(false)
        mainMoreAdapter.openDevtools()
      }
    },
    {
      key: 'privacy',
      label: t('PRIVACY_TERMS_AGREEMENT'),
      icon: <ShieldCheckIcon className='size-4' />,
      action: () => {
        onOpenChange(false)
        mainMoreAdapter.openPrivacyTerms()
      }
    }
  ], [navigate, onOpenChange, t])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-sm p-3'>
          <DialogHeader className='sr-only'>
            <DialogTitle>{t('ABOUT')}</DialogTitle>
          </DialogHeader>

          <div className='space-y-1'>
            {moreItems.map((item) => (
              <button
                key={item.key}
                type='button'
                onClick={item.action}
                className='hover:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-base font-medium transition-colors'
              >
                <span className='text-muted-foreground'>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={donationOpen} onOpenChange={setDonationOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('SPONSOR_PICGO')}</DialogTitle>
            <DialogDescription>{t('PICGO_SPONSOR_TEXT')}</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-3 rounded-xl border border-border p-4 text-center'>
              <img
                src='https://user-images.githubusercontent.com/12621342/34188165-e7cdf372-e56f-11e7-8732-1338c88b9bb7.jpg'
                alt={t('ALIPAY')}
                className='mx-auto aspect-square w-full max-w-64 rounded-lg object-cover'
              />
              <p className='font-medium'>{t('ALIPAY')}</p>
            </div>
            <div className='space-y-3 rounded-xl border border-border p-4 text-center'>
              <img
                src='https://user-images.githubusercontent.com/12621342/34188201-212cda84-e570-11e7-9b7a-abb298699d85.jpg'
                alt={t('WECHATPAY')}
                className='mx-auto aspect-square w-full max-w-64 rounded-lg object-cover'
              />
              <p className='font-medium'>{t('WECHATPAY')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qrcodeOpen} onOpenChange={setQrcodeOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('PICBED_QRCODE')}</DialogTitle>
            <DialogDescription>{t('CHOOSE_PICBED')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='flex flex-wrap gap-2'>
              {picBeds.map((item) => {
                const selected = selectedPicBeds.includes(item.type)

                return (
                  <Button
                    key={item.type}
                    type='button'
                    variant={selected ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setSelectedPicBeds((current) =>
                        current.includes(item.type)
                          ? current.filter((type) => type !== item.type)
                          : [...current, item.type]
                      )
                    }}
                  >
                    {item.name}
                  </Button>
                )
              })}
            </div>

            {picBedConfigString ? (
              <div className='flex flex-col items-center gap-4 rounded-xl border border-border p-6'>
                <QRCodeSVG value={picBedConfigString} size={280} />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    clipboard.writeText(picBedConfigString)
                    toast.success(t('COPY_PICBED_CONFIG_SUCCEED'))
                  }}
                >
                  <CopyIcon className='size-4' />
                  {t('COPY_PICBED_CONFIG')}
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
