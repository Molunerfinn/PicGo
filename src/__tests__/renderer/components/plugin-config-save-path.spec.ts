// Regression spec for the plugin config save→read path consistency.
//
// picgo-core stores per-plugin configs at the root of the config object via
// `picgo.saveConfig({ [fullName]: values })` (same convention the CLI uses).
// The renderer's `normalizeAppConfig` rolls those root entries up into
// `appConfig.plugins[fullName]` by cross-referencing the `picgoPlugins` install
// map, so the panel and CLI read the same place.

import { describe, expect, it } from 'vitest'
import { set as lodashSet } from 'lodash'
import { normalizeAppConfig } from '@/store/utils'

describe('plugin config save path', () => {
  it('rolls up root-level plugin entries into appConfig.plugins via picgoPlugins install map', () => {
    const rawConfig: Record<string, unknown> = {
      picBed: { uploader: 'smms', current: 'smms', transformer: 'path' },
      picgoPlugins: { 'picgo-plugin-test': true },
      settings: {},
      uploader: {},
      transformer: {},
      needReload: false
    }
    // Simulates picgo.saveConfig({ 'picgo-plugin-test': { ... } })
    lodashSet(rawConfig, 'picgo-plugin-test', {
      mode: 'advanced',
      verbosity: 'debug',
      apiVersion: 'v2'
    })

    const normalized = normalizeAppConfig(rawConfig as never, [])

    expect(normalized?.plugins['picgo-plugin-test']).toEqual({
      mode: 'advanced',
      verbosity: 'debug',
      apiVersion: 'v2'
    })
  })

  it('ignores root entries that do not correspond to an installed plugin', () => {
    const rawConfig: Record<string, unknown> = {
      picBed: { uploader: 'smms', current: 'smms', transformer: 'path' },
      picgoPlugins: {},
      settings: {},
      uploader: {},
      transformer: {},
      needReload: false
    }
    lodashSet(rawConfig, 'picgo-plugin-test', { mode: 'advanced' })

    const normalized = normalizeAppConfig(rawConfig as never, [])

    // Not installed → not rolled up.
    expect(normalized?.plugins['picgo-plugin-test']).toBeUndefined()
  })

  it('falls back to a pre-existing nested plugins entry when no root entry exists', () => {
    const rawConfig: Record<string, unknown> = {
      picBed: { uploader: 'smms', current: 'smms', transformer: 'path' },
      picgoPlugins: { 'picgo-plugin-test': true },
      settings: {},
      uploader: {},
      transformer: {},
      plugins: {
        'picgo-plugin-test': { mode: 'legacy' }
      },
      needReload: false
    }

    const normalized = normalizeAppConfig(rawConfig as never, [])

    expect(normalized?.plugins['picgo-plugin-test']).toEqual({ mode: 'legacy' })
  })
})
