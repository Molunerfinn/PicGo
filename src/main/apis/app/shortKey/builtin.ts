import { SHORTKEY_COMMAND_UPLOAD } from '../../core/bus/constants'
import { uploadClipboardFiles } from '../uploader/apis'

export const BuiltinShortKeyMap: Record<string, FN> = {
  [SHORTKEY_COMMAND_UPLOAD]: uploadClipboardFiles
}
