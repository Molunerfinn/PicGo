// @vitest-environment jsdom

import { act, render } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { evaluatePluginConfig } from 'picgo'

import {
  usePluginConfigRefresh,
  type RefreshConfigSchemaTarget,
} from '@/components/common/use-plugin-config-refresh'
import type { ProviderPluginConfig } from '@/components/main/providers/types'
import {
  REGION_ENDPOINTS,
  ENDPOINT_BUCKETS,
  buildCascadeRawSchema,
} from '../fixtures/cascade-fixture'

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const DEBOUNCE = 20
const flushCascade = () => act(async () => { await wait(DEBOUNCE + 30) })

/**
 * Hook-level cascade behavior. The "page-refresh saved-config preservation"
 * tests previously here were moved to `provider-config-panel.spec.tsx` —
 * they're now covered by mounting the real component, so the harness
 * duplicates were removed. The tests below isolate cascade semantics that
 * don't depend on the panel: schema diffing, default propagation, and the
 * merger's stale-clearing rules.
 */

const buildInitialSchema = (): ProviderPluginConfig[] => {
  return evaluatePluginConfig(
    buildCascadeRawSchema() as Parameters<typeof evaluatePluginConfig>[0]
  ) as unknown as ProviderPluginConfig[]
}

interface HarnessState {
  schema: ProviderPluginConfig[]
  values: Record<string, unknown>
}

function Harness({
  schemaRef,
  setValuesRef,
}: {
  schemaRef: { current: HarnessState | null }
  setValuesRef: {
    current: ((values: Record<string, unknown>) => void) | null
  }
}) {
  const initialSchema = buildInitialSchema()
  const initialValues: Record<string, unknown> = {}
  for (const field of initialSchema) {
    if (field.default !== undefined) {
      initialValues[field.name] = field.default
    }
  }

  const [schema, setSchema] = useState<ProviderPluginConfig[]>(initialSchema)
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)

  useEffect(() => {
    schemaRef.current = { schema, values }
    setValuesRef.current = setValues
  }, [schema, values, schemaRef, setValuesRef])

  const target: RefreshConfigSchemaTarget = {
    target: 'uploader',
    uploaderName: 'picgo-plugin-test',
  }

  usePluginConfigRefresh({
    enabled: true,
    target,
    currentSchema: schema,
    currentValues: values,
    fetchSchema: async (_target, draftValues) =>
      evaluatePluginConfig(
        buildCascadeRawSchema() as Parameters<typeof evaluatePluginConfig>[0],
        draftValues
      ) as unknown as ProviderPluginConfig[],
    onSchemaUpdate: (nextSchema, nextValues) => {
      setSchema(nextSchema)
      setValues(nextValues)
    },
    debounceMs: DEBOUNCE,
  })

  return null
}

function setupHarness() {
  const schemaRef: { current: HarnessState | null } = { current: null }
  const setValuesRef: {
    current: ((values: Record<string, unknown>) => void) | null
  } = { current: null }
  render(<Harness schemaRef={schemaRef} setValuesRef={setValuesRef} />)
  return { schemaRef, setValuesRef }
}

describe('cascade hook behavior (region -> endpoint -> bucket)', () => {
  it('seeds initial form with the first defaults from each cascade level', () => {
    const { schemaRef } = setupHarness()

    const state = schemaRef.current!
    expect(state.values.region).toBe('us')
    expect(state.values.endpoint).toBe('s3.us-east-1')

    const bucketField = state.schema.find((f) => f.name === 'bucket')!
    expect(bucketField.choices).toEqual(ENDPOINT_BUCKETS['s3.us-east-1'])
  })

  it('cascades both endpoint and bucket when region changes (untouched values)', async () => {
    const { schemaRef, setValuesRef } = setupHarness()

    // Pretend the user picked the initial defaults
    await act(async () => {
      setValuesRef.current!({
        region: 'us',
        endpoint: 's3.us-east-1',
        bucket: 'us-east-prod',
        pathPrefix: '',
      })
    })
    await flushCascade()

    // Switch region to 'asia' — endpoint/bucket are stale
    await act(async () => {
      setValuesRef.current!({
        region: 'asia',
        endpoint: 's3.us-east-1',
        bucket: 'us-east-prod',
        pathPrefix: '',
      })
    })
    await flushCascade()

    const state = schemaRef.current!
    expect(state.values.endpoint).toBe(REGION_ENDPOINTS.asia[0])
    expect(state.values.bucket).toBeUndefined() // not in new bucket choices

    const endpointField = state.schema.find((f) => f.name === 'endpoint')!
    expect(endpointField.choices).toEqual(REGION_ENDPOINTS.asia)

    const bucketField = state.schema.find((f) => f.name === 'bucket')!
    expect(bucketField.choices).toEqual(ENDPOINT_BUCKETS[REGION_ENDPOINTS.asia[0]])
  })

  it('clears user-edited values when they no longer match new choices', async () => {
    const { schemaRef, setValuesRef } = setupHarness()

    // User explicitly picks the second us endpoint and matching bucket
    await act(async () => {
      setValuesRef.current!({
        region: 'us',
        endpoint: 's3.us-west-2',
        bucket: 'us-west-prod',
        pathPrefix: '',
      })
    })
    await flushCascade()

    // Switch region to 'asia' — both endpoint and bucket are now invalid
    await act(async () => {
      setValuesRef.current!({
        region: 'asia',
        endpoint: 's3.us-west-2',
        bucket: 'us-west-prod',
        pathPrefix: '',
      })
    })
    await flushCascade()

    const state = schemaRef.current!
    expect(state.values.endpoint).toBeUndefined()
    expect(state.values.bucket).toBeUndefined()
  })
})
