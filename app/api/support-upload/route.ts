import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const uploaded: Record<string, string> = {}

    const fileKeys = ["bankStatement", "upiScreenshot", "screenRecording", "walletScreenshot"]

    for (const key of fileKeys) {
      const file = formData.get(key)
      if (file && file instanceof File && file.size > 0) {
        const ext = file.name.split(".").pop() ?? "bin"
        const blob = await put(`support/${Date.now()}-${key}.${ext}`, file, {
          access: "public",
        })
        uploaded[key] = blob.url
      }
    }

    return NextResponse.json({ ok: true, urls: uploaded })
  } catch (err) {
    console.error("[v0] support-upload error:", err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
