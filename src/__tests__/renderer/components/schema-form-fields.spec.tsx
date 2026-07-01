// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

import { SchemaFormFields } from '@/components/common/schema-form-fields'
import type { ProviderPluginConfig } from '@/components/main/providers/types'

const renderSchema = (
  schema: ProviderPluginConfig[],
  values: Record<string, unknown> = {},
  fieldErrors: Record<string, string | undefined> = {}
) => {
  const onValueChange = vi.fn()
  const utils = render(
    <SchemaFormFields
      schema={schema}
      values={values}
      fieldErrors={fieldErrors}
      onValueChange={onValueChange}
    />
  )
  return { ...utils, onValueChange }
}

describe('SchemaFormFields editor field', () => {
  it('renders a textarea for type: editor', () => {
    renderSchema([
      { name: 'script', type: 'editor', required: false }
    ])

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeTruthy()
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea.getAttribute('data-slot')).toBe('textarea')
  })

  it('binds the textarea value from values map', () => {
    renderSchema(
      [{ name: 'script', type: 'editor', required: false }],
      { script: 'line1\nline2\nline3' }
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe('line1\nline2\nline3')
  })

  it('fires onValueChange with the full multi-line value on input', () => {
    const { onValueChange } = renderSchema([
      { name: 'script', type: 'editor', required: false }
    ])

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'a\nb\nc' } })

    expect(onValueChange).toHaveBeenCalledWith('script', 'a\nb\nc')
  })

  it('uses field.message as placeholder, falling back to field.name', () => {
    const { rerender } = renderSchema([
      {
        name: 'script',
        type: 'editor',
        required: false,
        message: 'Enter multi-line script'
      }
    ])

    let textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.placeholder).toBe('Enter multi-line script')

    rerender(
      <SchemaFormFields
        schema={[{ name: 'script', type: 'editor', required: false }]}
        values={{}}
        fieldErrors={{}}
        onValueChange={vi.fn()}
      />
    )

    textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.placeholder).toBe('script')
  })

  it('marks textarea as invalid when fieldErrors contains the field', () => {
    renderSchema(
      [{ name: 'script', type: 'editor', required: true }],
      {},
      { script: 'required' }
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea.getAttribute('aria-invalid')).toBe('true')
  })

  it('renders a tooltip trigger when field.tips is provided', () => {
    renderSchema([
      {
        name: 'script',
        type: 'editor',
        required: false,
        alias: 'Compression script',
        tips: 'Supports **markdown** in the tooltip.'
      }
    ])

    const tooltipTrigger = screen.getByRole('button', {
      name: /Compression script tip/i
    })
    expect(tooltipTrigger).toBeTruthy()
  })

})

describe('SchemaFormFields unknown field type', () => {
  it('does not render any input control for an unrecognized type, label only', () => {
    renderSchema([
      {
        name: 'mystery',
        type: 'unknown-widget' as never,
        required: false,
        alias: 'Mystery field'
      }
    ])

    // The label is still rendered via FieldLabel
    expect(screen.getByText('Mystery field')).toBeTruthy()
    // None of the input controls render: no textbox, no combobox, no switch
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
  })
})
