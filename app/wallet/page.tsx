"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { P2PAuthModal } from "@/components/p2p-auth-modal"
import { getP2PAccount } from "@/lib/p2p-auth"
import type { CommunityUser } from "@/lib/community-utils"
import { Wallet, Plus, Copy, ExternalLink, Trash2, ShieldCheck, LockKeyhole } from "lucide-react"

type Network = "TRON (TRC-20)" | "Ethereum (ERC-20)" | "BNB Smart Chain (BEP-20)" | "Bitcoin"
type SavedAddress = { id: string; label: string; network: Network; address: string; createdAt: string }
const NETWORKS: Network[] = ["TRON (TRC-20)", "Ethereum (ERC-20)", "BNB Smart Chain (BEP-20)", "Bitcoin"]
const EXPLORERS: Record<Network, string> = {
  "TRON (TRC-20)": "https://tronscan.org/#/address/",
  "Ethereum (ERC-20)": "https://etherscan.io/address/",
  "BNB Smart Chain (BEP-20)": "https://bscscan.com/address/",
  Bitcoin: "https://www.blockchain.com/explorer/addresses/btc/",
}
function validAddress(network: Network, address: string) {
  const value = address.trim()
  if (network === "TRON (TRC-20)") return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)
  if (network === "Ethereum (ERC-20)" || network === "BNB Smart Chain (BEP-20)") return /^0x[a-fA-F0-9]{40}$/.test(value)
  return /^(bc1[a-zA-HJ-NP-Z0-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(value)
}

export default function WalletPage() {
  const [user, setUser] = useState<CommunityUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [label, setLabel] = useState("")
  const [network, setNetwork] = useState<Network>(NETWORKS[0])
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState("")
  const storageKey = useMemo(() => user?.id ? "ogkaal_watch_wallets_" + user.id : "", [user?.id])

  useEffect(() => {
    getP2PAccount().then(account => { setUser(account); setChecking(false) })
  }, [])

  useEffect(() => {
    if (!storageKey) { setAddresses([]); return }
    try { setAddresses(JSON.parse(localStorage.getItem(storageKey) || "[]")) }
    catch { setAddresses([]) }
  }, [storageKey])

  const persist = useCallback((next: SavedAddress[]) => {
    setAddresses(next)
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
  }, [storageKey])

  function addAddress() {
    setError("")
    if (!label.trim() || !address.trim()) { setError("Enter a wallet label and public address."); return }
    if (!validAddress(network, address)) { setError("That address does not match the selected network format. Check the network and address."); return }
    if (addresses.some(item => item.network === network && item.address.toLowerCase() === address.trim().toLowerCase())) { setError("This address is already saved."); return }
    persist([{ id: crypto.randomUUID(), label: label.trim(), network, address: address.trim(), createdAt: new Date().toISOString() }, ...addresses])
    setLabel(""); setAddress("")
  }

  async function copyAddress(item: SavedAddress) {
    await navigator.clipboard.writeText(item.address)
    setCopied(item.id)
    window.setTimeout(() => setCopied(""), 1600)
  }

  return <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 mt-20 w-full max-w-5xl mx-auto px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary/15 p-3 text-primary"><Wallet className="h-7 w-7" /></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">OG KAAL TRADER</p><h1 className="text-3xl font-bold text-foreground">Watch-only Wallet</h1><p className="mt-1 text-sm text-muted-foreground">Save and manage references to your own public crypto addresses.</p></div>
      </div>
      <div className="mb-6 flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
        <div><p className="font-semibold text-foreground">Your keys stay with you</p><p className="mt-1 text-muted-foreground">This page never asks for seed phrases or private keys. It does not hold funds, connect to a signing wallet, or send transactions.</p></div>
      </div>
      {checking ? <div className="rounded-2xl border border-border p-8 text-center text-muted-foreground">Checking account…</div> : !user ? <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <LockKeyhole className="mx-auto mb-3 h-9 w-9 text-primary" /><h2 className="text-xl font-bold text-foreground">Sign in required</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Sign in to save public wallet addresses under your account. Your saved list is stored only in this browser.</p>
        <button onClick={() => setAuthOpen(true)} className="mt-5 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground">Sign in / Create account</button>
        <p className="mt-4 text-xs text-muted-foreground">Return to <Link href="/" className="text-primary underline">USDT P2P</Link></p>
      </div> : <>
        <section className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground"><Plus className="h-5 w-5 text-primary" /> Add a public address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-foreground">Wallet label<input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. My personal USDT wallet" maxLength={40} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" /></label>
            <label className="text-sm font-medium text-foreground">Network<select value={network} onChange={e => setNetwork(e.target.value as Network)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm">{NETWORKS.map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-medium text-foreground sm:col-span-2">Public wallet address<input value={address} onChange={e => setAddress(e.target.value)} placeholder={network === "TRON (TRC-20)" ? "Starts with T…" : network === "Bitcoin" ? "Your BTC public address" : "Starts with 0x…"} autoComplete="off" spellCheck={false} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm" /></label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
          <button onClick={addAddress} className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Save address</button>
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-foreground">Saved addresses</h2><span className="text-xs text-muted-foreground">{addresses.length} saved</span></div>
          {addresses.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No addresses saved yet.</div> : <div className="space-y-3">{addresses.map(item => <article key={item.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-foreground">{item.label}</h3><p className="mt-1 text-xs text-muted-foreground">{item.network}</p></div><button onClick={() => persist(addresses.filter(entry => entry.id !== item.id))} aria-label="Delete saved address" className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>
            <p className="mt-3 break-all rounded-lg bg-secondary/70 p-3 font-mono text-xs text-foreground">{item.address}</p>
            <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => copyAddress(item)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground"><Copy className="h-3.5 w-3.5" />{copied === item.id ? "Copied" : "Copy address"}</button><a href={EXPLORERS[item.network] + encodeURIComponent(item.address)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground">View on explorer <ExternalLink className="h-3.5 w-3.5" /></a></div>
          </article>)}</div>}
        </section>
        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">Privacy note: saved addresses are stored in this browser's local storage, not on OG KAAL TRADER servers. Clearing browser data removes this list. Never enter a seed phrase or private key on this website.</p>
      </>}
    </main>
    <Footer />
    {authOpen && <P2PAuthModal onClose={() => setAuthOpen(false)} onAuth={account => { setUser(account); setAuthOpen(false) }} />}
  </div>
}
