import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { query, queryOne } from "@/lib/db"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
async function authenticatedProfile() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data: profile, error: profileError } = await supabase
    .from("p2p_user_profiles")
    .select("user_id, full_name, email, phone")
    .eq("user_id", user.id)
    .maybeSingle()
  if (profileError || !profile) return null
  return profile
}
export async function GET() {
  const profile = await authenticatedProfile()
  const userId = profile?.user_id
  if (!userId) return NextResponse.json({ok:false,error:"Sign in required"},{status:401})
  try {
    const rows=await query("SELECT * FROM usdt_sell_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500",[userId])
    return NextResponse.json({ok:true,data:rows.map(r=>({id:r.id,userId:r.user_id??"",name:r.name??"",email:r.email??"",phone:r.phone??"",telegram:r.telegram??"",upiId:r.upi_id??"",upiName:r.upi_name??"",paymentMethodType:r.payment_method_type??"",walletAddress:r.wallet_address??"",usdtAmount:r.amount_usdt??"",txId:r.transaction_id??"",screenshotUrl:r.screenshot_url??"",notificationStatus:r.notification_status??"UNREAD",status:r.status??"pending",createdAt:r.created_at}))},{headers:{"Cache-Control":"private, no-store"}})
  } catch(error) {console.error("[p2p/sell GET]",error);return NextResponse.json({ok:false,error:"Could not load your sell history."},{status:500})}
}
export async function POST(request:NextRequest) {
  const profile=await authenticatedProfile()
  const userId=profile?.user_id
  if(!userId)return NextResponse.json({ok:false,error:"Sign in required"},{status:401})
  const b=await request.json().catch(()=>({}))
  const amount=String(b.usdtAmount??b.amount_usdt??"").trim()
  if(!amount||!/^(?:\d+(?:\.\d{1,6})?)$/.test(amount)||(Number(amount)<50 || Number(amount)>5000))return NextResponse.json({ok:false,error:"Sell quantity must be between 50 and 5,000 USDT."},{status:400})
  try {
    const pricing=await queryOne<{value:{p2p_sell_rate?:string}}>("SELECT value FROM admin_settings WHERE key = 'pricing'")
    const rate=Number(pricing?.value?.p2p_sell_rate ?? 102)
    if(!Number.isFinite(rate)||rate<99||rate>102.5)return NextResponse.json({ok:false,error:"The current sell rate is unavailable. Please contact support."},{status:503})
    const inrEquivalent=(Number(amount)*rate).toFixed(2)
    const rows=await query(`INSERT INTO usdt_sell_requests (user_id,name,email,phone,telegram,upi_id,upi_name,payment_method_type,wallet_address,amount_usdt,rate_inr,inr_equivalent,transaction_id,screenshot_url,status,notification_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending','UNREAD') RETURNING id`,[userId,profile.full_name,profile.email,profile.phone,b.telegram??null,b.upiId??null,b.upiName??null,b.paymentMethodType??null,b.walletAddress??null,amount,rate,inrEquivalent,b.txId??b.transaction_id??null,b.screenshotUrl??null])
    return NextResponse.json({ok:true,id:rows[0]?.id??null})
  } catch(error) {console.error("[p2p/sell POST]",error);return NextResponse.json({ok:false,error:"Could not submit your sell request."},{status:500})}
}
