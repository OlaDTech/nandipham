import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
// esm.sh exposes this CommonJS package as a default export at runtime.
// @ts-ignore The upstream declaration describes named exports instead.
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders })

const supportedPlatforms = new Set(['1688', 'taobao', 'pinduoduo', 'other'])

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function getClientSession(req: Request) {
  const authorization = req.headers.get('Authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) return { error: 'Client sign-in is required.' }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return { error: 'Server configuration is incomplete' }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const tokenHash = await hashToken(token)
  const { data: session, error } = await admin
    .from('client_sessions')
    .select('id, client_id')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !session) return { error: 'Your secure client session has expired. Please sign in again.' }
  await admin.from('client_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', session.id)
  return { admin, clientId: session.client_id, sessionId: session.id }
}

function text(value: unknown, maxLength: number) {
  return String(value || '').trim().slice(0, maxLength)
}

function marketplaceUrl(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return null

  const explicitUrl = raw.match(/https?:\/\/[^\s"'<>]+/i)?.[0]
  const protocolRelativeUrl = raw.match(/\/\/[^\s"'<>]+/i)?.[0]
  const domainUrl = raw.match(/(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s"'<>]*)?/i)?.[0]
  const candidate = explicitUrl || protocolRelativeUrl || domainUrl || raw
  const cleaned = candidate
    .trim()
    .replace(/^\/\//, 'https://')
    .replace(/[)\]},，。；;、]+$/g, '')
  const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`

  try {
    const parsed = new URL(withProtocol)
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const context = await getClientSession(req)
    if (context.error !== undefined) return json({ error: context.error }, context.error.includes('configuration') ? 500 : 401)
    const { admin, clientId } = context

    if (req.method === 'GET') {
      const [clientResult, goodsResult, announcementsResult, suppliersResult, messagesResult, receiptsResult, settingsResult, purchasesResult] = await Promise.all([
        admin.from('clients').select('id, full_name, phone, country, state, shipping_mark, notes, created_at, updated_at').eq('id', clientId).single(),
        admin.from('goods').select('id, client_id, description, type, tracking_no, status, notes, photos, cbm, created_at, updated_at').eq('client_id', clientId).order('created_at', { ascending: false }),
        admin.from('announcements').select('id, title, body, is_important, created_at').order('created_at', { ascending: false }),
        admin.from('suppliers').select('id, name, contact, category, address, photos, notes, created_at').order('name'),
        admin.from('messages').select('id, sender, message, is_read, created_at').eq('client_id', clientId).order('created_at'),
        admin.from('receipts').select('id, receipt_no, goods_id, items, subtotal, discount, total, currency, status, issued_at, paid_at').eq('client_id', clientId).order('issued_at', { ascending: false }),
        admin.from('settings').select('key, value'),
        admin.from('purchase_requests').select('id, platform, product_name, variant, quantity, status, quoted_amount_rmb, team_notes, created_at, updated_at').eq('client_id', clientId).order('created_at', { ascending: false }),
      ])

      if (clientResult.error || goodsResult.error || announcementsResult.error || suppliersResult.error || messagesResult.error || receiptsResult.error || settingsResult.error || purchasesResult.error) {
        return json({ error: 'Could not load your client portal.' }, 500)
      }

      return json({
        client: clientResult.data,
        goods: goodsResult.data || [],
        announcements: announcementsResult.data || [],
        suppliers: suppliersResult.data || [],
        messages: messagesResult.data || [],
        receipts: receiptsResult.data || [],
        settings: Object.fromEntries((settingsResult.data || []).map(item => [item.key, item.value])),
        purchase_requests: purchasesResult.data || [],
      })
    }

    const rawBody = await req.text()
    if (rawBody.length > 16384) return json({ error: 'Request is too large.' }, 413)
    const body = JSON.parse(rawBody)
    const action = text(body.action, 40)

    if (action === 'update_account') {
      const current = String(body.current_password || '')
      const next = String(body.new_password || '')
      const name = String(body.full_name || '').trim(), phone = String(body.phone || '').trim()
      const country = String(body.country || '').trim(), state = String(body.state || '').trim()
      if (!current || new TextEncoder().encode(current).length > 72) return json({ error: 'Enter your current password.' }, 400)
      if (name.length < 2 || name.length > 120 || country.length < 2 || country.length > 80 || state.length < 2 || state.length > 100 || !/^\+[1-9][0-9]{7,14}$/.test(phone)) return json({ error: 'Check your details. Use an international phone number, e.g. +26771234567.' }, 400)
      if (next && (next.length < 10 || new TextEncoder().encode(next).length > 72)) return json({ error: 'New password must have at least 10 characters and no more than 72 UTF-8 bytes.' }, 400)
      const limit = await admin.rpc('registration_allow_attempt', { p_key: `account:${clientId}` })
      if (limit.error) return json({ error: 'Account updates are unavailable. Try again later.' }, 503)
      if (!limit.data) return json({ error: 'Too many account update attempts. Try again in one hour.' }, 429)
      const account = await admin.from('clients').select('password_hash').eq('id', clientId).single()
      if (account.error || !account.data) return json({ error: 'Could not verify your account.' }, 403)
      const hash = account.data.password_hash
      const verified = hash.startsWith('$2') ? await bcrypt.compare(current, hash) : current === hash
      if (!verified) return json({ error: 'Current password is incorrect.' }, 403)
      const result = await admin.rpc('update_client_account', { p_client: clientId, p_session: context.sessionId,
        p_expected_hash: hash, p_name: name, p_phone: phone, p_country: country, p_state: state,
        p_new_hash: next ? await bcrypt.hash(next, 12) : null })
      if (result.error) return json({ error: result.error.code === 'P0001' ? result.error.message : 'Could not save account changes. Contact support if the problem continues.' }, 400)
      return json({ client: result.data })
    }

    if (action === 'get_messages') {
      const { data, error } = await admin.from('messages').select('id,sender,message,is_read,created_at').eq('client_id', clientId).order('created_at')
      return error ? json({ error: 'Could not refresh messages.' }, 500) : json({ messages: data || [] })
    }

    if (action === 'send_message') {
      const message = text(body.message, 2000)
      if (!message) return json({ error: 'Enter a message before sending.' }, 400)
      const { data, error } = await admin.from('messages').insert({ client_id: clientId, sender: 'client', message }).select('id, sender, message, is_read, created_at').single()
      return error ? json({ error: 'Could not send your message.' }, 500) : json({ message: data })
    }

    if (action === 'mark_messages_read') {
      const { error } = await admin.from('messages').update({ is_read: true }).eq('client_id', clientId).neq('sender', 'client').eq('is_read', false)
      return error ? json({ error: 'Could not clear message notifications.' }, 500) : json({ success: true })
    }

    if (action === 'submit_purchase_request') {
      const platform = text(body.platform, 20).toLowerCase()
      const productLink = marketplaceUrl(body.product_link)
      const quantity = Math.min(10000, Math.max(1, Number.parseInt(String(body.quantity || 1), 10) || 1))
      if (!productLink || !supportedPlatforms.has(platform)) {
        return json({ error: 'Enter a valid marketplace link and platform.' }, 400)
      }

      const { data, error } = await admin.from('purchase_requests').insert({
        client_id: clientId,
        platform,
        product_link: productLink,
        product_name: text(body.product_name, 250) || null,
        variant: text(body.variant, 250) || null,
        quantity,
        notes: text(body.notes, 2000) || null,
      }).select('id, platform, product_name, variant, quantity, status, created_at').single()
      return error ? json({ error: 'Could not submit your purchase request.' }, 500) : json({ purchase_request: data })
    }

    if (action === 'pay_receipt') {
      const receiptId = text(body.receipt_id, 80)
      if (!receiptId) return json({ error: 'Choose a receipt to pay.' }, 400)
      const { data, error } = await admin.rpc('pay_wallet_receipt', {
        p_client_id: clientId,
        p_receipt_id: receiptId,
        p_initiated_by_client: true,
      })
      return error ? json({ error: error.message || 'Could not pay this receipt from your wallet.' }, 400) : json({ transaction: data })
    }

    if (action === 'pay_purchase_request') {
      const purchaseRequestId = text(body.purchase_request_id, 80)
      if (!purchaseRequestId) return json({ error: 'Choose a purchase request to pay.' }, 400)
      const { data, error } = await admin.rpc('pay_wallet_purchase', {
        p_client_id: clientId,
        p_purchase_request_id: purchaseRequestId,
        p_initiated_by_client: true,
      })
      return error ? json({ error: error.message || 'Could not pay this purchase request from your wallet.' }, 400) : json({ transaction: data })
    }

    return json({ error: 'Unknown client portal action.' }, 400)
  } catch {
    return json({ error: 'Could not process your request right now.' }, 500)
  }
})
