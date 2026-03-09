import { Header } from "@/components/header"

export default function IctBasicPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">ICT Basic</h1>
          <p className="text-muted-foreground">Content coming soon.</p>
        </div>
      </main>
    </div>
  )
}
