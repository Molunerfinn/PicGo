import { toast } from 'sonner'
import { GET_PICBED_CONFIG } from '#/events/constants'
import { IRPCActionType } from '~/universal/types/enum'
import { invokeRPC, sendToMain } from '@/utils/dataSender'
import { ipc } from '@/utils/bridge'

export interface ProviderSchemaResult {
  config: IPicGoPluginConfig[]
  name: string
}

export const providersAdapter = {
  async changeCurrentUploader (type: string, configName?: string) {
    const result = await invokeRPC<string>(IRPCActionType.CHANGE_CURRENT_UPLOADER, type, configName)
    if (!result.success) {
      throw new Error(result.error || 'Failed to change current uploader')
    }
    return result.data
  },
  async getProviderConfigList (type: string) {
    const result = await invokeRPC<IUploaderConfigItem>(IRPCActionType.GET_PICBED_CONFIG_LIST, type)
    if (!result.success) {
      throw new Error(result.error || 'Failed to load provider configs')
    }

    return result.data
  },
  async selectProviderConfig (type: string, configName: string) {
    const result = await invokeRPC<string>(IRPCActionType.SELECT_UPLOADER, type, configName)
    if (!result.success) {
      throw new Error(result.error || 'Failed to select provider config')
    }

    return result.data
  },
  async deleteProviderConfig (type: string, configName: string) {
    const result = await invokeRPC<IUploaderConfigItem>(IRPCActionType.DELETE_PICBED_CONFIG, type, configName)
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete provider config')
    }

    return result.data
  },
  async copyProviderConfig (type: string, configName: string, newConfigName: string) {
    const result = await invokeRPC<IUploaderConfigItem>(IRPCActionType.COPY_UPLOADER_CONFIG, type, configName, newConfigName)
    if (!result.success) {
      throw new Error(result.error || 'Failed to copy provider config')
    }

    return result.data
  },
  async saveProviderConfig (type: string, configId: string, values: IStringKeyMap) {
    const result = await invokeRPC<boolean>(IRPCActionType.UPDATE_UPLOADER_CONFIG, type, configId, values)
    if (!result.success) {
      throw new Error(result.error || 'Failed to save provider config')
    }

    if (result.data !== true) {
      throw new Error('Failed to save provider config')
    }
  },
  getProviderSchema (type: string): Promise<ProviderSchemaResult> {
    return new Promise((resolve, reject) => {
      const cleanup = ipc.once(GET_PICBED_CONFIG, (config: IPicGoPluginConfig[], name: string) => {
        resolve({ config, name })
      })

      try {
        sendToMain(GET_PICBED_CONFIG, type)
      } catch (error) {
        cleanup()
        reject(error)
      }
    })
  }
}

export function toastProviderError (error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  toast.error(message)
}
