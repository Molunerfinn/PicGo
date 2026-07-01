/**
 * Shared cascade-test fixture: a region → endpoint → bucket schema that
 * mirrors the picgo-plugin-test reactive plugin. Used by both the hook-level
 * cascade tests and the panel-level real-component tests.
 */

export const REGION_ENDPOINTS: Record<string, string[]> = {
  us: ['s3.us-east-1', 's3.us-west-2'],
  eu: ['s3.eu-west-1', 's3.eu-central-1'],
  asia: ['s3.ap-southeast-1', 's3.ap-northeast-1'],
}

export const ENDPOINT_BUCKETS: Record<string, string[]> = {
  's3.us-east-1': ['us-east-prod', 'us-east-staging'],
  's3.us-west-2': ['us-west-prod'],
  's3.eu-west-1': ['eu-west-prod', 'eu-west-archive'],
  's3.eu-central-1': ['eu-central-prod'],
  's3.ap-southeast-1': ['asia-sg-prod', 'asia-sg-staging'],
  's3.ap-northeast-1': ['asia-tk-prod'],
}

export const buildCascadeRawSchema = (storedRegion?: string): unknown[] => [
  {
    name: 'region',
    type: 'list',
    required: true,
    alias: 'Region',
    default: storedRegion || 'us',
    choices: ['us', 'eu', 'asia'],
  },
  {
    name: 'endpoint',
    type: 'list',
    required: true,
    alias: 'Endpoint',
    dependsOn: ['region'],
    default: (answers: Record<string, unknown>) => {
      const region = (answers.region as string) || 'us'
      return REGION_ENDPOINTS[region]?.[0]
    },
    choices: (answers: Record<string, unknown>) => {
      const region = (answers.region as string) || 'us'
      return REGION_ENDPOINTS[region] || []
    },
  },
  {
    name: 'bucket',
    type: 'list',
    required: true,
    alias: 'Bucket',
    dependsOn: ['endpoint'],
    choices: (answers: Record<string, unknown>) => {
      const endpoint = answers.endpoint as string
      return ENDPOINT_BUCKETS[endpoint] || []
    },
  },
  {
    name: 'pathPrefix',
    type: 'input',
    required: false,
    alias: 'Path prefix',
    default: '',
  },
]
