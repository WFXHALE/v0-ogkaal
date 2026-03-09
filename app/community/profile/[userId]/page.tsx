"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  CommunityUser, Post, ADMIN_ID,
  getSession, getUserById, getPostsByUser,
  isFollowing, toggleFollow,
  getFollowerCount, getFollowingCount, getTotalLikes,
  timeAgo,
} from "@/lib/community-store"
import { ArrowLeft, UserPlus, UserCheck, Heart, MessageCircle, TrendingUp, Video } from "lucide-react"

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

// ---- mini post card ---------------------------------------------------------

function MiniPostCard({ post }: { post: Post }) {
  return (
    <article className="bg-card border border-border rounded-xl p-4 space-y-2">
      {post.title && <h3 className="text-sm font-bold text-foreground">{post.title}</h3>}
      <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{post.content}</p>

      {post.tradeIdea && (
        <div className="flex items-center gap-1.5 text-xs text-[#FCD535]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{post.tradeIdea.asset} — Entry {post.tradeIdea.entry} / TP {post.tradeIdea.target}</span>
        </div>
      )}

      {post.imageUrl && !post.imageUrl.startsWith("[video]") && (
        <img src={post.imageUrl} alt="Post" className="w-full rounded-lg object-cover max-h-40" />
      )}

      {post.imageUrl?.startsWith("[video]") && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Video className="w-3.5 h-3.5" /> Video post
        </div>
      )}

      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-[10px] text-[#FCD535]">#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="w-3.5 h-3.5" /> {post.likes.length}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageCircle className="w-3.5 h-3.5" /> {post.comments.length}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
      </div>
    </article>
  )
}

// ---- profile page -----------------------------------------------------------

export default function ProfilePage() {
  const params = useParams()
  const userId = params.userId as string

  const [mounted, setMounted]         = useState(false)
  const [user, setUser]               = useState<CommunityUser | null>(null)
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null)
  const [posts, setPosts]             = useState<Post[]>([])
  const [tab, setTab]                 = useState<"content" | "replies">("content")
  const [following, setFollowing]         = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [totalLikes, setTotalLikes]       = useState(0)

  useEffect(() => {
    setMounted(true)
    const session = getSession()
    setCurrentUser(session)
    getUserById(userId).then((u) => {
      setUser(u)
      if (u) {
        getPostsByUser(u.id).then(setPosts)
        getFollowerCount(u.id).then(setFollowerCount)
        getFollowingCount(u.id).then(setFollowingCount)
        getTotalLikes(u.id).then(setTotalLikes)
        if (session) isFollowing(session.id, u.id).then(setFollowing)
      }
    })
  }, [userId])

  async function handleFollow() {
    if (!currentUser || !user) return
    const nowFollowing = await toggleFollow(currentUser.id, user.id)
    setFollowing(nowFollowing)
    getFollowerCount(user.id).then(setFollowerCount)
  }

  if (!mounted) return null

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 mt-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">User not found.</p>
            <Link href="/community" className="text-sm text-[#FCD535] hover:underline">Back to Community</Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const isAdmin = user.id === ADMIN_ID || user.isAdmin
  const isSelf  = currentUser?.id === user.id

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 mt-16">
        {/* Back nav */}
        <div className="max-w-2xl mx-auto px-4 pt-5">
          <Link href="/community" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Community
          </Link>
        </div>

        {/* Profile header card */}
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <img src={user.avatar} alt={user.fullName}
                className={`w-20 h-20 rounded-full object-cover flex-shrink-0 ${isAdmin ? "ring-2 ring-purple-500/50" : ""}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{user.fullName}</h1>
                    {isAdmin ? (
                      <div className="mt-1.5"><AdminBadges /></div>
                    ) : null}
                  </div>

                  {!isSelf && currentUser && (
                    <button onClick={handleFollow}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                        following
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-[#FCD535]/10 text-[#FCD535] border border-[#FCD535]/30 hover:bg-[#FCD535]/20"
                      }`}>
                      {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {following ? "Following" : "Follow"}
                    </button>
                  )}
                </div>

                {user.bio && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{user.bio}</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border">
              {[
                { label: "Posts",     value: posts.length },
                { label: "Followers", value: followerCount },
                { label: "Following", value: followingCount },
                { label: "Likes",     value: totalLikes },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-base font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex border-b border-border mb-5">
            {(["content", "replies"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
                  tab === t
                    ? "text-foreground border-b-2 border-[#FCD535]"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {t === "content" ? "Posts" : "Replies"}
              </button>
            ))}
          </div>

          {tab === "content" && (
            <div className="space-y-4 pb-16">
              {posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No posts yet.</p>
              ) : (
                posts.map((post) => <MiniPostCard key={post.id} post={post} />)
              )}
            </div>
          )}

          {tab === "replies" && (
            <div className="pb-16">
              <p className="text-center text-muted-foreground py-10">Replies coming soon.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
