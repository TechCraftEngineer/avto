import { useQueryStates } from "nuqs"
import {
  createLoader,
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type inferParserType,
  type Options,
} from "nuqs/server"


import { FONTS } from "./fonts"
import { IconLibraryName, iconLibraries } from "shadcn/icons"
import { BASE_COLORS } from "../registry/base-colors"
import { BASES } from "../registry/bases"
import { BaseName, StyleName, ThemeName, FontValue, BaseColorName, MenuAccentValue, MENU_ACCENTS, MenuColorValue, MENU_COLORS, RadiusValue, RADII } from "../registry/config"
import { STYLES } from "../registry/styles"
import { THEMES } from "../registry/themes"

const designSystemSearchParams = {
  base: parseAsStringLiteral<BaseName>(BASES.map((b) => b.name)),
  item: parseAsString.withOptions({ shallow: true }),
  iconLibrary: parseAsStringLiteral<IconLibraryName>(
    Object.values(iconLibraries).map((i) => i.name)
  ),
  style: parseAsStringLiteral<StyleName>(STYLES.map((s) => s.name)),
  theme: parseAsStringLiteral<ThemeName>(THEMES.map((t) => t.name)),
  font: parseAsStringLiteral<FontValue>(FONTS.map((f) => f.value)),
  baseColor: parseAsStringLiteral<BaseColorName>(
    BASE_COLORS.map((b) => b.name)
  ),
  menuAccent: parseAsStringLiteral<MenuAccentValue>(
    MENU_ACCENTS.map((a) => a.value)
  ),
  menuColor: parseAsStringLiteral<MenuColorValue>(
    MENU_COLORS.map((m) => m.value)
  ),
  radius: parseAsStringLiteral<RadiusValue>(RADII.map((r) => r.name)),
  template: parseAsStringLiteral(["next", "start", "vite"] as const),
  size: parseAsInteger,
  custom: parseAsBoolean,
  search: parseAsString.withOptions({ shallow: true }),
}

export const loadDesignSystemSearchParams = createLoader(
  designSystemSearchParams
)

export const serializeDesignSystemSearchParams = createSerializer(
  designSystemSearchParams
)

export const useDesignSystemSearchParams = (options: Options = {}) =>
  useQueryStates(designSystemSearchParams, {
    shallow: true,
    history: "push",
    ...options,
  })

export type DesignSystemSearchParams = inferParserType<
  typeof designSystemSearchParams
>
