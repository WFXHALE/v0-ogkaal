type P2POrderAlert = {
  id: string | number
  orderType: "BUY" | "SELL"
  customerName?: string | null
  customerPhone?: string | null
  amountUsdt: string
  rateInr: number
  inrTotal: string
}

/**
 * Sends an internal order alert to the shop owner's WhatsApp number.
 * Configure the Meta WhatsApp Cloud API credentials as server-only Vercel
 * environment variables. Failures are logged but never undo a saved order.
 */
export async function notifyAdminOfP2POrder(order: P2POrderAlert): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const adminNumberRaw = process.env.WHATSAPP_ADMIN_NUMBER
  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE || "p2p_order_alert"
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en"

  if (!accessToken || !phoneNumberId || !adminNumberRaw) {
    console.info("[WhatsApp] Order alert skipped: Cloud API environment variables are not configured.")
    return
  }

  const cleanedAdminNumber = adminNumberRaw.replace(/[^\d]/g, "").replace(/^0+/, "")
  const adminNumber = cleanedAdminNumber.length === 10 ? `91${cleanedAdminNumber}` : cleanedAdminNumber
  if (adminNumber.length < 10 || adminNumber.length > 15) {
    console.error("[WhatsApp] Order alert skipped: WHATSAPP_ADMIN_NUMBER must be in international format.")
    return
  }

  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v26.0"
  const parameters = [
    String(order.id),
    order.orderType,
    order.customerName?.trim() || "Not provided",
    order.customerPhone?.trim() || "Not provided",
    order.amountUsdt,
    String(order.rateInr),
    order.inrTotal,
  ].map((value) => ({ type: "text", text: value }))

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: adminNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [{ type: "body", parameters }],
        },
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      console.error("[WhatsApp] Order alert failed:", response.status, errorBody?.error?.message || "Meta API request failed")
    }
  } catch (error) {
    console.error("[WhatsApp] Order alert request failed:", error instanceof Error ? error.message : "Unknown error")
  }
}
