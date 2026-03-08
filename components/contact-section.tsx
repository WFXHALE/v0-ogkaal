"use client"

import { Mail, Send, MessageCircle, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const contactMethods = [
  {
    icon: Mail,
    label: "Email",
    value: "contact@ogcalltrader.com",
    href: "mailto:contact@ogcalltrader.com",
  },
  {
    icon: Send,
    label: "Telegram",
    value: "@OGCallTrader",
    href: "https://t.me/OGCallTrader",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@ogcalltrader",
    href: "https://instagram.com/ogcalltrader",
  },
]

export function ContactSection() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get In Touch
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions about our trading strategies or VIP membership? Reach out to us through any of these channels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Contact Cards */}
          <div className="flex flex-col gap-4">
            {contactMethods.map((method) => (
              <a
                key={method.label}
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">{method.label}</span>
                  <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                    {method.value}
                  </span>
                </div>
              </a>
            ))}

            <div className="mt-4 p-5 rounded-xl bg-card border border-primary/30">
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-semibold">Response Time:</span> We typically respond within 24 hours during business days.
              </p>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="p-6 md:p-8 rounded-xl bg-card border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-6">Send Us a Message</h3>
            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="name"
                  placeholder="Your name"
                  className="bg-secondary border-border focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="bg-secondary border-border focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <Input
                  id="subject"
                  placeholder="What is this about?"
                  className="bg-secondary border-border focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Your message..."
                  rows={4}
                  className="bg-secondary border-border focus:border-primary resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6 mt-2"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
