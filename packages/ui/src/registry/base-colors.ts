import { THEMES } from "./themes"

export const BASE_COLORS = THEMES.filter((theme) =>
  ["neutral", "stone", "zinc", "gray"].includes(theme.name)
)

export type BaseColor = (typeof BASE_COLORS)[number]
