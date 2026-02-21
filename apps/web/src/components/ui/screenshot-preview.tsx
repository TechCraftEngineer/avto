import { cn } from "@qbs-autonaim/ui/utils"

interface ScreenshotPreviewProps {
  src: string
  alt: string
  className?: string
  /**
   * Применить горизонтальную маску (справа)
   * @default true
   */
  maskHorizontal?: boolean
  /**
   * Применить вертикальную маску (снизу)
   * @default true
   */
  maskVertical?: boolean
  /**
   * Ширина контейнера в процентах
   * @default 120
   */
  widthPercent?: number
  /**
   * Высота контейнера
   * @default "h-72 sm:h-[290px]"
   */
  height?: string
  /**
   * Позиция объекта
   * @default "object-left-top"
   */
  objectPosition?: string
}

export function ScreenshotPreview({
  src,
  alt,
  className,
  maskHorizontal = true,
  maskVertical = true,
  widthPercent = 120,
  height = "h-72 sm:h-[290px]",
  objectPosition = "object-left-top",
}: ScreenshotPreviewProps) {
  return (
    <div className={cn("relative overflow-hidden", height, className)}>
      <div
        className={cn(
          "size-full",
          maskHorizontal && "[mask-image:linear-gradient(90deg,black_80%,transparent)]",
        )}
      >
        <div
          className={cn(
            "size-full",
            maskVertical && "[mask-image:linear-gradient(black_70%,transparent)]",
          )}
        >
          <div className="relative h-full" style={{ width: `${widthPercent}%` }}>
            <img
              alt={alt}
              loading="lazy"
              decoding="async"
              className={cn(
                "blur-0 rounded-xl border-l border-t border-border object-cover",
                objectPosition,
              )}
              src={src}
              style={{ position: "absolute", height: "100%", width: "100%", inset: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
