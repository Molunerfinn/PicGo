import type {
  ProviderPluginChoice,
  ProviderPluginChoiceObject,
  ProviderPluginConfig,
} from "@/components/main/providers/types"

export interface MergePluginSchemaResult {
  schema: ProviderPluginConfig[]
  values: Record<string, unknown>
}

function isChoiceObject(choice: ProviderPluginChoice): choice is ProviderPluginChoiceObject {
  return typeof choice === "object" && choice !== null && "value" in choice
}

function getChoiceValue(choice: ProviderPluginChoice): unknown {
  return isChoiceObject(choice) ? choice.value : choice
}

function choicesInclude(choices: ProviderPluginChoice[] | undefined, value: unknown): boolean {
  if (!choices || choices.length === 0) {
    return false
  }

  return choices.some((choice) => {
    const choiceValue = getChoiceValue(choice)

    if (Array.isArray(value)) {
      return false
    }

    if (typeof value === "object" && value !== null) {
      return false
    }

    return choiceValue === value
  })
}

function selectedValuesValid(
  fieldChoices: ProviderPluginChoice[] | undefined,
  selectedValues: unknown[]
): boolean {
  if (!fieldChoices) {
    return false
  }

  const allowed = new Set(fieldChoices.map((choice) => getChoiceValue(choice)))
  return selectedValues.every((value) => allowed.has(value))
}

/**
 * Reconcile renderer form values against a freshly evaluated schema.
 *
 * Rules (see openspec/changes/add-reactive-plugin-config-gui/specs):
 * - Field still present, same type, current value still valid in new choices -> keep old value
 * - Field still present but current value not in new choices -> clear (set to undefined)
 * - Field still present but type changed -> reset to new default
 * - Field disappeared -> keep its old value in memory (orphan)
 * - New field appeared -> seed with new default
 */
export function mergePluginSchema(
  oldSchema: ProviderPluginConfig[],
  newSchema: ProviderPluginConfig[],
  oldValues: Record<string, unknown>
): MergePluginSchemaResult {
  const mergedValues: Record<string, unknown> = { ...oldValues }
  const oldByName = new Map(oldSchema.map((field) => [field.name, field] as const))

  const isValueValid = (field: ProviderPluginConfig, value: unknown): boolean => {
    if (value === undefined) {
      return false
    }

    if (field.type === "list") {
      return choicesInclude(field.choices, value)
    }

    if (field.type === "checkbox") {
      return Array.isArray(value) && selectedValuesValid(field.choices, value)
    }

    return true
  }

  for (const newField of newSchema) {
    const oldField = oldByName.get(newField.name)
    const oldValue = oldValues[newField.name]

    if (!oldField) {
      if (oldValue !== undefined && isValueValid(newField, oldValue)) {
        // Orphan restoration: previously-disappeared field came back with a valid value.
        continue
      }

      mergedValues[newField.name] = newField.default
      continue
    }

    if (oldField.type !== newField.type) {
      mergedValues[newField.name] = newField.default
      continue
    }

    // Untouched-default heuristic: if the user's current value equals the previous
    // evaluated default and the new default differs (because dependencies changed),
    // assume the field was never edited and apply the new default. Lets reactive
    // input/password fields update naturally without clobbering user-typed input.
    if (
      oldField.default !== undefined &&
      newField.default !== undefined &&
      oldField.default !== newField.default &&
      oldValue === oldField.default
    ) {
      mergedValues[newField.name] = newField.default
      continue
    }

    if (newField.type === "list") {
      if (oldValue === undefined || choicesInclude(newField.choices, oldValue)) {
        continue
      }

      mergedValues[newField.name] = undefined
      continue
    }

    if (newField.type === "checkbox") {
      if (!Array.isArray(oldValue)) {
        continue
      }

      if (selectedValuesValid(newField.choices, oldValue)) {
        continue
      }

      mergedValues[newField.name] = undefined
      continue
    }
  }

  return {
    schema: newSchema,
    values: mergedValues,
  }
}

/**
 * Determine which schema field names are still relevant for a save payload.
 * Used by panels to drop orphan keys before they hit `savePluginConfig`.
 */
export function filterValuesBySchema(
  schema: ProviderPluginConfig[],
  values: Record<string, unknown>
): Record<string, unknown> {
  const valid = new Set(schema.map((field) => field.name))
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(values)) {
    if (valid.has(key)) {
      result[key] = values[key]
    }
  }

  return result
}
