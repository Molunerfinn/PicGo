import { useEffect, useRef } from "react"

import type { ProviderPluginConfig } from "@/components/main/providers/types"
import {
  filterValuesBySchema,
  mergePluginSchema,
} from "./merge-plugin-schema"

export type RefreshConfigSchemaTarget =
  | { target: "plugin"; pluginFullName: string }
  | { target: "transformer"; pluginFullName: string }
  | { target: "uploader"; uploaderName: string }

export interface UsePluginConfigRefreshOptions {
  /**
   * Master gate. When false, the hook resets its diff baseline and skips all
   * cascade work — callers use this to suppress refreshes while the panel is
   * still hydrating (no stable baseline to diff against). When the gate flips
   * to true the hook captures the next render's values as the new baseline.
   */
  enabled: boolean
  target: RefreshConfigSchemaTarget
  currentSchema: ProviderPluginConfig[]
  currentValues: Record<string, unknown>
  fetchSchema: (
    target: RefreshConfigSchemaTarget,
    draftValues: Record<string, unknown>
  ) => Promise<ProviderPluginConfig[]>
  onSchemaUpdate: (
    nextSchema: ProviderPluginConfig[],
    nextValues: Record<string, unknown>
  ) => void
  debounceMs?: number
}

function collectDependencyEdges(
  schema: ProviderPluginConfig[]
): Map<string, Set<string>> {
  const triggerToDependents = new Map<string, Set<string>>()

  for (const field of schema) {
    if (!field.dependsOn || field.dependsOn.length === 0) {
      continue
    }

    for (const triggerName of field.dependsOn) {
      let dependents = triggerToDependents.get(triggerName)
      if (!dependents) {
        dependents = new Set()
        triggerToDependents.set(triggerName, dependents)
      }
      dependents.add(field.name)
    }
  }

  return triggerToDependents
}

function collectTransitiveDependents(
  graph: Map<string, Set<string>>,
  seeds: string[]
): Set<string> {
  const visited = new Set<string>()
  const queue = [...seeds]

  while (queue.length > 0) {
    const current = queue.shift()!
    const dependents = graph.get(current)
    if (!dependents) {
      continue
    }

    for (const dependent of dependents) {
      if (visited.has(dependent)) {
        continue
      }
      visited.add(dependent)
      queue.push(dependent)
    }
  }

  return visited
}

/**
 * Strip values for fields that are transitively dependent on the changed keys
 * so the main-side evaluation re-computes their defaults/choices off the new
 * upstream values. Without this, downstream `choices(answers)` would see the
 * pre-change value and return stale options.
 *
 * Preservation of user-edited values is handled later by `mergePluginSchema`:
 * - untouched defaults that change automatically follow the new default
 * - values that are still valid in the new `choices` stay
 * - values that no longer match the new `choices` are cleared
 */
function dropStaleDependents(
  schema: ProviderPluginConfig[],
  values: Record<string, unknown>,
  changedKeys: string[]
): Record<string, unknown> {
  const graph = collectDependencyEdges(schema)
  const dependents = collectTransitiveDependents(graph, changedKeys)

  if (dependents.size === 0) {
    return values
  }

  const result: Record<string, unknown> = {}

  for (const key of Object.keys(values)) {
    if (dependents.has(key)) {
      continue
    }
    result[key] = values[key]
  }

  return result
}

function diffChangedKeys(
  previous: Record<string, unknown>,
  current: Record<string, unknown>
): string[] {
  const changed: string[] = []
  const keys = new Set([...Object.keys(previous), ...Object.keys(current)])

  for (const key of keys) {
    if (previous[key] !== current[key]) {
      changed.push(key)
    }
  }

  return changed
}

const DEFAULT_DEBOUNCE_MS = 100

/**
 * Subscribe to renderer form value changes and trigger main-side schema
 * re-evaluation when fields with `dependsOn` are touched.
 *
 * The hook is intentionally agnostic to whether the schema belongs to a
 * plugin, transformer, or uploader — the caller passes the appropriate
 * `target` discriminator and `fetchSchema` adapter.
 */
export function usePluginConfigRefresh({
  enabled,
  target,
  currentSchema,
  currentValues,
  fetchSchema,
  onSchemaUpdate,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UsePluginConfigRefreshOptions) {
  const previousValuesRef = useRef<Record<string, unknown> | null>(null)
  const timerRef = useRef<number | null>(null)
  const inflightTokenRef = useRef(0)

  const targetKey =
    target.target === "uploader" ? target.uploaderName : target.pluginFullName

  // Reset the diff baseline whenever:
  // - the refresh target changes (different uploader / plugin)
  // - the schema reference changes (initial load injecting storedSchema, or
  //   our own cascade response replacing it with liveSchema)
  useEffect(() => {
    previousValuesRef.current = null
  }, [target.target, targetKey, currentSchema])

  useEffect(() => {
    if (!enabled) {
      previousValuesRef.current = null
      return
    }

    if (previousValuesRef.current === null) {
      // Defer capturing the baseline until the form has been fully populated
      // by the parent (every field name in the schema is present as a key in
      // currentValues). The parent additionally gates `enabled` on its own
      // hydration state, but this is a defensive belt-and-braces check in
      // case currentValues hasn't caught up to the latest schema yet.
      const formReady =
        currentSchema.length > 0 &&
        currentSchema.every((field) => field.name in currentValues)
      if (!formReady) {
        return
      }
      previousValuesRef.current = currentValues
      return
    }

    const previous = previousValuesRef.current
    const changedKeys = diffChangedKeys(previous, currentValues)
    previousValuesRef.current = currentValues

    if (changedKeys.length === 0) {
      return
    }

    const triggerToDependents = collectDependencyEdges(currentSchema)
    const hits = new Set<string>()

    for (const key of changedKeys) {
      const dependents = triggerToDependents.get(key)
      if (!dependents) {
        continue
      }

      for (const dependent of dependents) {
        hits.add(dependent)
      }
    }

    if (hits.size === 0) {
      return
    }

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }

    const payloadValues = dropStaleDependents(currentSchema, currentValues, changedKeys)

    timerRef.current = window.setTimeout(async () => {
      timerRef.current = null
      const token = ++inflightTokenRef.current
      try {
        const nextSchema = await fetchSchema(target, payloadValues)
        if (token !== inflightTokenRef.current) {
          return
        }

        const merged = mergePluginSchema(currentSchema, nextSchema, currentValues)
        onSchemaUpdate(merged.schema, merged.values)
      } catch (error) {
        console.warn("[plugin-config] refresh failed", error)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    enabled,
    target,
    currentSchema,
    currentValues,
    fetchSchema,
    onSchemaUpdate,
    debounceMs,
  ])
}

export { filterValuesBySchema }
