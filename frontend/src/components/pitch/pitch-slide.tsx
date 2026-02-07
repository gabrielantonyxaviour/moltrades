"use client"

import { useEffect, useRef } from "react"

interface PitchSlideProps {
  id: string
  children: React.ReactNode
  onInView?: (id: string) => void
  className?: string
}

export function PitchSlide({ id, children, onInView, className = "" }: PitchSlideProps) {
  const ref = useRef<HTMLElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0")
          el.classList.remove("opacity-0", "translate-y-8")
          hasAnimated.current = true
          onInView?.(id)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [id, onInView])

  return (
    <section
      id={id}
      ref={ref}
      className={`min-h-screen snap-start flex items-center justify-center px-6 py-16 md:py-0 opacity-0 translate-y-8 transition-all duration-700 ease-out ${className}`}
    >
      <div className="max-w-5xl w-full mx-auto">
        {children}
      </div>
    </section>
  )
}
