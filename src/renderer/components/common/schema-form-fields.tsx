import { useState } from "react"
import DOMPurify from "dompurify"
import { ChevronDownIcon, EyeIcon, EyeOffIcon, HelpCircleIcon } from "lucide-react"
import { marked } from "marked"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"
import { useComboboxAnchor } from "@/components/ui/combobox-anchor"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { normalizePluginChoices } from "@/components/main/providers/utils"
import type { ProviderPluginConfig } from "@/components/main/providers/types"

export type SchemaFormValues = Record<string, unknown>
export type SchemaFieldErrorMap = Record<string, string | undefined>

interface SchemaFormFieldsProps {
  schema: ProviderPluginConfig[]
  values: SchemaFormValues
  fieldErrors?: SchemaFieldErrorMap
  onValueChange: (name: string, value: unknown) => void
}

interface CheckboxFieldProps {
  field: ProviderPluginConfig
  selectedValue: unknown
  isInvalid: boolean
  onValueChange: (name: string, value: unknown) => void
}

function renderSanitizedTips(markdown: string) {
  const parsed = marked.parse(markdown)
  const html = typeof parsed === "string" ? parsed : markdown
  return DOMPurify.sanitize(html)
}

function CheckboxField({
  field,
  selectedValue,
  isInvalid,
  onValueChange,
}: CheckboxFieldProps) {
  const { t } = useTranslation()
  const anchorRef = useComboboxAnchor()
  const [open, setOpen] = useState(false)
  const choices = normalizePluginChoices(field.choices)
  const optionValueMap = new Map(
    choices.map((choice) => [String(choice.value), choice.value] as const)
  )
  const options = choices.map((choice) => String(choice.value))
  const selectedValues = Array.isArray(selectedValue)
    ? selectedValue.map((value) => String(value))
    : []

  const getLabelByValue = (value: string) => {
    const matched = choices.find((choice) => String(choice.value) === value)
    return matched?.label ?? value
  }

  return (
    <Combobox
      multiple
      items={options}
      value={selectedValues}
      onValueChange={(nextValue) => {
        const next = Array.isArray(nextValue)
          ? nextValue.map((value) => optionValueMap.get(String(value)) ?? value)
          : []
        onValueChange(field.name, next)
      }}
      open={open}
      onOpenChange={setOpen}
    >
      <ComboboxChips
        ref={anchorRef}
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <ComboboxValue>
          {(currentValue) => {
            const selectedItems = Array.isArray(currentValue)
              ? currentValue.map((value) => String(value))
              : []

            if (selectedItems.length === 0) {
              return (
                <span className="text-muted-foreground text-sm">
                  {field.message || field.name}
                </span>
              )
            }

            return selectedItems.map((value) => (
              <ComboboxChip key={value}>{getLabelByValue(value)}</ComboboxChip>
            ))
          }}
        </ComboboxValue>
        <ComboboxChipsInput
          aria-label={field.alias || field.name}
          aria-invalid={isInvalid}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="ml-auto shrink-0"
          onClick={(event) => {
            event.preventDefault()
            setOpen((prev) => !prev)
          }}
        >
          <ChevronDownIcon className="size-4" />
        </Button>
      </ComboboxChips>

      <ComboboxContent anchor={anchorRef} className="w-(--anchor-width)">
        <ComboboxEmpty>{t("NO_OPTIONS_FOUND")}</ComboboxEmpty>
        <ComboboxList>
          {(item) => {
            const value = String(item)
            return (
              <ComboboxItem key={value} value={value}>
                {getLabelByValue(value)}
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function SchemaFormFields({
  schema,
  values,
  fieldErrors = {},
  onValueChange,
}: SchemaFormFieldsProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>(
    {}
  )

  return (
    <div className="space-y-5">
      {schema.map((field) => {
        const value = values[field.name]
        const choices = normalizePluginChoices(field.choices)
        const optionValueMap = new Map(
          choices.map((choice) => [String(choice.value), choice.value] as const)
        )
        const isPasswordVisible = Boolean(visiblePasswords[field.name])
        const fieldError = fieldErrors[field.name]
        const isInvalid = Boolean(fieldError)

        // For list fields: pre-compute the string-form value and whether it
        // matches any choice, so the Select renders the placeholder when the
        // current value is stale (e.g. after a cascade refresh removed the
        // option). The `choicesKey` is appended to the Select's React key so
        // the component remounts when the available choices change, dropping
        // any internal "active item" state that points at a now-removed
        // SelectItem (which is what blocks the dropdown from opening).
        const listStringValue =
          value === null || value === undefined ? "" : String(value)
        const listValueMatchesChoice = choices.some(
          (choice) => String(choice.value) === listStringValue
        )
        const listSelectValue = listValueMatchesChoice ? listStringValue : ""
        const choicesKey = choices
          .map((choice) => String(choice.value))
          .join("|")

        return (
          <Field key={field.name} data-invalid={isInvalid}>
            <FieldLabel className="flex items-center gap-2">
              <span>
                {field.alias || field.name}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </span>
              {field.tips ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground inline-flex cursor-help"
                      aria-label={`${field.alias || field.name} tip`}
                    >
                      <HelpCircleIcon className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72 [&_a]:underline [&_a]:underline-offset-2">
                    <div
                      className="space-y-1 text-xs"
                      dangerouslySetInnerHTML={{
                        __html: renderSanitizedTips(field.tips),
                      }}
                    />
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </FieldLabel>

            {field.type === "input" && (
              <Input
                value={String(value ?? "")}
                placeholder={field.message || field.name}
                aria-invalid={isInvalid}
                onChange={(event) => onValueChange(field.name, event.target.value)}
              />
            )}

            {field.type === "password" && (
              <div className="relative">
                <Input
                  value={String(value ?? "")}
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder={field.message || field.name}
                  className="pr-10"
                  aria-invalid={isInvalid}
                  onChange={(event) => onValueChange(field.name, event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  onClick={() => {
                    setVisiblePasswords((prev) => ({
                      ...prev,
                      [field.name]: !prev[field.name],
                    }))
                  }}
                >
                  {isPasswordVisible ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </Button>
              </div>
            )}

            {field.type === "list" && (
              <Select
                key={`${field.name}::${choicesKey}`}
                value={listSelectValue}
                onValueChange={(nextValue) => {
                  if (nextValue === null || nextValue === undefined || nextValue === "") {
                    onValueChange(field.name, undefined)
                    return
                  }
                  const resolvedValue = String(nextValue)
                  onValueChange(
                    field.name,
                    optionValueMap.get(resolvedValue) ?? resolvedValue
                  )
                }}
              >
                <SelectTrigger className="w-full" aria-invalid={isInvalid}>
                  <SelectValue placeholder={field.message || field.name} />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((choice) => (
                    <SelectItem
                      key={`${field.name}-${String(choice.value)}`}
                      value={String(choice.value)}
                    >
                      {choice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === "checkbox" && (
              <CheckboxField
                field={field}
                selectedValue={value}
                isInvalid={isInvalid}
                onValueChange={onValueChange}
              />
            )}

            {field.type === "confirm" && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <span className="text-sm">
                  {value ? field.confirmText || "yes" : field.cancelText || "no"}
                </span>
                <Switch
                  checked={value === true}
                  aria-invalid={isInvalid}
                  onCheckedChange={(checked) => onValueChange(field.name, checked)}
                />
              </div>
            )}

            {field.type === "editor" && (
              <Textarea
                className="resize-y"
                value={String(value ?? "")}
                placeholder={field.message || field.name}
                aria-invalid={isInvalid}
                onChange={(event) => onValueChange(field.name, event.target.value)}
              />
            )}

            {fieldError ? <FieldError>{fieldError}</FieldError> : null}
          </Field>
        )
      })}
    </div>
  )
}
