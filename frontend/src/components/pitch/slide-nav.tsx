"use client"

interface SlideNavProps {
  slides: { id: string; label: string }[]
  activeSlide: string
}

export function SlideNav({ slides, activeSlide }: SlideNavProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-2.5">
      {slides.map((slide) => (
        <button
          key={slide.id}
          onClick={() => scrollTo(slide.id)}
          className="group relative flex items-center justify-end"
          aria-label={slide.label}
        >
          <span className="absolute right-5 px-2 py-1 rounded text-xs font-body bg-card/90 border border-border/50 text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {slide.label}
          </span>
          <span
            className={`block rounded-full transition-all duration-300 ${
              activeSlide === slide.id
                ? "w-3 h-3 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                : "w-2 h-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
            }`}
          />
        </button>
      ))}
    </nav>
  )
}
