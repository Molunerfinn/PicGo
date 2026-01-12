import { describe, expect, it } from 'vitest'

import { extractHttpUrlsFromText, parseNewlineSeparatedUrls } from '../../../universal/utils/common'

describe('universal/utils/common', () => {
  describe('parseNewlineSeparatedUrls', () => {
    it('parses newline-separated urls, trims lines, ignores empty lines, and de-duplicates', () => {
      const input = [
        'https://a.example/1.png',
        '',
        '  https://a.example/2.png  ',
        'https://a.example/1.png',
        'not-a-url'
      ].join('\n')

      const { urls, invalidLines } = parseNewlineSeparatedUrls(input)

      expect(urls).toEqual([
        'https://a.example/1.png',
        'https://a.example/2.png'
      ])
      expect(invalidLines).toEqual(['not-a-url'])
    })

    it('ignores uri-list comment lines when source is uri-list', () => {
      const input = [
        '# comment',
        'https://a.example/1.png',
        '# another comment',
        'https://a.example/2.png'
      ].join('\n')

      const { urls, invalidLines } = parseNewlineSeparatedUrls(input, { source: 'uri-list' })

      expect(urls).toEqual([
        'https://a.example/1.png',
        'https://a.example/2.png'
      ])
      expect(invalidLines).toEqual([])
    })

    it('supports NUL-separated drag payloads by normalizing to newlines', () => {
      const input = `https://a.example/1.png\u0000https://a.example/2.png`
      const { urls, invalidLines } = parseNewlineSeparatedUrls(input)

      expect(urls).toEqual([
        'https://a.example/1.png',
        'https://a.example/2.png'
      ])
      expect(invalidLines).toEqual([])
    })

    it('splits concatenated urls in a single line as a fallback', () => {
      const input = 'https://a.example/1.pnghttps://b.example/2.webphttps://c.example/3.png'
      const { urls, invalidLines } = parseNewlineSeparatedUrls(input)

      expect(urls).toEqual([
        'https://a.example/1.png',
        'https://b.example/2.webp',
        'https://c.example/3.png'
      ])
      expect(invalidLines).toEqual([])
    })

    it('does not split embedded urls in query parameters', () => {
      const input = 'https://example.com/?url=https://a.example/1.png'
      const { urls, invalidLines } = parseNewlineSeparatedUrls(input)

      expect(urls).toEqual(['https://example.com/?url=https://a.example/1.png'])
      expect(invalidLines).toEqual([])
    })
  })

  describe('extractHttpUrlsFromText', () => {
    it('extracts urls from mixed text, strips trailing punctuation, and de-duplicates', () => {
      const input = [
        'hello',
        'https://a.example/1.png)',
        'https://b.example/2.webp]',
        'https://a.example/1.png'
      ].join(' ')

      expect(extractHttpUrlsFromText(input)).toEqual([
        'https://a.example/1.png',
        'https://b.example/2.webp'
      ])
    })

    it('returns empty array when no urls are present', () => {
      expect(extractHttpUrlsFromText('no urls here')).toEqual([])
    })
  })
})

