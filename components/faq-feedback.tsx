"use client"

import { useState } from "react"
import { Star, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FaqFeedback() {
  const [choice, setChoice] = useState<"yes" | "no" | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="mt-12 p-6 rounded-xl bg-card border border-border text-center">
        <p className="text-sm font-medium text-foreground">Thank you for your feedback!</p>
      </div>
    )
  }

  return (
    <div className="mt-12 p-6 rounded-xl bg-card border border-border">
      <p className="text-sm font-semibold text-foreground mb-4">Was this helpful?</p>

      {choice === null && (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setChoice("yes")}
            className="border-green-500/40 text-green-500 hover:bg-green-500/10"
          >
            Yes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setChoice("no")}
            className="border-red-500/40 text-red-500 hover:bg-red-500/10"
          >
            No
          </Button>
        </div>
      )}

      {choice === "yes" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Rate your experience</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5"
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-[#FCD535] text-[#FCD535]"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Leave a comment (optional)</p>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
              placeholder="Tell us what was helpful..."
            />
          </div>
          <Button
            size="sm"
            onClick={() => setSubmitted(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Submit Feedback
            <Send className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      )}

      {choice === "no" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-sky-400/10 border border-sky-400/20">
          <Send className="w-4 h-4 text-sky-400 shrink-0" />
          <p className="text-sm text-foreground">
            Contact on{" "}
            <a
              href="https://t.me/ogkaaltrading"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 underline underline-offset-2 font-medium"
            >
              Telegram
            </a>{" "}
            for more details.
          </p>
        </div>
      )}
    </div>
  )
}
