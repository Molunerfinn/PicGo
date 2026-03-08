export interface UtilityWindowBaseline {
  width: number
  height: number
}

export const UTILITY_WINDOW_BASELINES = {
  tray: { width: 196, height: 350 },
  mini: { width: 64, height: 64 },
  rename: { width: 300, height: 175 },
  toolbox: { width: 800, height: 450 },
} as const satisfies Record<string, UtilityWindowBaseline>

export type UtilityWindowPage = keyof typeof UTILITY_WINDOW_BASELINES
