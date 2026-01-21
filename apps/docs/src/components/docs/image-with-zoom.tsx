"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageWithZoomProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function ImageWithZoom({
  src,
  alt,
  width,
  height,
  className,
}: ImageWithZoomProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="my-6 flex justify-center">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="cursor-zoom-in rounded-lg border border-border hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`Увеличить ${alt}`}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`max-w-full h-auto ${className || ""}`}
          />
        </button>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => setIsModalOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Увеличенное изображение"
        >
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-4xl font-light leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-2 z-10"
            aria-label="Закрыть"
          >
            ×
          </button>
          <Image
            src={src}
            alt={alt}
            width={2048}
            height={width ? Math.round((2048 * height) / width) : 1080}
            className="max-w-[95vw] max-h-[95vh] h-auto object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}
