// @vitest-environment jsdom

import { act, render } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  usePluginConfigRefresh,
  type RefreshConfigSchemaTarget,
} from '@/components/common/use-plugin-config-refresh'
import type { ProviderPluginConfig } from '@/components/main/providers/types'

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const inputField = (name: string): ProviderPluginConfig => ({
  name,
  type: 'input',
  required: false,
})

const listField = (
  name: string,
  choices: string[],
  dependsOn?: string[]
): ProviderPluginConfig => ({
  name,
  type: 'list',
  required: false,
  choices,
  dependsOn,
})

interface HarnessProps {
  initialSchema: ProviderPluginConfig[]
  initialValues: Record<string, unknown>
  target: RefreshConfigSchemaTarget
  fetchSchema: (
    target: RefreshConfigSchemaTarget,
    draftValues: Record<string, unknown>
  ) => Promise<ProviderPluginConfig[]>
  schemaRef: { current: ProviderPluginConfig[] }
  valuesRef: { current: Record<string, unknown> }
  setValuesRef: { current: ((values: Record<string, unknown>) => void) | null }
  setSchemaRef: { current: ((schema: ProviderPluginConfig[]) => void) | null }
  debounceMs?: number
}

function Harness({
  initialSchema,
  initialValues,
  target,
  fetchSchema,
  schemaRef,
  valuesRef,
  setValuesRef,
  setSchemaRef,
  debounceMs,
}: HarnessProps) {
  const [schema, setSchema] = useState<ProviderPluginConfig[]>(initialSchema)
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)

  useEffect(() => {
    schemaRef.current = schema
    valuesRef.current = values
    setSchemaRef.current = setSchema
    setValuesRef.current = setValues
  }, [schema, values, schemaRef, valuesRef, setSchemaRef, setValuesRef])

  usePluginConfigRefresh({
    enabled: true,
    target,
    currentSchema: schema,
    currentValues: values,
    fetchSchema,
    onSchemaUpdate: (nextSchema, nextValues) => {
      setSchema(nextSchema)
      setValues(nextValues)
    },
    debounceMs,
  })

  return null
}

const DEBOUNCE_TICK = 20

describe('usePluginConfigRefresh', () => {
  const makeRefs = () => ({
    schemaRef: { current: [] as ProviderPluginConfig[] },
    valuesRef: { current: {} as Record<string, unknown> },
    setSchemaRef: {
      current: null as ((schema: ProviderPluginConfig[]) => void) | null,
    },
    setValuesRef: {
      current: null as ((values: Record<string, unknown>) => void) | null,
    },
  })

  it('does not call fetchSchema when the change does not hit any dependsOn', async () => {
    const fetchSchema = vi.fn(async () => [] as ProviderPluginConfig[])
    const refs = makeRefs()

    render(
      <Harness
        initialSchema={[
          listField('uploader', ['github']),
          inputField('proxy'), // proxy is not referenced by anyone's dependsOn
        ]}
        initialValues={{ uploader: 'github', proxy: '' }}
        target={{ target: 'uploader', uploaderName: 'imgur' }}
        fetchSchema={fetchSchema}
        debounceMs={DEBOUNCE_TICK}
        {...refs}
      />
    )

    await act(async () => {
      refs.setValuesRef.current!({ uploader: 'github', proxy: 'http://proxy' })
    })
    await act(async () => {
      await wait(DEBOUNCE_TICK + 30)
    })

    expect(fetchSchema).not.toHaveBeenCalled()
  })

  it('calls fetchSchema after debounce when a dependsOn target changes', async () => {
    const fetchSchema = vi.fn(async () => [
      listField('uploader', ['github', 'gitee']),
      listField('repo', ['x', 'y'], ['uploader']),
    ])
    const refs = makeRefs()

    render(
      <Harness
        initialSchema={[
          listField('uploader', ['github', 'gitee']),
          listField('repo', ['a', 'b'], ['uploader']),
        ]}
        initialValues={{ uploader: 'github', repo: 'a' }}
        target={{ target: 'uploader', uploaderName: 'imgur' }}
        fetchSchema={fetchSchema}
        debounceMs={DEBOUNCE_TICK}
        {...refs}
      />
    )

    await act(async () => {
      refs.setValuesRef.current!({ uploader: 'gitee', repo: 'a' })
    })
    await act(async () => {
      await wait(DEBOUNCE_TICK + 30)
    })

    expect(fetchSchema).toHaveBeenCalledTimes(1)
    // 'repo' is a transitive dependent of the changed 'uploader' field, so it is
    // stripped from the payload to let main re-cascade its default.
    expect(fetchSchema).toHaveBeenCalledWith(
      { target: 'uploader', uploaderName: 'imgur' },
      { uploader: 'gitee' }
    )
  })

  it('coalesces multiple changes inside the debounce window into one call', async () => {
    const fetchSchema = vi.fn(async () => [] as ProviderPluginConfig[])
    const refs = makeRefs()

    render(
      <Harness
        initialSchema={[
          listField('uploader', ['github', 'gitee']),
          listField('repo', ['a'], ['uploader']),
        ]}
        initialValues={{ uploader: 'github', repo: 'a' }}
        target={{ target: 'uploader', uploaderName: 'imgur' }}
        fetchSchema={fetchSchema}
        debounceMs={DEBOUNCE_TICK}
        {...refs}
      />
    )

    await act(async () => {
      refs.setValuesRef.current!({ uploader: 'gitee', repo: 'a' })
    })
    await act(async () => {
      refs.setValuesRef.current!({ uploader: 'github', repo: 'a' })
    })
    await act(async () => {
      refs.setValuesRef.current!({ uploader: 'gitee', repo: 'a' })
    })
    await act(async () => {
      await wait(DEBOUNCE_TICK + 30)
    })

    expect(fetchSchema).toHaveBeenCalledTimes(1)
    expect(fetchSchema).toHaveBeenLastCalledWith(
      { target: 'uploader', uploaderName: 'imgur' },
      { uploader: 'gitee' }
    )
  })

  it('passes the appropriate payload shape for each refresh target', async () => {
    const initialSchema = [
      listField('uploader', ['github', 'gitee']),
      listField('repo', ['a'], ['uploader']),
    ]

    // Return a schema with the same dependsOn structure so subsequent edits still fire the hook.
    const fetchSchema = vi.fn(async () => initialSchema)

    const runWith = async (target: RefreshConfigSchemaTarget) => {
      const refs = makeRefs()

      render(
        <Harness
          initialSchema={initialSchema}
          initialValues={{ uploader: 'github', repo: 'a' }}
          target={target}
          fetchSchema={fetchSchema}
          debounceMs={DEBOUNCE_TICK}
          {...refs}
        />
      )

      await act(async () => {
        refs.setValuesRef.current!({ uploader: 'gitee', repo: 'a' })
      })
      await act(async () => {
        await wait(DEBOUNCE_TICK + 30)
      })
    }

    await runWith({ target: 'plugin', pluginFullName: 'picgo-plugin-x' })
    expect(fetchSchema).toHaveBeenLastCalledWith(
      { target: 'plugin', pluginFullName: 'picgo-plugin-x' },
      { uploader: 'gitee' }
    )

    await runWith({ target: 'transformer', pluginFullName: 'picgo-plugin-x' })
    expect(fetchSchema).toHaveBeenLastCalledWith(
      { target: 'transformer', pluginFullName: 'picgo-plugin-x' },
      { uploader: 'gitee' }
    )

    await runWith({ target: 'uploader', uploaderName: 'imgur' })
    expect(fetchSchema).toHaveBeenLastCalledWith(
      { target: 'uploader', uploaderName: 'imgur' },
      { uploader: 'gitee' }
    )
  })
})
