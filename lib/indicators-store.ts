import { createClient } from "@/lib/supabase/client"

export type IndicatorCategory = "SMC" | "ICT" | "Liquidity" | "Sessions" | "Tools" | "Price Action"

export interface Indicator {
  id:               string
  name:             string
  creator:          string
  category:         IndicatorCategory
  description:      string | null
  tradingview_link: string | null
  thumbnail_url:    string | null
  is_published:     boolean
  created_at:       string
  updated_at:       string
}

export type IndicatorInsert = Omit<Indicator, "id" | "created_at" | "updated_at">
export type IndicatorUpdate = Partial<IndicatorInsert> & { id: string }

const supabase = createClient()

export async function listIndicators(publishedOnly = true): Promise<Indicator[]> {
  let q = supabase.from("indicators").select("*").order("created_at", { ascending: false })
  if (publishedOnly) q = q.eq("is_published", true)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createIndicator(payload: IndicatorInsert): Promise<Indicator> {
  const { data, error } = await supabase.from("indicators").insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateIndicator({ id, ...payload }: IndicatorUpdate): Promise<Indicator> {
  const { data, error } = await supabase
    .from("indicators")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteIndicator(id: string): Promise<void> {
  const { error } = await supabase.from("indicators").delete().eq("id", id)
  if (error) throw error
}
