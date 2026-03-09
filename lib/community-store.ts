// Community data store — uses localStorage for persistence

export type TraderLevel = "Beginner" | "Trader" | "Pro Trader" | "Master Trader"

export interface CommunityUser {
  id: string
  fullName: string
  email: string
  phone: string
  level: TraderLevel
  avatar: string
  createdAt: string
  // admin-only fields
  ipAddress?: string
  location?: string
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
  authorLevel: TraderLevel
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
  content: string
  title?: string           // article only
  imageUrl?: string
  tradeIdea?: TradeIdea
  hashtags: string[]
  likes: string[]          // array of user IDs
  comments: Comment[]
  createdAt: string
}

const USERS_KEY = "og_community_users"
const POSTS_KEY = "og_community_posts"
const SESSION_KEY = "og_community_session"

// ---- helpers ----------------------------------------------------------------

function readUsers(): CommunityUser[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") } catch { return [] }
}

function writeUsers(users: CommunityUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readPosts(): Post[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]") } catch { return [] }
}

function writePosts(posts: Post[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
}

// ---- avatar placeholder -----------------------------------------------------

const LEVEL_COLORS: Record<TraderLevel, string> = {
  Beginner: "6366f1",
  Trader: "10b981",
  "Pro Trader": "f59e0b",
  "Master Trader": "FCD535",
}

export function avatarUrl(name: string, level: TraderLevel): string {
  const color = LEVEL_COLORS[level]
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&bold=true`
}

// ---- session ----------------------------------------------------------------

export function getSession(): CommunityUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setSession(user: CommunityUser | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  else localStorage.removeItem(SESSION_KEY)
}

// ---- auth -------------------------------------------------------------------

export function signUp(data: {
  fullName: string
  email: string
  phone: string
  level: TraderLevel
}): { ok: boolean; error?: string; user?: CommunityUser } {
  const users = readUsers()
  if (users.find((u) => u.email === data.email))
    return { ok: false, error: "Email already registered." }
  if (users.find((u) => u.phone === data.phone))
    return { ok: false, error: "Phone number already registered." }

  const user: CommunityUser = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    level: data.level,
    avatar: avatarUrl(data.fullName, data.level),
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  writeUsers(users)
  setSession(user)
  return { ok: true, user }
}

export function signIn(identifier: string): {
  ok: boolean
  error?: string
  user?: CommunityUser
} {
  const users = readUsers()
  const user = users.find(
    (u) => u.email === identifier || u.phone === identifier
  )
  if (!user) return { ok: false, error: "No account found with that email or phone." }
  setSession(user)
  return { ok: true, user }
}

// ---- posts ------------------------------------------------------------------

export function getPosts(): Post[] {
  const posts = readPosts()
  if (posts.length === 0) return seedPosts()
  return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function createPost(data: Omit<Post, "id" | "likes" | "comments" | "createdAt">): Post {
  const posts = readPosts()
  const post: Post = {
    ...data,
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  }
  posts.unshift(post)
  writePosts(posts)
  return post
}

export function toggleLike(postId: string, userId: string): Post[] {
  const posts = readPosts()
  const post = posts.find((p) => p.id === postId)
  if (!post) return posts
  const idx = post.likes.indexOf(userId)
  if (idx === -1) post.likes.push(userId)
  else post.likes.splice(idx, 1)
  writePosts(posts)
  return getPosts()
}

export function addComment(postId: string, comment: Omit<Comment, "id" | "createdAt">): Post[] {
  const posts = readPosts()
  const post = posts.find((p) => p.id === postId)
  if (!post) return posts
  post.comments.push({
    ...comment,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  })
  writePosts(posts)
  return getPosts()
}

// ---- seed data --------------------------------------------------------------

function seedPosts(): Post[] {
  const seed: Post[] = [
    {
      id: "seed1",
      type: "post",
      authorId: "admin1",
      authorName: "Shahid Bashir",
      authorAvatar: avatarUrl("Shahid Bashir", "Master Trader"),
      authorLevel: "Master Trader",
      content: "Gold is approaching a key supply zone around 2350. Watch for bearish order blocks before entering. Always wait for confirmation — patience is your edge. #XAUUSD #SMC",
      hashtags: ["XAUUSD", "SMC"],
      likes: [],
      comments: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "seed2",
      type: "article",
      authorId: "admin1",
      authorName: "Shahid Bashir",
      authorAvatar: avatarUrl("Shahid Bashir", "Master Trader"),
      authorLevel: "Master Trader",
      title: "Why Most Traders Lose — The Psychology Behind Failed Trades",
      content: "The number one reason traders blow accounts is not a bad strategy. It is poor risk management and emotional decision making. When you enter a trade without a clear invalidation point, you are gambling, not trading. Define your risk before you define your reward. Set your SL, set your TP, and walk away.",
      hashtags: ["Psychology", "RiskManagement"],
      likes: [],
      comments: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: "seed3",
      type: "post",
      authorId: "admin1",
      authorName: "Shahid Bashir",
      authorAvatar: avatarUrl("Shahid Bashir", "Master Trader"),
      authorLevel: "Master Trader",
      content: "Live trade idea — EURUSD. Watching for a sweep of liquidity below 1.0820 before expecting a reversal to 1.0890. ICT concept: liquidity sweep + FVG fill. #EURUSD #ICT",
      tradeIdea: {
        asset: "EURUSD",
        entry: "1.0820",
        stopLoss: "1.0790",
        target: "1.0890",
      },
      hashtags: ["EURUSD", "ICT"],
      likes: [],
      comments: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
  ]
  writePosts(seed)
  return seed
}

// ---- time formatting --------------------------------------------------------

export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
