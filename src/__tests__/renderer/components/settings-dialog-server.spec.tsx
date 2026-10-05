// @vitest-environment jsdom

import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const saveSettingsConfig = vi.fn(async (_path: string, _value?: unknown) => true)

vi.mock('@/components/main/settings/use-settings-save', () => ({
  useSettingsSave: () => saveSettingsConfig
}))

import { SettingsServerDialog } from '@/components/main/settings/settings-dialog-server'

function ServerDialogHarness ({ initialSecret = '' }: { initialSecret?: string }) {
  const [open, setOpen] = useState(true)
  const [host, setHost] = useState('127.0.0.1')
  const [port, setPort] = useState('36677')
  const [enable, setEnable] = useState(true)
  const [secret, setSecret] = useState(initialSecret)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>reopen</button>
      <SettingsServerDialog
        open={open}
        onOpenChange={setOpen}
        serverHostDraft={host}
        serverPortDraft={port}
        serverEnableDraft={enable}
        serverSecretDraft={secret}
        onServerHostDraftChange={setHost}
        onServerPortDraftChange={setPort}
        onServerEnableDraftChange={setEnable}
        onServerSecretDraftChange={setSecret}
      />
    </>
  )
}

function getSecretInput () {
  return screen.getByLabelText('SETTINGS_SET_SERVER_SECRET') as HTMLInputElement
}

describe('SettingsServerDialog — server secret', () => {
  beforeEach(() => {
    saveSettingsConfig.mockClear()
  })

  it('saves the trimmed secret together with host, port and enable', async () => {
    render(<ServerDialogHarness />)

    fireEvent.change(getSecretInput(), { target: { value: '  my-secret  ' } })
    fireEvent.click(screen.getByText('CONFIRM'))

    await waitFor(() => expect(saveSettingsConfig).toHaveBeenCalledTimes(1))
    expect(saveSettingsConfig).toHaveBeenCalledWith('settings.server', {
      host: '127.0.0.1',
      port: 36677,
      enable: true,
      secret: 'my-secret'
    })
  })

  it('saves an empty secret when the field is cleared, which disables authentication', async () => {
    render(<ServerDialogHarness initialSecret='old-secret' />)

    fireEvent.change(getSecretInput(), { target: { value: '   ' } })
    fireEvent.click(screen.getByText('CONFIRM'))

    await waitFor(() => expect(saveSettingsConfig).toHaveBeenCalledTimes(1))
    expect(saveSettingsConfig).toHaveBeenCalledWith('settings.server', expect.objectContaining({ secret: '' }))
  })

  it('masks the secret by default, can reveal it, and masks it again after reopening', async () => {
    render(<ServerDialogHarness initialSecret='my-secret' />)

    expect(getSecretInput().type).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: 'SETTINGS_SHOW_SECRET' }))
    expect(getSecretInput().type).toBe('text')

    fireEvent.click(screen.getByText('CANCEL'))
    await waitFor(() => expect(screen.queryByLabelText('SETTINGS_SET_SERVER_SECRET')).toBeNull())

    fireEvent.click(screen.getByText('reopen'))
    await waitFor(() => expect(getSecretInput().type).toBe('password'))
  })
})
