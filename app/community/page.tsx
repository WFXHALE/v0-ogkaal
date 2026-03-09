"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  CommunityUser, Post, TraderLevel,
  getSession, setSession, signUp, signIn,
  getPosts, createPost, toggleLike, addComment, timeAgo,
} from "@/lib/community-store"
import {
  Heart, MessageCircle, UserPlus, X, Image as ImageIcon,
  Hash, TrendingUp, ChevronDown, Send, LogOut, Shield,
} from "lucide-react"

// ---- level badge ------------------------------------------------------------

const LEVEL_COLORS: Record<TraderLevel, string> = {
  Beginner: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  Trader: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Pro Trader": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Master Trader": "bg-[#FCD535]/20 text-[#FCD535] border-[#FCD535]/30",
}

function LevelBadge({ level }: { level: TraderLevel }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${LEVEL_COLORS[level]}`}>
      {level}
    </span>
  )
}

// ---- auth modal -------------------------------------------------------------

type AuthMode = "choose" | "signup" | "signin"

function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (u: CommunityUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("choose")
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", level: "Beginner" as TraderLevel, identifier: "" })
  const [error, setError] = useState("")

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function handleSignUp() {
    if (!form.fullName || !form.email || !form.phone) { setError("All fields are required."); return }
    const res = signUp({ fullName: form.fullName, email: form.email, phone: form.phone, level: form.level })
    if (!res.ok) { setError(res.error || "Error"); return }
    onAuth(res.user!)
  }

  function handleSignIn() {
    if (!form.identifier) { setError("Enter your email or phone."); return }
    const res = signIn(form.identifier)
    if (!res.ok) { setError(res.error || "Error"); return }
    onAuth(res.user!)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {mode === "choose" && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#FCD535]/10 border border-[#FCD535]/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-[#FCD535]" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">Join the Community</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to post, like, and comment. Or continue as a viewer.</p>
            <div className="space-y-3">
              <button onClick={() => setMode("signup")} className="w-full py-3 rounded-xl bg-[#FCD535] text-[#0B0E11] font-bold hover:bg-[#F0B90B] transition-colors">
                Sign Up
              </button>
              <button onClick={() => setMode("signin")} className="w-full py-3 rounded-xl bg-secondary border border-border text-foreground font-semibold hover:bg-secondary/80 transition-colors">
                Sign In
              </button>
              <button onClick={onClose} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Continue as Anonymous Viewer
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div>
            <button onClick={() => { setMode("choose"); setError("") }} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
              ← Back
            </button>
            <h2 className="text-xl font-bold text-foreground mb-5">Create Account</h2>
            <div className="space-y-3">
              <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 text-sm" />
              <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" type="email" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 text-sm" />
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone Number" type="tel" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 text-sm" />
              <div className="relative">
                <select value={form.level} onChange={(e) => set("level", e.target.value)} className="w-full appearance-none px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 text-sm">
                  {(["Beginner", "Trader", "Pro Trader", "Master Trader"] as TraderLevel[]).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={handleSignUp} className="w-full py-3 rounded-xl bg-[#FCD535] text-[#0B0E11] font-bold hover:bg-[#F0B90B] transition-colors">
                Create Account
              </button>
            </div>
          </div>
        )}

        {mode === "signin" && (
          <div>
            <button onClick={() => { setMode("choose"); setError("") }} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
              ← Back
            </button>
            <h2 className="text-xl font-bold text-foreground mb-5">Sign In</h2>
            <div className="space-y-3">
              <input value={form.identifier} onChange={(e) => set("identifier", e.target.value)} placeholder="Email or Phone Number" className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/40 text-sm" />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button onClick={handleSignIn} className="w-full py-3 rounded-xl bg-[#FCD535] text-[#0B0E11] font-bold hover:bg-[#F0B90B] transition-colors">
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- post card --------------------------------------------------------------

function PostCard({ post, currentUser, onLike, onComment }: {
  post: Post
  currentUser: CommunityUser | null
  onLike: (id: string) => void
  onComment: (id: string, text: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [authWarn, setAuthWarn] = useState(false)

  function requireAuth(fn: () => void) {
    if (!currentUser) { setAuthWarn(true); setTimeout(() => setAuthWarn(false), 3000); return }
    fn()
  }

  function submitComment() {
    if (!commentText.trim()) return
    onComment(post.id, commentText.trim())
    setCommentText("")
  }

  const liked = currentUser ? post.likes.includes(currentUser.id) : false

  return (
    <article className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{post.authorName}</span>
            <LevelBadge level={post.authorLevel} />
            {post.type === "article" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">Article</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      {/* Content */}
      {post.title && <h3 className="text-base font-bold text-foreground">{post.title}</h3>}
      <p className="text-sm text-foreground/90 leading-relaxed">{post.content}</p>

      {/* Trade idea */}
      {post.tradeIdea && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[#FCD535]/5 border border-[#FCD535]/20">
          {([
            ["Asset", post.tradeIdea.asset],
            ["Entry", post.tradeIdea.entry],
            ["Stop Loss", post.tradeIdea.stopLoss],
            ["Target", post.tradeIdea.target],
          ] as [string, string][]).map(([label, val]) => (
            <div key={label} className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className="text-sm font-bold text-[#FCD535]">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post image" className="w-full rounded-xl object-cover max-h-72" />
      )}

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs text-[#FCD535] hover:text-[#F0B90B] cursor-pointer">#{tag}</span>
          ))}
        </div>
      )}

      {/* Auth warning */}
      {authWarn && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Please Sign Up or Sign In to continue.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <button
          onClick={() => requireAuth(() => onLike(post.id))}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-red-400" : ""}`} />
          <span>{post.likes.length}</span>
        </button>

        <button
          onClick={() => requireAuth(() => setShowComments((v) => !v))}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments.length}</span>
        </button>

        <button
          onClick={() => requireAuth(() => {})}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#FCD535] transition-colors ml-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Follow</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-3 pt-2">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <img src={c.authorAvatar} alt={c.authorName} className="w-7 h-7 rounded-full flex-shrink-0" />
              <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-foreground">{c.authorName}</span>
                  <LevelBadge level={c.authorLevel} />
                </div>
                <p className="text-xs text-foreground/90">{c.content}</p>
              </div>
            </div>
          ))}

          {currentUser && (
            <div className="flex gap-2">
              <img src={currentUser.avatar} alt={currentUser.fullName} className="w-7 h-7 rounded-full flex-shrink-0" />
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/30"
                />
                <button onClick={submitComment} className="p-2 rounded-xl bg-[#FCD535]/10 hover:bg-[#FCD535]/20 text-[#FCD535] transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

// ---- post creator -----------------------------------------------------------

function PostCreator({ currentUser, onPost }: { currentUser: CommunityUser; onPost: (p: Post) => void }) {
  const [postType, setPostType] = useState<"post" | "article">("post")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [hashtag, setHashtag] = useState("")
  const [hashtags, setHashtags] = useState<string[]>([])
  const [showTradeIdea, setShowTradeIdea] = useState(false)
  const [tradeIdea, setTradeIdea] = useState({ asset: "", entry: "", stopLoss: "", target: "" })
  const [imageUrl, setImageUrl] = useState("")
  const [showImageInput, setShowImageInput] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function addHashtag() {
    const tag = hashtag.replace(/^#/, "").trim()
    if (tag && !hashtags.includes(tag)) setHashtags((h) => [...h, tag])
    setHashtag("")
  }

  function handleSubmit() {
    if (!content.trim()) return
    const post = createPost({
      type: postType,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatar,
      authorLevel: currentUser.level,
      content,
      title: postType === "article" ? title : undefined,
      imageUrl: imageUrl || undefined,
      tradeIdea: showTradeIdea && tradeIdea.asset ? tradeIdea : undefined,
      hashtags,
    })
    onPost(post)
    setContent(""); setTitle(""); setHashtags([]); setImageUrl("")
    setTradeIdea({ asset: "", entry: "", stopLoss: "", target: "" })
    setShowTradeIdea(false); setShowImageInput(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setShowImageInput(false)
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      {/* Type tabs */}
      <div className="flex gap-2 mb-4">
        {(["post", "article"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setPostType(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${postType === t ? "bg-[#FCD535] text-[#0B0E11]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <img src={currentUser.avatar} alt={currentUser.fullName} className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          {postType === "article" && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add Your Title"
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/30 text-sm font-semibold"
            />
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/30 text-sm resize-none"
          />

          {/* Hashtag chips */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FCD535]/10 text-[#FCD535] text-xs">
                  #{tag}
                  <button onClick={() => setHashtags((h) => h.filter((t) => t !== tag))} className="opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Image preview */}
          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="Preview" className="w-full rounded-xl max-h-48 object-cover" />
              <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs">×</button>
            </div>
          )}

          {/* Image URL input */}
          {showImageInput && (
            <div className="flex gap-2">
              <input
                placeholder="Paste image URL or upload below..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none"
              />
              <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-xl bg-secondary text-xs text-foreground border border-border hover:bg-secondary/80">
                Upload
              </button>
            </div>
          )}

          {/* Trade idea fields */}
          {showTradeIdea && (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#FCD535]/5 border border-[#FCD535]/20">
              {(["asset", "entry", "stopLoss", "target"] as const).map((field) => (
                <input
                  key={field}
                  value={tradeIdea[field]}
                  onChange={(e) => setTradeIdea((t) => ({ ...t, [field]: e.target.value }))}
                  placeholder={{ asset: "Asset (e.g. XAUUSD)", entry: "Entry", stopLoss: "Stop Loss", target: "Target" }[field]}
                  className="px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none text-xs"
                />
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { setShowImageInput((v) => !v) }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${showImageInput ? "bg-[#FCD535]/20 text-[#FCD535]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <ImageIcon className="w-3.5 h-3.5" /> Image
            </button>

            <div className="flex items-center gap-1">
              <input
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHashtag()}
                placeholder="#hashtag"
                className="w-24 px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button onClick={addHashtag} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground">
                <Hash className="w-3.5 h-3.5" />
              </button>
            </div>

            <button onClick={() => setShowTradeIdea((v) => !v)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${showTradeIdea ? "bg-[#FCD535]/20 text-[#FCD535]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <TrendingUp className="w-3.5 h-3.5" /> Trade Idea
            </button>

            <button onClick={handleSubmit} disabled={!content.trim()} className="ml-auto px-5 py-1.5 rounded-lg bg-[#FCD535] text-[#0B0E11] text-xs font-bold hover:bg-[#F0B90B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- main page --------------------------------------------------------------

export default function CommunityPage() {
  const [mounted, setMounted] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null)
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    setMounted(true)
    const session = getSession()
    setCurrentUser(session)
    setPosts(getPosts())
    if (!session) setShowAuthModal(true)
  }, [])

  function handleAuth(user: CommunityUser) {
    setCurrentUser(user)
    setShowAuthModal(false)
  }

  function handleSignOut() {
    setSession(null)
    setCurrentUser(null)
  }

  function handleLike(postId: string) {
    if (!currentUser) return
    setPosts(toggleLike(postId, currentUser.id))
  }

  function handleComment(postId: string, text: string) {
    if (!currentUser) return
    setPosts(addComment(postId, {
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatar,
      authorLevel: currentUser.level,
      content: text,
    }))
  }

  function handleNewPost(post: Post) {
    setPosts((prev) => [post, ...prev])
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onAuth={handleAuth} />
      )}

      <Header />

      <main className="flex-1 mt-16">
        {/* Page header */}
        <div className="border-b border-border bg-card/40">
          <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Community</h1>
              <p className="text-sm text-muted-foreground">OG KAAL TRADER — Traders Hub</p>
            </div>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-foreground">{currentUser.fullName}</p>
                  <LevelBadge level={currentUser.level} />
                </div>
                <img src={currentUser.avatar} alt={currentUser.fullName} className="w-9 h-9 rounded-full" />
                <button onClick={handleSignOut} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-4 py-2 rounded-xl bg-[#FCD535] text-[#0B0E11] text-sm font-bold hover:bg-[#F0B90B] transition-colors">
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>

        {/* Feed */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {/* Post creator — only for signed-in users */}
          {currentUser && (
            <PostCreator currentUser={currentUser} onPost={handleNewPost} />
          )}

          {/* Posts feed */}
          {posts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLike={handleLike}
                onComment={handleComment}
              />
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
