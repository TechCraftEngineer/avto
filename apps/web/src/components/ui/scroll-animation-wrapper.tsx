"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface ScrollAnimationWrapperProps {
  children: ReactNode
  className?: string
  delay?: number
  animation?: "fade-up" | "fade-in" | "scale-in" | "slide-left" | "slide-right"
}

export function ScrollAnimationWrapper({
  children,
  className = "",
  delay = 0,
  animation = "fade-up",
}: ScrollAnimationWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const animationStyles: Record<string, string> = {
    "fade-up": isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    "fade-in": isVisible ? "opacity-100" : "opacity-0",
    "scale-in": isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
    "slide-left": isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
    "slide-right": isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8",
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${animationStyles[animation]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}