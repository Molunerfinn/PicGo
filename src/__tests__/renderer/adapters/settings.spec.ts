import { describe, expect, test } from 'vitest'
import type { IConfig } from 'picgo'
import { IStartupMode } from '#/types/enum'
import { buildSettingsForm } from '@/adapters/settings'

describe('renderer/adapters settings', () => {
  test('buildSettingsForm returns stable defaults when app config is empty', () => {
    const form = buildSettingsForm(null)

    expect(form.language).toBe('en')
    expect(form.autoCopyUrl).toBe(true)
    expect(form.notificationSound).toBe(true)
    expect(form.server.host).toBe('127.0.0.1')
    expect(form.server.port).toBe(36677)
    expect(form.startupMode).toBe(IStartupMode.HIDE)
  })

  test('buildSettingsForm maps config settings and visible picbed names', () => {
    const config = {
      picBed: {
        uploader: 'smms',
        current: 'smms',
        proxy: 'http://127.0.0.1:7890',
        list: [
          { type: 'smms', name: 'SM.MS', visible: true },
          { type: 'github', name: 'GitHub', visible: false }
        ]
      },
      picgoPlugins: {},
      settings: {
        language: 'zh-CN',
        autoStart: true,
        rename: true,
        autoCopyUrl: false,
        showDockIcon: false,
        startupMode: IStartupMode.SHOW_MAIN_WINDOW,
        server: {
          host: '0.0.0.0',
          port: 4567,
          enable: false
        }
      }
    } as IConfig

    const form = buildSettingsForm(config)

    expect(form.language).toBe('zh-CN')
    expect(form.autoStart).toBe(true)
    expect(form.rename).toBe(true)
    expect(form.autoCopyUrl).toBe(false)
    expect(form.showDockIcon).toBe(false)
    expect(form.showPicBedList).toEqual(['SM.MS'])
    expect(form.server).toEqual({
      host: '0.0.0.0',
      port: 4567,
      enable: false
    })
    expect(form.startupMode).toBe(IStartupMode.SHOW_MAIN_WINDOW)
  })
})
