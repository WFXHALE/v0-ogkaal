"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  CommunityUser, Post, Comment,
  getSession, setSession, ADMIN_ID,
  getPosts, createPost, toggleLike, addComment,
  isFollowing, toggleFollow, timeAgo,
} from "@/lib/community-store"
import {
  Heart, MessageCircle, UserPlus, UserCheck, X, Image as ImageIcon,
  Hash, TrendingUp, ChevronDown, Send, LogOut,
  Plus, FileText, Video, RefreshCw,
} from "lucide-react"
import { sendNotification, NotificationBell } from "@/components/notification-bell"
import { AuthModal } from "@/components/auth-modal"

// ---- admin badges -----------------------------------------------------------

function AdminBadges() {
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
        <span className="text-purple-400">&#9670;</span> Master Trader
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30">
        <span className="text-red-400">&#9670;</span> Mentor
      </span>
    </span>
  )
}

// ---- comment drawer ---------------------------------------------------------

function CommentDrawer({ post, currentUser, onClose, onComment }: {
  post: Post
  currentUser: CommunityUser | null
  onClose: () => void
  onComment: (postId: string, text: string) => void
}) {
  const [text, setText] = useState("")

  function submit() {
    if (!text.trim() || !currentUser) return
    onComment(post.id, text.trim())
    setText("")
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] flex flex-col bg-card border-t border-border rounded-t-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-semibold text-foreground">{post.comments.length} Comments</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {post.comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
          )}
          {post.comments.map((c: Comment) => (
            <div key={c.id} className="flex gap-3">
              <img src={c.authorAvatar} alt={c.authorName} className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-foreground mb-0.5">{c.authorName}</p>
                <p className="text-xs text-foreground/90">{c.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(c.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>

        {currentUser ? (
          <div className="flex gap-3 px-5 py-4 border-t border-border">
            <img src={currentUser.avatar} alt={currentUser.fullName} className="w-8 h-8 rounded-full flex-shrink-0" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/30"
            />
            <button onClick={submit} disabled={!text.trim()} className="p-2 rounded-xl bg-[#FCD535]/10 hover:bg-[#FCD535]/20 text-[#FCD535] disabled:opacity-40 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="px-5 py-4 text-sm text-muted-foreground border-t border-border text-center">Sign in to comment.</p>
        )}
      </div>
    </>
  )
}

// ---- follow button ----------------------------------------------------------

function FollowButton({ targetId, currentUserId, currentUser }: {
  targetId: string
  currentUserId: string | null
  currentUser?: CommunityUser | null
}) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUserId) isFollowing(currentUserId, targetId).then(setFollowing)
  }, [currentUserId, targetId])

  if (!currentUserId || currentUserId === targetId) return null

  async function handleClick() {
    if (!currentUserId) return
    setLoading(true)
    const nowFollowing = await toggleFollow(currentUserId!, targetId)
    setFollowing(nowFollowing)
    setLoading(false)
    if (nowFollowing && currentUser) {
      sendNotification({
        type: "follow",
        recipientId: targetId,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorAvatar: currentUser.avatar,
      })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all duration-300 ${
        following
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          : "bg-[#FCD535]/10 text-[#FCD535] border border-[#FCD535]/30 hover:bg-[#FCD535]/20"
      }`}
    >
      {following ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
      {following ? "Following" : "Follow"}
    </button>
  )
}

// ---- post card --------------------------------------------------------------

function PostCard({ post, currentUser, onLike, onComment }: {
  post: Post
  currentUser: CommunityUser | null
  onLike: (id: string) => void
  onComment: (postId: string, text: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [authWarn, setAuthWarn] = useState(false)
  const liked = currentUser ? post.likes.includes(currentUser.id) : false
  const isAdmin = post.authorId === ADMIN_ID || post.isAdminPost

  function requireAuth(fn: () => void) {
    if (!currentUser) { setAuthWarn(true); setTimeout(() => setAuthWarn(false), 3000); return }
    fn()
  }

  return (
    <article className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Author row */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/community/profile/${post.authorId}`} className="flex items-center gap-3 group min-w-0">
          <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full object-cover flex-shrink-0 group-hover:ring-2 group-hover:ring-[#FCD535]/50 transition-all" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm group-hover:text-[#FCD535] transition-colors">{post.authorName}</span>
              {isAdmin && <AdminBadges />}
              {post.type === "article" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">Article</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
          </div>
        </Link>
          <FollowButton targetId={post.authorId} currentUserId={currentUser?.id ?? null} currentUser={currentUser} />
      </div>

      {post.title && <h3 className="text-base font-bold text-foreground">{post.title}</h3>}
      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{post.content}</p>

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

      {post.imageUrl && !post.imageUrl.startsWith("[video]") && (
        <img src={post.imageUrl} alt="Post image" className="w-full rounded-xl object-cover max-h-72" />
      )}

      {post.imageUrl?.startsWith("[video]") && (
        <a href={post.imageUrl.replace("[video] ", "")} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground hover:border-[#FCD535]/40 transition-colors">
          <Video className="w-4 h-4 text-[#FCD535]" />
          Watch Video
        </a>
      )}

      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs text-[#FCD535]">#{tag}</span>
          ))}
        </div>
      )}

      {authWarn && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Sign in to like or comment.
        </p>
      )}

      {/* Action bar — likes + comment count only, no inline comments */}
      <div className="flex items-center gap-5 pt-1 border-t border-border">
        <button
          onClick={() => requireAuth(() => onLike(post.id))}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-red-400" : ""}`} />
          <span>{post.likes.length}</span>
        </button>

        <button
          onClick={() => requireAuth(() => setShowComments(true))}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments.length}</span>
        </button>
      </div>

      {/* Comment drawer — Instagram-style bottom sheet */}
      {showComments && (
        <CommentDrawer
          post={post}
          currentUser={currentUser}
          onClose={() => setShowComments(false)}
          onComment={(id, text) => { onComment(id, text) }}
        />
      )}
    </article>
  )
}

// ---- post creator -----------------------------------------------------------

type CreatorType = "post" | "article" | "video"

function PostCreator({ currentUser, onPost, defaultType = "post", onCancel }: {
  currentUser: CommunityUser
  onPost: (p: Post) => void
  defaultType?: CreatorType
  onCancel?: () => void
}) {
  const [postType, setPostType]           = useState<CreatorType>(defaultType)
  const [title, setTitle]                 = useState("")
  const [content, setContent]             = useState("")
  const [hashtag, setHashtag]             = useState("")
  const [hashtags, setHashtags]           = useState<string[]>([])
  const [showTradeIdea, setShowTradeIdea] = useState(false)
  const [tradeIdea, setTradeIdea]         = useState({ asset: "", entry: "", stopLoss: "", target: "" })
  const [imageUrl, setImageUrl]           = useState("")
  const [showImageInput, setShowImageInput] = useState(false)
  const [videoUrl, setVideoUrl]           = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function addHashtag() {
    const tag = hashtag.replace(/^#/, "").trim()
    if (tag && !hashtags.includes(tag)) setHashtags((h) => [...h, tag])
    setHashtag("")
  }

  async function handleSubmit() {
    if (!content.trim()) return
    const post = await createPost({
      type: postType === "video" ? "post" : postType,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatar,
      authorLevel: currentUser.level,
      isAdminPost: currentUser.isAdmin,
      content,
      title: (postType === "article" || postType === "video") ? title : undefined,
      imageUrl: imageUrl || (videoUrl ? `[video] ${videoUrl}` : undefined),
      tradeIdea: showTradeIdea && tradeIdea.asset ? tradeIdea : undefined,
      hashtags,
    })
    onPost(post)
    setContent(""); setTitle(""); setHashtags([]); setImageUrl(""); setVideoUrl("")
    setTradeIdea({ asset: "", entry: "", stopLoss: "", target: "" })
    setShowTradeIdea(false); setShowImageInput(false)
    onCancel?.()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImageUrl(URL.createObjectURL(file)); setShowImageInput(false)
  }

  const tabs: { key: CreatorType; label: string }[] = [
    { key: "post",    label: "Post" },
    { key: "article", label: "Article" },
    { key: "video",   label: "Video" },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setPostType(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${postType === t.key ? "bg-[#FCD535] text-[#0B0E11]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
        {onCancel && <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </div>

      <div className="flex gap-3">
        <img src={currentUser.avatar} alt={currentUser.fullName} className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          {(postType === "article" || postType === "video") && (
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={postType === "video" ? "Video Title" : "Add Your Title"}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/30 text-sm font-semibold" />
          )}
          {postType === "video" && (
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste YouTube / video link..."
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/30 text-sm" />
          )}
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts..." rows={3}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FCD535]/30 text-sm resize-none" />

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FCD535]/10 text-[#FCD535] text-xs">
                  #{tag}<button onClick={() => setHashtags((h) => h.filter((t) => t !== tag))} className="opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
            </div>
          )}

          {imageUrl && (
            <div className="relative">
              <img src={imageUrl} alt="Preview" className="w-full rounded-xl max-h-48 object-cover" />
              <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs">×</button>
            </div>
          )}
          {showImageInput && (
            <div className="flex gap-2">
              <input placeholder="Paste image URL..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none" />
              <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-xl bg-secondary text-xs text-foreground border border-border hover:bg-secondary/80">Upload</button>
            </div>
          )}

          {showTradeIdea && (
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#FCD535]/5 border border-[#FCD535]/20">
              {(["asset", "entry", "stopLoss", "target"] as const).map((field) => (
                <input key={field} value={tradeIdea[field]} onChange={(e) => setTradeIdea((t) => ({ ...t, [field]: e.target.value }))}
                  placeholder={{ asset: "Asset (e.g. XAUUSD)", entry: "Entry", stopLoss: "Stop Loss", target: "Target" }[field]}
                  className="px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none text-xs" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {postType !== "video" && (
              <button onClick={() => setShowImageInput((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${showImageInput ? "bg-[#FCD535]/20 text-[#FCD535]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <ImageIcon className="w-3.5 h-3.5" /> Image
              </button>
            )}
            <div className="flex items-center gap-1">
              <input value={hashtag} onChange={(e) => setHashtag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHashtag()} placeholder="#hashtag"
                className="w-24 px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" />
              <button onClick={addHashtag} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground"><Hash className="w-3.5 h-3.5" /></button>
            </div>
            {postType === "post" && (
              <button onClick={() => setShowTradeIdea((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${showTradeIdea ? "bg-[#FCD535]/20 text-[#FCD535]" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                <TrendingUp className="w-3.5 h-3.5" /> Trade Idea
              </button>
            )}
            <button onClick={handleSubmit} disabled={!content.trim()}
              className="ml-auto px-5 py-1.5 rounded-lg bg-[#FCD535] text-[#0B0E11] text-xs font-bold hover:bg-[#F0B90B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- pull-to-refresh --------------------------------------------------------

function PullIndicator({ progress, refreshing }: { progress: number; refreshing: boolean }) {
  if (progress === 0 && !refreshing) return null
  return (
    <div className="flex items-center justify-center py-3" style={{ height: refreshing ? 56 : Math.min(progress * 56, 56) }}>
      <RefreshCw className={`w-5 h-5 text-[#FCD535] ${refreshing ? "animate-spin" : ""}`}
        style={{ transform: `rotate(${progress * 360}deg)` }} />
    </div>
  )
}

// ---- main page --------------------------------------------------------------

export default function CommunityPage() {
  const [mounted, setMounted]           = useState(false)
  const [showAuth, setShowAuth]         = useState(false)
  const [currentUser, setCurrentUser]   = useState<CommunityUser | null>(null)
  const [posts, setPosts]               = useState<Post[]>([])
  const [fabOpen, setFabOpen]           = useState(false)
  const [creatorType, setCreatorType]   = useState<CreatorType>("post")
  const [showCreator, setShowCreator]   = useState(false)
  const [pullProgress, setPullProgress] = useState(0)
  const [refreshing, setRefreshing]     = useState(false)
  const touchStartY = useRef(0)

  useEffect(() => {
    setMounted(true)
    const session = getSession()
    setCurrentUser(session)
    getPosts().then(setPosts)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY
  }, [])
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || touchStartY.current === 0) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setPullProgress(Math.min(delta / 80, 1))
  }, [])
  const handleTouchEnd = useCallback(() => {
    if (pullProgress >= 1) {
      setRefreshing(true)
      getPosts().then((p) => { setPosts(p); setRefreshing(false); setPullProgress(0) })
    } else { setPullProgress(0) }
    touchStartY.current = 0
  }, [pullProgress])

  function handleAuth(user: CommunityUser) { setCurrentUser(user); setShowAuth(false) }
  function handleSignOut() { setSession(null); setCurrentUser(null) }

  async function handleLike(postId: string) {
    if (!currentUser) return
    const updatedPosts = await toggleLike(postId, currentUser.id)
    setPosts(updatedPosts)
    const post = updatedPosts.find((p) => p.id === postId)
    if (post && post.likes.includes(currentUser.id)) {
      sendNotification({
        type: "like",
        recipientId: post.authorId,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorAvatar: currentUser.avatar,
        postId: post.id,
        postPreview: post.content.slice(0, 60),
      })
    }
  }

  async function handleComment(postId: string, text: string) {
    if (!currentUser) return
    const updatedPosts = await addComment(postId, {
      authorId: currentUser.id, authorName: currentUser.fullName,
      authorAvatar: currentUser.avatar, content: text,
    })
    setPosts(updatedPosts)
    const post = updatedPosts.find((p) => p.id === postId)
    if (post) {
      sendNotification({
        type: "comment",
        recipientId: post.authorId,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorAvatar: currentUser.avatar,
        postId: post.id,
        postPreview: text.slice(0, 60),
      })
    }
  }

  async function handleNewPost(post: Post) {
    setPosts((prev) => [post, ...prev])
    setShowCreator(false)
    setFabOpen(false)
    if (post.isAdminPost) {
      sendNotification({
        type: "admin_post",
        recipientId: "__broadcast__",
        actorId: post.authorId,
        actorName: post.authorName,
        actorAvatar: post.authorAvatar,
        postId: post.id,
        postPreview: (post.title ?? post.content).slice(0, 60),
      })
    }
  }
  function openCreator(type: CreatorType) { setCreatorType(type); setShowCreator(true); setFabOpen(false) }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background flex flex-col" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />}

      <Header />

      <main className="flex-1 mt-16">
        <PullIndicator progress={pullProgress} refreshing={refreshing} />

        {/* Page header bar */}
        <div className="border-b border-border bg-card/40">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-foreground">Community</h1>
              <p className="text-xs text-muted-foreground">OG KAAL TRADER — Traders Hub</p>
            </div>
            {currentUser ? (
              <div className="flex items-center gap-2">
                <NotificationBell userId={currentUser.id} />
                <Link href={`/community/profile/${currentUser.id}`} className="flex items-center gap-2 group">
                  <img src={currentUser.avatar} alt={currentUser.fullName} className="w-9 h-9 rounded-full group-hover:ring-2 group-hover:ring-[#FCD535]/50 transition-all" />
                  <span className="hidden sm:block text-sm font-semibold text-foreground group-hover:text-[#FCD535] transition-colors">{currentUser.fullName}</span>
                </Link>
                <button onClick={handleSignOut} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="px-4 py-2 rounded-xl bg-[#FCD535] text-[#0B0E11] text-sm font-bold hover:bg-[#F0B90B] transition-colors">
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>

        {/* SMC Guide card — pinned above the feed */}
        <div className="max-w-2xl mx-auto px-4 pt-5">
          <Link
            href="/smc-guide"
            className="flex items-center gap-4 rounded-2xl border border-[#FCD535]/30 bg-[#FCD535]/5 hover:bg-[#FCD535]/10 hover:border-[#FCD535]/60 transition-colors px-5 py-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FCD535]/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#FCD535]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground group-hover:text-[#FCD535] transition-colors">SMC Guide</p>
              <p className="text-xs text-muted-foreground truncate">Complete Smart Money Concepts guide — order blocks, liquidity, market structure & more</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 shrink-0" />
          </Link>
        </div>

        {/* Feed */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-32">
          {showCreator && currentUser && (
            <PostCreator currentUser={currentUser} onPost={handleNewPost} defaultType={creatorType} onCancel={() => setShowCreator(false)} />
          )}
          {currentUser && !showCreator && (
            <button onClick={() => openCreator("post")}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-4 text-left hover:border-[#FCD535]/40 transition-colors">
              <img src={currentUser.avatar} alt={currentUser.fullName} className="w-9 h-9 rounded-full flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Share something with the community...</span>
            </button>
          )}
          {posts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={currentUser} onLike={handleLike} onComment={handleComment} />
            ))
          )}
        </div>
      </main>

      <Footer />

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {fabOpen && currentUser && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {([
              { type: "post"    as CreatorType, label: "Upload Post",    icon: <Hash className="w-4 h-4" /> },
              { type: "article" as CreatorType, label: "Upload Article", icon: <FileText className="w-4 h-4" /> },
              { type: "video"   as CreatorType, label: "Upload Video",   icon: <Video className="w-4 h-4" /> },
            ]).map((item) => (
              <button key={item.type} onClick={() => openCreator(item.type)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-medium shadow-lg hover:border-[#FCD535]/40 hover:text-[#FCD535] transition-all">
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => { if (!currentUser) { setShowAuth(true); return } setFabOpen((v) => !v) }}
          className="w-14 h-14 rounded-full bg-[#FCD535] text-[#0B0E11] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          style={{ boxShadow: "0 0 0 0 rgba(252,213,53,0.4), 0 4px 24px rgba(252,213,53,0.35)" }}
          aria-label="Create post"
        >
          <Plus className={`w-6 h-6 transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`} />
        </button>
      </div>
      {fabOpen && <div className="fixed inset-0 z-30" onClick={() => setFabOpen(false)} />}
    </div>
  )
}
