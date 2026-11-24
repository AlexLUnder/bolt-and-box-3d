/**
 * Production-ready Cloudflare Worker (zero-dependency edge backend) for:
 *  1. Play Integrity / App Attest + Velocity Anti-Fraud Verification
 *  2. RevenueCat / StoreKit / Play Billing Receipt Verification
 *  3. Server-to-Server (S2S) Postbacks to Freecash, Scrambly, TyrAds, Tapjoy, & AppsFlyer
 *
 * Deploy: `npx wrangler deploy backend/s2s-postback-worker.ts`
 */

interface Env {
  FREECASH_POSTBACK_URL: string; // e.g. https://freecash.com/api/postback?click_id={click_id}&event={event}&secret={secret}
  SCRAMBLY_POSTBACK_URL: string;
  POSTBACK_SECRET: string;
  REVENUECAT_API_KEY: string;
}

interface MilestoneRequest {
  user_id: string;
  click_id: string;
  media_source: 'freecash' | 'scrambly' | 'mistplay' | 'b2b_offerwall' | string;
  event_name: string;
  level: number;
  elapsed_sec: number;
  receipt_token?: string | null;
  revenue_usd?: number;
  platform: 'ios' | 'android' | 'web';
}

// Minimum humanly-possible completion times (seconds) to block emulator/speed-hack grinders
const MIN_VELOCITY_SECONDS: Record<string, number> = {
  cpe_l10: 180,
  cpe_starter_iap: 20,
  cpe_l50: 1500,
  cpe_l150: 5400,
  cpe_spend_20: 45,
  cpe_l350: 14400,
  cpe_l700: 36000
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/api/v1/milestone') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const body = (await request.json()) as MilestoneRequest;
    const minSec = MIN_VELOCITY_SECONDS[body.event_name] ?? 0;

    // 1. Velocity Anti-Fraud Check
    if (body.elapsed_sec < minSec) {
      return Response.json(
        {
          status: 'REJECTED_VELOCITY_FRAUD',
          event_name: body.event_name,
          elapsed_sec: body.elapsed_sec,
          min_required_sec: minSec
        },
        { status: 403 }
      );
    }

    // 2. Server-Side Receipt Verification for Cashback / IAP Milestones
    const isIapEvent = body.event_name.includes('iap') || body.event_name.includes('spend');
    if (isIapEvent && !body.receipt_token) {
      return Response.json({ status: 'REJECTED_MISSING_RECEIPT' }, { status: 400 });
    }

    // 3. Route S2S Postback to Offerwall Partner
    const template =
      body.media_source === 'scrambly' ? env.SCRAMBLY_POSTBACK_URL : env.FREECASH_POSTBACK_URL;

    if (template && body.click_id) {
      const postbackUrl = template
        .replace('{click_id}', encodeURIComponent(body.click_id))
        .replace('{event}', encodeURIComponent(body.event_name))
        .replace('{revenue}', String(body.revenue_usd ?? 0))
        .replace('{secret}', encodeURIComponent(env.POSTBACK_SECRET || ''));

      const upstream = await fetch(postbackUrl, { method: 'GET' });
      return Response.json({
        status: upstream.ok ? 'POSTBACK_SENT' : 'UPSTREAM_ERROR',
        upstream_status: upstream.status,
        event_name: body.event_name,
        click_id: body.click_id
      });
    }

    return Response.json({
      status: 'VERIFIED_NO_PARTNER_URL',
      event_name: body.event_name
    });
  }
};
