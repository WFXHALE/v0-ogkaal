"use client"

import { useEffect, useState } from "react"

export function NoticeTicker() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const noticeText = (
    <span className="inline-flex items-center gap-2 px-8 text-sm text-muted-foreground shrink-0">
      <span className="text-[#FCD535] font-bold">NOTICE:</span>
      {" "}<span className="text-[#FCD535] font-semibold">USDT</span>{" "}
      buying and selling on this website is intended only for{" "}
      <span className="text-[#FCD535] font-semibold">Mentorship Students</span>{" "}
      and members of the OG KAAL TRADER community (Instagram / YouTube family).
      This service is not intended for the general public. If any individual outside this
      community uses this service and any legal consequences occur, the individual will be
      fully responsible for all actions and liabilities.
      <span className="mx-8 text-[#FCD535]/40">|</span>
    </span>
  )

  return (
    <div className="mt-20 w-full bg-[#0B0E11] border-b border-[#FCD535]/20 overflow-hidden py-2.5">
      <div
        className="flex whitespace-nowrap"
        style={{ animation: "ticker-scroll 35s linear infinite" }}
      >
        {noticeText}
        {noticeText}
      </div>
    </div>
  )
}
