"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />
}

function SkeletonVideoCard() {
  return (
    <article className="overflow-hidden rounded-xl border border-border/60 bg-background">
      <div className="aspect-video w-full animate-pulse bg-muted" />
      <div className="flex gap-3 p-4">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-3 pt-1">
          <SkeletonLine className="h-3.5 w-full" />
          <SkeletonLine className="h-3.5 w-4/5" />
          <SkeletonLine className="h-3 w-2/5" />
        </div>
      </div>
    </article>
  )
}

export function PageLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const previousPath = useRef<string | null>(null)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    previousPath.current = pathname
  }, [])

  useEffect(() => {
    if (previousPath.current === null || previousPath.current === pathname) return
    previousPath.current = pathname
    if (showTimer.current) clearTimeout(showTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)

    showTimer.current = setTimeout(() => {
      setVisible(true)
      hideTimer.current = setTimeout(() => setVisible(false), 700)
    }, 180)

    return () => {
      if (showTimer.current) clearTimeout(showTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden bg-background/95 px-4 pb-8 pt-20 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLine key={index} className="h-10 min-w-28 flex-1 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <SkeletonVideoCard />
          <SkeletonVideoCard />
        </div>
      </div>
    </div>
  )
}
