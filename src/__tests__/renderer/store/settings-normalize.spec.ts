import { describe, expect, it } from 'vitest'
import type { IConfig } from 'picgo'
import { normalizeSettingsConfig } from '@/store/utils'

function configWithServer (server: Record<string, unknown>): IConfig {
  return { settings: { server } } as unknown as IConfig
}

describe('normalizeSettingsConfig — server', () => {
  it('keeps the saved server secret so the settings dialog can show it again', () => {
    const settings = normalizeSettingsConfig(configWithServer({
      host: '127.0.0.1',
      port: 36677,
      enable: true,
      secret: 'my-secret'
    }))

    expect(settings.server).toEqual({
      host: '127.0.0.1',
      port: 36677,
      enable: true,
      secret: 'my-secret'
    })
  })

  it('falls back to an empty secret when none is saved or the value is not a string', () => {
    expect(normalizeSettingsConfig(configWithServer({ host: '127.0.0.1', port: 36677, enable: true })).server.secret).toBe('')
    expect(normalizeSettingsConfig(configWithServer({ host: '127.0.0.1', port: 36677, enable: true, secret: 123 })).server.secret).toBe('')
  })
})
