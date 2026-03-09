// Community data store — Supabase-backed
import { createClient } from "@/lib/supabase/client"

export type TraderLevel = "Beginner" | "Trader" | "Pro Trader" | "Master Trader"

export interface CommunityUser {
  id: string
  fullName: string
  email: string
  phone: string
  level: TraderLevel
  bio?: string
  avatar: string
  createdAt: string
  isAdmin?: boolean
}

export interface TradeIdea {
  asset: string
  entry: string
  stopLoss: string
  target: string
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  content: string
  createdAt: string
}

export interface Post {
  id: string
  type: "post" | "article"
  authorId: string
  authorName: string
  authorAvatar: string
  authorLevel: TraderLevel
  isAdminPost?: boolean
  content: string
  title?: string
  imageUrl?: string
  tradeIdea?: TradeIdea
  hashtags: string[]
  likes: string[]      // array of user IDs who liked
  comments: Comment[]
  createdAt: string
}

const SESSION_KEY = "og_community_session"

// ── avatar ────────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<TraderLevel, string> = {
  Beginner:        "6366f1",
  Trader:          "10b981",
  "Pro Trader":    "f59e0b",
  "Master Trader": "FCD535",
}

export function avatarUrl(name: string, level: TraderLevel): string {
  const color    = LEVEL_COLORS[level]
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&bold=true`
}

// ── session (localStorage — client only) ─────────────────────────────────────

export function getSession(): CommunityUser | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") } catch { return null }
}
export function setSession(user: CommunityUser | null) {
  if (typeof window === "undefined") return
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  else localStorage.removeItem(SESSION_KEY)
}

// ── helpers: row → domain ─────────────────────────────────────────────────────

function rowToUser(r: Record<string, unknown>): CommunityUser {
  return {
    id:        r.id as string,
    fullName:  r.full_name as string,
    email:     r.email as string,
    phone:     r.phone as string,
    level:     r.level as TraderLevel,
    bio:       r.bio as string | undefined,
    avatar:    r.avatar as string,
    isAdmin:   r.is_admin as boolean | undefined,
    createdAt: r.created_at as string,
  }
}

function rowToPost(r: Record<string, unknown>, likes: string[], comments: Comment[]): Post {
  return {
    id:          r.id as string,
    type:        r.type as "post" | "article",
    authorId:    r.author_id as string,
    authorName:  r.author_name as string,
    authorAvatar:r.author_avatar as string,
    authorLevel: r.author_level as TraderLevel,
    isAdminPost: r.is_admin_post as boolean | undefined,
    content:     r.content as string,
    title:       r.title as string | undefined,
    imageUrl:    r.image_url as string | undefined,
    tradeIdea:   r.trade_idea as TradeIdea | undefined,
    hashtags:    (r.hashtags as string[]) ?? [],
    createdAt:   r.created_at as string,
    likes,
    comments,
  }
}

function rowToComment(r: Record<string, unknown>): Comment {
  return {
    id:           r.id as string,
    authorId:     r.author_id as string,
    authorName:   r.author_name as string,
    authorAvatar: r.author_avatar as string,
    content:      r.content as string,
    createdAt:    r.created_at as string,
  }
}

// ── auth ──────────────────────────────────────────────────────────────────────

export const ADMIN_ID = "admin_shahid"

export async function signUp(data: { fullName: string; email: string; phone: string; level: TraderLevel }): Promise<{
  ok: boolean; error?: string; user?: CommunityUser
}> {
  const sb = createClient()
  // Check uniqueness
  const { data: existing } = await sb
    .from("community_users")
    .select("id, email, phone")
    .or(`email.eq.${data.email},phone.eq.${data.phone}`)
    .limit(1)
  if (existing && existing.length > 0) {
    const hit = existing[0] as { email: string; phone: string }
    if (hit.email === data.email) return { ok: false, error: "Email already registered." }
    return { ok: false, error: "Phone already registered." }
  }
  const user: CommunityUser = {
    id:        Date.now().toString() + Math.random().toString(36).slice(2, 7),
    fullName:  data.fullName,
    email:     data.email,
    phone:     data.phone,
    level:     data.level,
    avatar:    avatarUrl(data.fullName, data.level),
    createdAt: new Date().toISOString(),
  }
  const { error } = await sb.from("community_users").insert({
    id:         user.id,
    full_name:  user.fullName,
    email:      user.email,
    phone:      user.phone,
    level:      user.level,
    avatar:     user.avatar,
    is_admin:   false,
    created_at: user.createdAt,
  })
  if (error) return { ok: false, error: error.message }
  setSession(user)
  return { ok: true, user }
}

export async function signIn(identifier: string): Promise<{ ok: boolean; error?: string; user?: CommunityUser }> {
  const sb = createClient()
  const { data } = await sb
    .from("community_users")
    .select("*")
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .limit(1)
  if (!data || data.length === 0) return { ok: false, error: "No account found with that email or phone." }
  const user = rowToUser(data[0] as Record<string, unknown>)
  setSession(user)
  return { ok: true, user }
}

// ── posts ─────────────────────────────────────────────────────────────────────

async function fetchPostsWithData(postRows: Record<string, unknown>[]): Promise<Post[]> {
  if (postRows.length === 0) return []
  const sb = createClient()
  const ids = postRows.map((r) => r.id as string)

  const [{ data: likesData }, { data: commentsData }] = await Promise.all([
    sb.from("community_likes").select("post_id, user_id").in("post_id", ids),
    sb.from("community_comments").select("*").in("post_id", ids).order("created_at", { ascending: true }),
  ])

  const likesByPost: Record<string, string[]> = {}
  for (const l of (likesData ?? []) as Array<{ post_id: string; user_id: string }>) {
    if (!likesByPost[l.post_id]) likesByPost[l.post_id] = []
    likesByPost[l.post_id].push(l.user_id)
  }

  const commentsByPost: Record<string, Comment[]> = {}
  for (const c of (commentsData ?? []) as Array<Record<string, unknown>>) {
    const pid = c.post_id as string
    if (!commentsByPost[pid]) commentsByPost[pid] = []
    commentsByPost[pid].push(rowToComment(c))
  }

  return postRows.map((r) =>
    rowToPost(r, likesByPost[r.id as string] ?? [], commentsByPost[r.id as string] ?? [])
  )
}

export async function getPosts(): Promise<Post[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
  if (error || !data || data.length === 0) {
    return seedPosts()
  }
  return fetchPostsWithData(data as Record<string, unknown>[])
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  const sb = createClient()
  const { data } = await sb
    .from("community_posts")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
  if (!data) return []
  return fetchPostsWithData(data as Record<string, unknown>[])
}

export async function getUserById(id: string): Promise<CommunityUser | null> {
  const sb = createClient()
  const { data } = await sb
    .from("community_users")
    .select("*")
    .eq("id", id)
    .limit(1)
  if (data && data.length > 0) return rowToUser(data[0] as Record<string, unknown>)
  // Fallback for admin that hasn't been seeded yet
  if (id === ADMIN_ID) {
    return {
      id: ADMIN_ID,
      fullName: "Shahid Bashir",
      email: "",
      phone: "",
      level: "Master Trader",
      bio: "Founder of OG KAAL TRADER. Master Trader & Mentor.",
      avatar: avatarUrl("Shahid Bashir", "Master Trader"),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
      isAdmin: true,
    }
  }
  return null
}

export async function createPost(data: Omit<Post, "id" | "likes" | "comments" | "createdAt">): Promise<Post> {
  const sb = createClient()
  const post: Post = {
    ...data,
    id:        Date.now().toString() + Math.random().toString(36).slice(2, 7),
    likes:     [],
    comments:  [],
    createdAt: new Date().toISOString(),
  }
  const { error } = await sb.from("community_posts").insert({
    id:            post.id,
    type:          post.type,
    author_id:     post.authorId,
    author_name:   post.authorName,
    author_avatar: post.authorAvatar,
    author_level:  post.authorLevel,
    is_admin_post: post.isAdminPost ?? false,
    content:       post.content,
    title:         post.title ?? null,
    image_url:     post.imageUrl ?? null,
    trade_idea:    post.tradeIdea ?? null,
    hashtags:      post.hashtags,
    created_at:    post.createdAt,
  })
  return post
}

export async function toggleLike(postId: string, userId: string): Promise<Post[]> {
  const sb = createClient()
  // Check if already liked
  const { data: existing } = await sb
    .from("community_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .limit(1)

  if (existing && existing.length > 0) {
    await sb.from("community_likes").delete().eq("post_id", postId).eq("user_id", userId)
  } else {
    await sb.from("community_likes").insert({ post_id: postId, user_id: userId })
  }
  return getPosts()
}

export async function addComment(postId: string, comment: Omit<Comment, "id" | "createdAt">): Promise<Post[]> {
  const sb = createClient()
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 5)
  await sb.from("community_comments").insert({
    id,
    post_id:       postId,
    author_id:     comment.authorId,
    author_name:   comment.authorName,
    author_avatar: comment.authorAvatar,
    content:       comment.content,
  })
  return getPosts()
}

// ── follows ───────────────────────────────────────────────────────────────────

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const sb = createClient()
  const { data } = await sb
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId)
    .limit(1)
  return !!(data && data.length > 0)
}

export async function toggleFollow(followerId: string, followeeId: string): Promise<boolean> {
  const sb = createClient()
  const { data: existing } = await sb
    .from("community_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId)
    .limit(1)

  if (existing && existing.length > 0) {
    await sb.from("community_follows").delete().eq("follower_id", followerId).eq("followee_id", followeeId)
    return false
  } else {
    await sb.from("community_follows").insert({ follower_id: followerId, followee_id: followeeId })
    return true
  }
}

export async function getFollowerCount(userId: string): Promise<number> {
  const sb = createClient()
  const { count } = await sb
    .from("community_follows")
    .select("followee_id", { count: "exact", head: true })
    .eq("followee_id", userId)
  return count ?? 0
}

export async function getFollowingCount(userId: string): Promise<number> {
  const sb = createClient()
  const { count } = await sb
    .from("community_follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("follower_id", userId)
  return count ?? 0
}

export async function getTotalLikes(userId: string): Promise<number> {
  const sb = createClient()
  // Get all post IDs by this user
  const { data: userPosts } = await sb
    .from("community_posts")
    .select("id")
    .eq("author_id", userId)
  if (!userPosts || userPosts.length === 0) return 0
  const postIds = userPosts.map((p: Record<string, unknown>) => p.id as string)
  const { count } = await sb
    .from("community_likes")
    .select("post_id", { count: "exact", head: true })
    .in("post_id", postIds)
  return count ?? 0
}

// ── seed ──────────────────────────────────────────────────────────────────────

async function seedPosts(): Promise<Post[]> {
  const sb = createClient()

  // Ensure admin user exists
  const { data: existing } = await sb.from("community_users").select("id").eq("id", ADMIN_ID).limit(1)
  if (!existing || existing.length === 0) {
    await sb.from("community_users").insert({
      id:         ADMIN_ID,
      full_name:  "Shahid Bashir",
      email:      "Swargakai@gmail.com",
      phone:      "0000000000",
      level:      "Master Trader",
      bio:        "Founder of OG KAAL TRADER. Master Trader & Mentor.",
      avatar:     avatarUrl("Shahid Bashir", "Master Trader"),
      is_admin:   true,
    })
  }

  const now = Date.now()
  const seeds = [
    {
      id: "seed1",
      type: "post",
      author_id: ADMIN_ID,
      author_name: "Shahid Bashir",
      author_avatar: avatarUrl("Shahid Bashir", "Master Trader"),
      author_level: "Master Trader",
      is_admin_post: true,
      content: "Gold is approaching a key supply zone around 2350. Watch for bearish order blocks before entering. Always wait for confirmation — patience is your edge.",
      hashtags: ["XAUUSD", "SMC"],
      created_at: new Date(now - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "seed2",
      type: "article",
      author_id: ADMIN_ID,
      author_name: "Shahid Bashir",
      author_avatar: avatarUrl("Shahid Bashir", "Master Trader"),
      author_level: "Master Trader",
      is_admin_post: true,
      title: "Why Most Traders Lose — The Psychology Behind Failed Trades",
      content: "The number one reason traders blow accounts is not a bad strategy. It is poor risk management and emotional decision making. Define your risk before you define your reward.",
      hashtags: ["Psychology", "RiskManagement"],
      created_at: new Date(now - 1000 * 60 * 90).toISOString(),
    },
    {
      id: "seed3",
      type: "post",
      author_id: ADMIN_ID,
      author_name: "Shahid Bashir",
      author_avatar: avatarUrl("Shahid Bashir", "Master Trader"),
      author_level: "Master Trader",
      is_admin_post: true,
      content: "Live trade idea — EURUSD. Watching for a sweep of liquidity below 1.0820 before expecting a reversal to 1.0890. ICT concept: liquidity sweep + FVG fill.",
      trade_idea: { asset: "EURUSD", entry: "1.0820", stopLoss: "1.0790", target: "1.0890" },
      hashtags: ["EURUSD", "ICT"],
      created_at: new Date(now - 1000 * 60 * 180).toISOString(),
    },
  ]

  // Upsert seeds (won't fail if they already exist)
  await sb.from("community_posts").upsert(seeds, { onConflict: "id" })

  return fetchPostsWithData(seeds as unknown as Record<string, unknown>[])
}

// ── time ──────────────────────────────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
