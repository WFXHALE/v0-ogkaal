# WhatsApp P2P order alerts

OG KAAL TRADER sends an internal WhatsApp alert after a P2P buy or sell request has been successfully inserted into the database. A WhatsApp delivery failure does not cancel or roll back the order.

## Meta setup

1. Create or use a Meta Business Portfolio and a WhatsApp Business Account.
2. Set up the WhatsApp Cloud API and add a business phone number.
3. Generate a permanent or long-lived system-user access token with permission to send WhatsApp messages.
4. In WhatsApp Manager, create and get approval for a **Utility** template named `p2p_order_alert` in English (`en`). Use this body, with the seven numbered variables in this exact order:

   ```text
   New P2P order received
   Order ID: {{1}}
   Type: {{2}}
   Customer: {{3}}
   Phone: {{4}}
   Amount: {{5}} USDT
   Rate: INR {{6}} per USDT
   Total: INR {{7}}
   Please review this order in the admin panel.
   ```

5. Add the following server-only environment variables to the Vercel project for Preview and Production:

   | Variable | Value |
   | --- | --- |
   | `WHATSAPP_ACCESS_TOKEN` | Meta Cloud API access token |
   | `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID from the WhatsApp API setup |
   | `WHATSAPP_ADMIN_NUMBER` | Your receiving WhatsApp number, preferably international format such as `919876543210` |
   | `WHATSAPP_ORDER_TEMPLATE` | `p2p_order_alert` (optional; this is the default) |
   | `WHATSAPP_TEMPLATE_LANGUAGE` | `en` (optional; this is the default) |
   | `WHATSAPP_GRAPH_API_VERSION` | `v26.0` (optional; this is the default) |

6. Redeploy after setting the variables. Keep the access token server-side; do not use a `NEXT_PUBLIC_` prefix or place it in browser code.

## What gets sent

Each successful BUY or SELL order triggers one alert containing order ID, order type, customer name, customer phone, USDT amount, INR rate, and INR total. Alerts go only to the configured admin number. No customer message is sent.

## Notes

- Meta must approve the template before the API can send it.
- Meta may charge for delivered template messages under its current pricing rules.
- Test with a small order in Preview before enabling the integration in Production.
- If credentials are missing or Meta rejects a message, the order still saves; the failure is logged server-side.
