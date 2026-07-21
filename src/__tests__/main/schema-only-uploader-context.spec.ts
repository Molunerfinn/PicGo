import { describe, expect, it } from 'vitest'

import { createSchemaOnlyUploaderContext } from '~/main/utils/schemaOnlyUploaderContext'

type ConfigRecord = Record<string, unknown>

function isConfigRecord(value: unknown): value is ConfigRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getByPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isConfigRecord(current)) {
      return undefined
    }
    return current[key]
  }, value)
}

describe('createSchemaOnlyUploaderContext', () => {
  it('hides only the target uploader configuration without mutating the source', () => {
    const config = {
      picBed: {
        current: 'tcyun',
        tcyun: {
          secretId: 'existing-secret-id',
          secretKey: 'existing-secret-key'
        },
        github: {
          token: 'github-token'
        }
      },
      uploader: {
        tcyun: {
          defaultId: 'config-1'
        },
        github: {
          defaultId: 'config-2'
        }
      },
      settings: {
        proxy: 'http://localhost:7890'
      }
    }
    const context = {
      marker: 'original-context',
      getConfig<T>(name?: string): T {
        return (name ? getByPath(config, name) : config) as T
      }
    }

    const schemaContext = createSchemaOnlyUploaderContext(context, 'tcyun')

    expect(schemaContext.getConfig('picBed.tcyun')).toBeUndefined()
    expect(schemaContext.getConfig('picBed.tcyun.secretKey')).toBeUndefined()
    expect(schemaContext.getConfig('uploader.tcyun')).toBeUndefined()
    expect(schemaContext.getConfig('settings.proxy')).toBe('http://localhost:7890')
    expect(schemaContext.marker).toBe('original-context')

    expect(schemaContext.getConfig<ConfigRecord>('picBed')).toEqual({
      current: 'tcyun',
      github: {
        token: 'github-token'
      }
    })
    expect(schemaContext.getConfig<ConfigRecord>('uploader')).toEqual({
      github: {
        defaultId: 'config-2'
      }
    })
    expect(schemaContext.getConfig<ConfigRecord>()).toEqual({
      picBed: {
        current: 'tcyun',
        github: {
          token: 'github-token'
        }
      },
      uploader: {
        github: {
          defaultId: 'config-2'
        }
      },
      settings: {
        proxy: 'http://localhost:7890'
      }
    })

    expect(context.getConfig('picBed.tcyun')).toEqual({
      secretId: 'existing-secret-id',
      secretKey: 'existing-secret-key'
    })
  })
})
