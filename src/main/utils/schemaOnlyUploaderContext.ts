interface ConfigReadableContext {
  getConfig<T>(name?: string): T
}

type ConfigRecord = Record<string, unknown>

function isConfigRecord(value: unknown): value is ConfigRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function omitUploaderConfig(
  value: unknown,
  uploaderName: string
): unknown {
  if (!isConfigRecord(value)) {
    return value
  }

  const nextValue = { ...value }
  delete nextValue[uploaderName]
  return nextValue
}

function sanitizeFullConfig(value: unknown, uploaderName: string): unknown {
  if (!isConfigRecord(value)) {
    return value
  }

  const nextValue = { ...value }

  if ('picBed' in value) {
    nextValue.picBed = omitUploaderConfig(value.picBed, uploaderName)
  }

  if ('uploader' in value) {
    nextValue.uploader = omitUploaderConfig(value.uploader, uploaderName)
  }

  return nextValue
}

export function createSchemaOnlyUploaderContext<T extends ConfigReadableContext>(
  context: T,
  uploaderName: string
): T {
  const hiddenConfigPaths = [
    `picBed.${uploaderName}`,
    `uploader.${uploaderName}`
  ]

  const getConfig = <V>(name?: string): V => {
    if (
      name &&
      hiddenConfigPaths.some(
        (configPath) => name === configPath || name.startsWith(`${configPath}.`)
      )
    ) {
      return undefined as V
    }

    if (name === 'picBed' || name === 'uploader') {
      return omitUploaderConfig(
        context.getConfig<unknown>(name),
        uploaderName
      ) as V
    }

    if (name === undefined) {
      return sanitizeFullConfig(
        context.getConfig<unknown>(),
        uploaderName
      ) as V
    }

    return context.getConfig<V>(name)
  }

  return new Proxy(context, {
    get(target, property, receiver) {
      if (property === 'getConfig') {
        return getConfig
      }

      return Reflect.get(target, property, receiver)
    }
  })
}
