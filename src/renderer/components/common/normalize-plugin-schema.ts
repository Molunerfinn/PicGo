import type {
  ProviderFieldType,
  ProviderPluginChoice,
  ProviderPluginConfig,
} from "@/components/main/providers/types"

/**
 * 单一入口：把来自 main 进程的原始 plugin config schema 转成 renderer 用的
 * `ProviderPluginConfig[]`。Provider 页面和 Plugin 页面都使用这个函数，
 * 避免两条 IPC 通道在序列化逻辑上 drift（issue #1411 修复时 `dependsOn` 字段
 * 就因为 Provider 通道单独维护了一份白名单 normalize 而被吃掉）。
 *
 * 设计原则：
 * - 用 spread 透传未知字段，保证未来新增字段两条路径都能自动跟上
 * - 显式 normalize 已知字段（type / required / choices / dependsOn）
 * - 不去校验 default / choices 的函数式形态 —— 那些已经在 main 端被
 *   `evaluatePluginConfig` 求值成静态值了
 */

function resolveProviderFieldType(value: unknown): ProviderFieldType {
  if (
    value === "password" ||
    value === "list" ||
    value === "checkbox" ||
    value === "confirm"
  ) {
    return value
  }

  return "input"
}

function normalizeChoices(value: unknown): ProviderPluginChoice[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.map((choice) => {
    if (typeof choice === "string") {
      return choice
    }

    if (choice && typeof choice === "object") {
      const obj = choice as { name?: unknown; value?: unknown; checked?: unknown }
      return {
        name: typeof obj.name === "string" ? obj.name : undefined,
        value: obj.value,
        checked: typeof obj.checked === "boolean" ? obj.checked : undefined,
      }
    }

    return { value: choice }
  })
}

function normalizeDependsOn(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.filter((entry): entry is string => typeof entry === "string")
}

function asStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

export function normalizePluginConfigField(field: unknown): ProviderPluginConfig {
  const source = (field ?? {}) as Record<string, unknown>
  const rawName = source.name

  return {
    ...(source as object),
    name: typeof rawName === "string" ? rawName : "",
    type: resolveProviderFieldType(source.type),
    required: source.required === true,
    default: source.default,
    alias: asStringOrUndefined(source.alias),
    message: asStringOrUndefined(source.message),
    prefix: asStringOrUndefined(source.prefix),
    tips: asStringOrUndefined(source.tips),
    confirmText: asStringOrUndefined(source.confirmText),
    cancelText: asStringOrUndefined(source.cancelText),
    choices: normalizeChoices(source.choices),
    dependsOn: normalizeDependsOn(source.dependsOn),
  }
}

export function normalizePluginConfigSchema(
  fields: unknown
): ProviderPluginConfig[] {
  if (!Array.isArray(fields)) {
    return []
  }

  return fields.map(normalizePluginConfigField)
}
