import { describe, expect, it } from 'vitest'

import {
  filterValuesBySchema,
  mergePluginSchema,
} from '@/components/common/merge-plugin-schema'
import type { ProviderPluginConfig } from '@/components/main/providers/types'

const inputField = (name: string, defaultValue?: string): ProviderPluginConfig => ({
  name,
  type: 'input',
  required: false,
  default: defaultValue,
})

const listField = (
  name: string,
  choices: string[],
  defaultValue?: string
): ProviderPluginConfig => ({
  name,
  type: 'list',
  required: false,
  default: defaultValue,
  choices,
})

const checkboxField = (
  name: string,
  choices: string[]
): ProviderPluginConfig => ({
  name,
  type: 'checkbox',
  required: false,
  choices,
})

describe('mergePluginSchema', () => {
  it('keeps the old value when the list field is present and the value is still valid', () => {
    const oldSchema = [listField('uploader', ['github', 'gitee'])]
    const newSchema = [listField('uploader', ['github', 'gitee', 'qiniu'])]
    const result = mergePluginSchema(oldSchema, newSchema, { uploader: 'github' })

    expect(result.values.uploader).toBe('github')
  })

  it('clears the value when the field is present but the value no longer matches new choices', () => {
    const oldSchema = [listField('repo', ['a', 'b'])]
    const newSchema = [listField('repo', ['c', 'd'])]
    const result = mergePluginSchema(oldSchema, newSchema, { repo: 'a' })

    expect(result.values.repo).toBeUndefined()
  })

  it('resets to new default when the field type changes', () => {
    const oldSchema = [listField('mode', ['a', 'b'], 'a')]
    const newSchema: ProviderPluginConfig[] = [inputField('mode', 'fresh')]
    const result = mergePluginSchema(oldSchema, newSchema, { mode: 'a' })

    expect(result.values.mode).toBe('fresh')
  })

  it('keeps the orphan value in mergedValues when the field disappears', () => {
    const oldSchema = [listField('uploader', ['github']), inputField('branch')]
    const newSchema = [listField('uploader', ['gitee'])]
    const result = mergePluginSchema(oldSchema, newSchema, {
      uploader: 'github',
      branch: 'dev',
    })

    expect(result.values.branch).toBe('dev')
  })

  it('restores the orphan when the field re-appears after a later refresh', () => {
    const stage1OldSchema = [listField('uploader', ['github']), inputField('branch')]
    const stage1NewSchema = [listField('uploader', ['gitee'])]
    const intermediate = mergePluginSchema(stage1OldSchema, stage1NewSchema, {
      uploader: 'gitee',
      branch: 'dev',
    })

    const stage2OldSchema = stage1NewSchema
    const stage2NewSchema = [listField('uploader', ['github']), inputField('branch')]
    const final = mergePluginSchema(stage2OldSchema, stage2NewSchema, intermediate.values)

    expect(final.values.branch).toBe('dev')
  })

  it('replaces an input field value with the new default when the old value equals the old default (untouched)', () => {
    const oldSchema: ProviderPluginConfig[] = [
      inputField('apiVersion', 'v1'),
    ]
    const newSchema: ProviderPluginConfig[] = [
      inputField('apiVersion', 'v2'),
    ]

    const result = mergePluginSchema(oldSchema, newSchema, { apiVersion: 'v1' })

    expect(result.values.apiVersion).toBe('v2')
  })

  it('keeps an input field value when the user has clearly typed something different from the default', () => {
    const oldSchema: ProviderPluginConfig[] = [
      inputField('apiVersion', 'v1'),
    ]
    const newSchema: ProviderPluginConfig[] = [
      inputField('apiVersion', 'v2'),
    ]

    const result = mergePluginSchema(oldSchema, newSchema, { apiVersion: 'custom' })

    expect(result.values.apiVersion).toBe('custom')
  })

  it('seeds new fields with their default value', () => {
    const oldSchema = [listField('uploader', ['github'])]
    const newSchema = [listField('uploader', ['github']), inputField('branch', 'main')]
    const result = mergePluginSchema(oldSchema, newSchema, { uploader: 'github' })

    expect(result.values.branch).toBe('main')
  })

  it('handles a mixed scenario that triggers every rule at once', () => {
    const oldSchema = [
      // uploader: value 'github' was edited by the user (differs from old default 'gitee')
      listField('uploader', ['github', 'gitee'], 'gitee'),
      // repo: value 'a' equals old default — untouched-default rule should apply on refresh
      listField('repo', ['a', 'b'], 'a'),
      inputField('branch', 'main'),
      checkboxField('flags', ['x', 'y', 'z']),
    ]
    const newSchema = [
      listField('uploader', ['github'], 'github'),
      listField('repo', ['c', 'd'], 'c'),
      // 'branch' field gone, becoming an orphan
      checkboxField('flags', ['x', 'z']),
      listField('newField', ['p', 'q'], 'p'),
    ]

    const result = mergePluginSchema(oldSchema, newSchema, {
      uploader: 'github',
      repo: 'a',
      branch: 'dev',
      flags: ['x', 'y'],
    })

    // uploader: user-edited value still in new choices -> kept
    expect(result.values.uploader).toBe('github')
    // repo: value matched old default, defaults changed -> reset to new default
    expect(result.values.repo).toBe('c')
    // branch: orphan, kept in memory
    expect(result.values.branch).toBe('dev')
    // flags: 'y' no longer valid -> cleared
    expect(result.values.flags).toBeUndefined()
    // newField: brand new, seeded with new default
    expect(result.values.newField).toBe('p')
  })
})

describe('filterValuesBySchema', () => {
  it('drops orphan keys that are not in the current schema', () => {
    const schema = [listField('uploader', ['github']), inputField('branch')]
    const filtered = filterValuesBySchema(schema, {
      uploader: 'github',
      branch: 'main',
      legacy: 'should-be-dropped',
    })

    expect(filtered).toEqual({ uploader: 'github', branch: 'main' })
  })
})
