"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { MessageCircle, Instagram, Send, Youtube, Mail, Check } from "lucide-react"
import { saveSubmission } from "@/lib/admin-submissions"

const CONTACT_CARDS = [
  {
    platform: "WhatsApp",
    detail: "9541606164",
    href: "https://wa.me/919541606164",
    cta: "Chat on WhatsApp",
    Icon: MessageCircle,
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20 hover:border-green-500/50",
  },
  {
    platform: "Instagram",
    detail: "@ogkaaltrader",
    href: "https://www.instagram.com/ogkaaltrader",
    cta: "Open Instagram",
    Icon: Instagram,
    color: "text-pink-500",
    bg: "bg-pink-500/10 border-pink-500/20 hover:border-pink-500/50",
  },
  {
    platform: "Telegram",
    detail: "@ogkaaltrading",
    href: "https://t.me/ogkaaltrading",
    cta: "Join Telegram",
    Icon: Send,
    color: "text-sky-400",
    bg: "bg-sky-400/10 border-sky-400/20 hover:border-sky-400/50",
  },
  {
    platform: "YouTube",
    detail: "@ogkaaltrader",
    href: "https://youtube.com/@ogkaaltrader",
    cta: "Visit YouTube Channel",
    Icon: Youtube,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20 hover:border-red-500/50",
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await saveSubmission({
      type: "contact",
      name: formData.name,
      details: {
        email: formData.email,
        message: formData.message,
      },
    })
    setSubmitting(false)
    setSubmitted(true)
    setFormData({ name: "", email: "", message: "" })
  }

  const isFormValid = formData.name.trim() && formData.email.trim() && formData.message.trim()

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />

      <main className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">
              Contact OG KAAL TRADER
            </h1>
            <p className="text-muted-foreground text-lg text-pretty max-w-xl mx-auto leading-relaxed">
              If you have questions about mentorship, VIP access, or trading programs, you can reach us using the platforms below.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
            {CONTACT_CARDS.map(({ platform, detail, href, cta, Icon, color, bg }) => (
              <a
                key={platform}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${bg} group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-background/50`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">{platform}</p>
                  <p className="text-sm font-medium text-foreground truncate">{detail}</p>
                </div>
                <span className={`text-sm font-semibold ${color} shrink-0 group-hover:underline`}>
                  {cta}
                </span>
              </a>
            ))}
          </div>

          {/* Email + Form */}
          <div className="rounded-2xl bg-card border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">Swargakai@gmail.com</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground mb-6">Send a Message</h2>

            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-500" />
                </div>
                <p className="text-foreground font-semibold text-lg">Message Submitted</p>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Your message has been submitted successfully. Our team will contact you soon.
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Write your message here..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6"
                >
                  {submitting ? "Sending..." : "Send Message"}
                  <Mail className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
