import { describe, expect, it } from 'vitest'
import { normalizeWslPath } from '~/main/utils/normalizeWslPath'

const WslPrefix = 'wsl$'
const TestFileName = 'image.png'
const TestDistributions = ['test-distribution', 'alternate-distribution']

const createRelativeWslPath = (distribution: string, separator: '/' | '\\' = '\\'): string => {
  return [WslPrefix, distribution, TestFileName].join(separator)
}

const createAbsoluteWslPath = (distribution: string): string => `\\\\${createRelativeWslPath(distribution)}`

describe('main/utils/normalizeWslPath', () => {
  it.each([
    [createRelativeWslPath(TestDistributions[0]), createAbsoluteWslPath(TestDistributions[0])],
    [createRelativeWslPath(TestDistributions[1], '/'), createAbsoluteWslPath(TestDistributions[1])],
    [createRelativeWslPath(TestDistributions[0]).replaceAll('\\', '\\\\'), createAbsoluteWslPath(TestDistributions[0])]
  ])('adds the UNC prefix to %s', (filePath, expectedPath) => {
    expect(normalizeWslPath(filePath, 'win32')).toBe(expectedPath)
  })

  it('leaves an already absolute WSL UNC path unchanged', () => {
    const filePath = createAbsoluteWslPath(TestDistributions[0])

    expect(normalizeWslPath(filePath, 'win32')).toBe(filePath)
  })

  it('leaves non-WSL paths unchanged', () => {
    const filePath = 'not-a-wsl-path'

    expect(normalizeWslPath(filePath, 'win32')).toBe(filePath)
  })

  it('does not change WSL paths on non-Windows platforms', () => {
    const filePath = createRelativeWslPath(TestDistributions[0])

    expect(normalizeWslPath(filePath, 'linux')).toBe(filePath)
  })
})
