import ProfileWrapper from "./profile-wrapper"

// Disable static generation — this page relies on client-side session state.
export const dynamic = "force-dynamic"

export default function ProfilePage() {
  return <ProfileWrapper />
}
