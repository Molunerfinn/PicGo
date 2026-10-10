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

  it('requires a path boundary so a sibling segment is not claimed', () => {
    const configs = [{ id: 'foo', name: 'foo', urlPrefix: 'https://cdn.example.org/foo' }]

    expect(inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://cdn.example.org/foobar/photo.png' }),
      configs
    )).toBe('')
    expect(inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://cdn.example.org/foo/photo.png' }),
      configs
    )).toBe('foo')
    expect(inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://cdn.example.org/foo' }),
      configs
    )).toBe('foo')
  })

  it('requires the host to match exactly', () => {
    const configs = [{ id: 'cdn', name: 'cdn', urlPrefix: 'https://cdn.example.org' }]

    expect(inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://cdn.example.org.other.net/photo.png' }),
      configs
    )).toBe('')
    expect(inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://cdn.example.org/photo.png' }),
      configs
    )).toBe('cdn')
  })

  it('ignores host case but keeps paths case-sensitive', () => {
    const configs = [
      { id: 'upper', name: 'upper', urlPrefix: 'https://cdn.example.org/Photos' },
      { id: 'lower', name: 'lower', urlPrefix: 'https://cdn.example.org/photos' }
    ]

    expect(inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://CDN.Example.ORG/Photos/a.png' }),
      configs
    )).toBe('upper')
    expect(inferConfigIdFromUrl(
      s3Item({ imgUrl: 'https://cdn.example.org/photos/a.png' }),
      configs
    )).toBe('lower')
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

  it('keeps photos from a deleted config reachable through a child node', () => {
    const withDeletedConfig = buildAlbumPhotos(
      [
        s3Item({ _configId: MY_IMG_ID, _configName: 'my-img' }),
        s3Item({ _configId: 'deleted-config', _configName: 'deleted' })
      ],
      picBeds,
      configMap
    )
    const s3 = buildAlbumProviderFilters(withDeletedConfig, picBeds, configMap)
      .find((item) => item.type === S3_TYPE)!

    expect(s3.count).toBe(2)
    expect(s3.configs).toEqual([
      { id: MY_IMG_ID, name: 'my-img', count: 1 },
      { id: COS_ID, name: 'cos', count: 0 },
      { id: 'deleted-config', name: 'deleted', count: 1 }
    ])
    expect(s3.unknownCount).toBe(0)
  })

  it('falls back to the config id when a deleted config has no snapshotted name', () => {
    const withDeletedConfig = buildAlbumPhotos(
      [s3Item({ _configId: 'deleted-config' })],
      picBeds,
      configMap
    )
    const s3 = buildAlbumProviderFilters(withDeletedConfig, picBeds, configMap)
      .find((item) => item.type === S3_TYPE)!

    expect(s3.configs).toEqual([
      { id: MY_IMG_ID, name: 'my-img', count: 0 },
      { id: COS_ID, name: 'cos', count: 0 },
      { id: 'deleted-config', name: 'deleted-config', count: 1 }
    ])
  })

  it('counts every photo of a provider exactly once across its children', () => {
    const mixed = buildAlbumPhotos(
      [
        s3Item({ _configId: MY_IMG_ID }),
        s3Item({ _configId: 'deleted-config', _configName: 'deleted' }),
        s3Item({ imgUrl: 'https://orphan.example.net/d.png' })
      ],
      picBeds,
      configMap
    )
    const s3 = buildAlbumProviderFilters(mixed, picBeds, configMap)
      .find((item) => item.type === S3_TYPE)!
    const reachable = s3.configs.reduce((total, config) => total + config.count, 0) + s3.unknownCount

    expect(reachable).toBe(s3.count)
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

  it('filters to a config that no longer exists', () => {
    const withDeletedConfig = buildAlbumPhotos(
      [
        s3Item({ fileName: 'a.png', _configId: MY_IMG_ID, _configName: 'my-img' }),
        s3Item({ fileName: 'd.png', _configId: 'deleted-config', _configName: 'deleted' })
      ],
      picBeds,
      configMap
    )
    const result = filterAlbumImages(
      withDeletedConfig,
      { type: NavType.Config, value: 'deleted-config', providerType: S3_TYPE },
      ''
    )

    expect(result.map((image) => image.name)).toEqual(['d.png'])
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
