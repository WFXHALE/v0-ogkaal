import ProfileWrapper from "./profile-wrapper"

// Prevent Next.js from statically prerendering this page.
// Both directives are required: force-dynamic skips ISR caching,
// revalidate = 0 ensures no stale static snapshot is ever written.
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Page() {
  return <ProfileWrapper />
}
