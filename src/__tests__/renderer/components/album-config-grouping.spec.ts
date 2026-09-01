import { describe, expect, it } from 'vitest'

import {
  buildAlbumConfigMap,
  buildAlbumPhotos,
  buildAlbumProviderFilters,
  filterAlbumImages,
  inferConfigIdFromUrl,
  unknownConfigKey,
  NavType,
  type AlbumConfigMap
} from '@/components/main/album/utils'

const S3_TYPE = 'aws-s3'
const MY_IMG_ID = 'config-my-img'
const COS_ID = 'config-cos'

const picBeds: IPicBedType[] = [
  { type: S3_TYPE, name: 'Amazon S3', visible: true },
  { type: 'smms', name: 'SM.MS', visible: true }
]

const configMap: AlbumConfigMap = {
  [S3_TYPE]: [
    { id: MY_IMG_ID, name: 'my-img', urlPrefix: 'https://myimg.example.org' },
    { id: COS_ID, name: 'cos', urlPrefix: 'https://cos.example.org' }
  ]
}

function s3Item (overrides: Partial<ImgInfo> = {}): ImgInfo {
  return {
    id: `db-${Math.random().toString(36).slice(2)}`,
    type: S3_TYPE,
    fileName: 'photo.png',
    imgUrl: 'https://myimg.example.org/img/2025/12/photo.png',
    ...overrides
  }
}

describe('inferConfigIdFromUrl', () => {
  it('matches a legacy item by its url prefix', () => {
    const id = inferConfigIdFromUrl(s3Item(), configMap[S3_TYPE])
    expect(id).toBe(MY_IMG_ID)
  })

  it('distinguishes configs that differ only by host', () => {
    const id = inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://cos.example.org/img/2025/12/photo.png' }),
      configMap[S3_TYPE]
    )
    expect(id).toBe(COS_ID)
  })

  it('prefers the longest matching prefix when configs share a host', () => {
    const configs = [
      { id: 'root', name: 'root', urlPrefix: 'https://cdn.example.org' },
      { id: 'nested', name: 'nested', urlPrefix: 'https://cdn.example.org/album' }
    ]
    const id = inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://cdn.example.org/album/photo.png' }),
      configs
    )
    expect(id).toBe('nested')
  })

  it('ignores a rewritten imgUrl in favour of originImgUrl', () => {
    const id = inferConfigIdFromUrl(
      s3Item({
        imgUrl: 'https://unrelated-cdn.example.net/photo.png',
        originImgUrl: 'https://cos.example.org/img/photo.png'
      }),
      configMap[S3_TYPE]
    )
    expect(id).toBe(COS_ID)
  })

  it('tolerates a trailing slash and mixed case in the configured prefix', () => {
    const id = inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://myimg.example.org/img/photo.png' }),
      [{ id: MY_IMG_ID, name: 'my-img', urlPrefix: 'https://MyImg.Example.org/' }]
    )
    expect(id).toBe(MY_IMG_ID)
  })

  it('returns empty string when no prefix matches', () => {
    const id = inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://somewhere-else.example.net/photo.png' }),
      configMap[S3_TYPE]
    )
    expect(id).toBe('')
  })

  it('returns empty string when the config has no url prefix configured', () => {
    const id = inferConfigIdFromUrl(s3Item(), [
      { id: 'no-prefix', name: 'no-prefix', urlPrefix: '' }
    ])
    expect(id).toBe('')
  })

  it('returns empty string when the item has no url at all', () => {
    const id = inferConfigIdFromUrl(
      { type: S3_TYPE, imgUrl: '', originImgUrl: '' },
      configMap[S3_TYPE]
    )
    expect(id).toBe('')
  })
})

describe('buildAlbumConfigMap', () => {
  it('derives options from the uploader config, resolving url prefix fields', () => {
    const map = buildAlbumConfigMap({
      [S3_TYPE]: {
        configList: [
          { _id: MY_IMG_ID, _configName: 'my-img', urlPrefix: 'https://myimg.example.org' },
          { _id: COS_ID, _configName: 'cos', customUrl: 'https://cos.example.org' }
        ]
      }
    })

    expect(map[S3_TYPE]).toEqual([
      { id: MY_IMG_ID, name: 'my-img', urlPrefix: 'https://myimg.example.org' },
      { id: COS_ID, name: 'cos', urlPrefix: 'https://cos.example.org' }
    ])
  })

  it('skips configs without an _id and picbeds with no usable configs', () => {
    const map = buildAlbumConfigMap({
      [S3_TYPE]: { configList: [{ _configName: 'legacy' }] },
      smms: { configList: [] }
    })

    expect(map).toEqual({})
  })

  it('falls back to the id when the config has no name', () => {
    const map = buildAlbumConfigMap({
      [S3_TYPE]: { configList: [{ _id: MY_IMG_ID }] }
    })

    expect(map[S3_TYPE][0].name).toBe(MY_IMG_ID)
    expect(map[S3_TYPE][0].urlPrefix).toBe('')
  })

  it('returns an empty map when there is no uploader config', () => {
    expect(buildAlbumConfigMap(undefined)).toEqual({})
  })
})

describe('buildAlbumPhotos config attribution', () => {
  it('uses the stored _configId when present, ignoring the url', () => {
    const photos = buildAlbumPhotos(
      [s3Item({
        _configId: COS_ID,
        imgUrl: 'https://myimg.example.org/img/photo.png'
      })],
      picBeds,
      configMap
    )

    expect(photos[0].configId).toBe(COS_ID)
    expect(photos[0].configName).toBe('cos')
  })

  it('infers the config for legacy items with no _configId', () => {
    const photos = buildAlbumPhotos([s3Item()], picBeds, configMap)

    expect(photos[0].configId).toBe(MY_IMG_ID)
    expect(photos[0].configName).toBe('my-img')
  })

  it('resolves the display name from live config, not the upload-time snapshot', () => {
    const photos = buildAlbumPhotos(
      [s3Item({ _configId: MY_IMG_ID, _configName: 'old-name' })],
      picBeds,
      configMap
    )

    expect(photos[0].configName).toBe('my-img')
  })

  it('keeps the snapshotted name when the config no longer exists', () => {
    const photos = buildAlbumPhotos(
      [s3Item({ _configId: 'deleted-config', _configName: 'deleted' })],
      picBeds,
      configMap
    )

    expect(photos[0].configId).toBe('deleted-config')
    expect(photos[0].configName).toBe('deleted')
  })

  it('leaves configId empty when nothing can be resolved', () => {
    const photos = buildAlbumPhotos(
      [s3Item({ imgUrl: 'https://somewhere-else.example.net/photo.png' })],
      picBeds,
      configMap
    )

    expect(photos[0].configId).toBe('')
  })

  it('works without a config map at all (cloud album path)', () => {
    const photos = buildAlbumPhotos([s3Item()], picBeds)

    expect(photos[0].configId).toBe('')
    expect(photos[0].configName).toBe('')
  })
})

describe('buildAlbumProviderFilters', () => {
  const images = buildAlbumPhotos(
    [
      s3Item({ imgUrl: 'https://myimg.example.org/a.png' }),
      s3Item({ imgUrl: 'https://myimg.example.org/b.png' }),
      s3Item({ imgUrl: 'https://cos.example.org/c.png' }),
      s3Item({ imgUrl: 'https://orphan.example.net/d.png' })
    ],
    picBeds,
    configMap
  )

  it('reports per-config counts and an unknown bucket', () => {
    const filters = buildAlbumProviderFilters(images, picBeds, configMap)
    const s3 = filters.find((item) => item.type === S3_TYPE)!

    expect(s3.count).toBe(4)
    expect(s3.configs).toEqual([
      { id: MY_IMG_ID, name: 'my-img', count: 2 },
      { id: COS_ID, name: 'cos', count: 1 }
    ])
    expect(s3.unknownCount).toBe(1)
  })

  it('reports zero counts for picbeds with no photos', () => {
    const filters = buildAlbumProviderFilters(images, picBeds, configMap)
    const smms = filters.find((item) => item.type === 'smms')!

    expect(smms.count).toBe(0)
    expect(smms.configs).toEqual([])
    expect(smms.unknownCount).toBe(0)
  })

  it('excludes hidden picbeds', () => {
    const filters = buildAlbumProviderFilters(
      images,
      [{ type: S3_TYPE, name: 'Amazon S3', visible: false }],
      configMap
    )

    expect(filters).toEqual([])
  })
})

describe('filterAlbumImages with config nav', () => {
  const images = buildAlbumPhotos(
    [
      s3Item({ fileName: 'a.png', imgUrl: 'https://myimg.example.org/a.png' }),
      s3Item({ fileName: 'b.png', imgUrl: 'https://cos.example.org/b.png' }),
      s3Item({ fileName: 'c.png', imgUrl: 'https://orphan.example.net/c.png' })
    ],
    picBeds,
    configMap
  )

  it('filters to a single config', () => {
    const result = filterAlbumImages(
      images,
      { type: NavType.Config, value: COS_ID, providerType: S3_TYPE },
      ''
    )

    expect(result.map((image) => image.name)).toEqual(['b.png'])
  })

  it('filters to the unknown bucket', () => {
    const result = filterAlbumImages(
      images,
      { type: NavType.Config, value: unknownConfigKey, providerType: S3_TYPE },
      ''
    )

    expect(result.map((image) => image.name)).toEqual(['c.png'])
  })

  it('returns nothing when providerType does not match the photo type', () => {
    const result = filterAlbumImages(
      images,
      { type: NavType.Config, value: MY_IMG_ID, providerType: 'smms' },
      ''
    )

    expect(result).toEqual([])
  })

  it('combines a config filter with the search query', () => {
    const result = filterAlbumImages(
      images,
      { type: NavType.Config, value: MY_IMG_ID, providerType: S3_TYPE },
      'b'
    )

    expect(result).toEqual([])
  })

  it('still filters by provider across all its configs', () => {
    const result = filterAlbumImages(
      images,
      { type: NavType.Provider, value: S3_TYPE },
      ''
    )

    expect(result).toHaveLength(3)
  })
})
