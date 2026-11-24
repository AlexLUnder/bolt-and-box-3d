import { Capacitor } from '@capacitor/core';

/**
 * Production Native SDK Bridge (Capacitor -> iOS / Android).
 * In browser preview, falls back cleanly to the built-in mock AdManager & StoreManager.
 * On native builds (TestFlight / Play Internal), wire:
 *  - AppLovin MAX: @capacitor-community/admob or custom MAX Capacitor plugin
 *  - RevenueCat: @revenuecat/purchases-capacitor (StoreKit 2 / Play Billing v6)
 *  - AppsFlyer: appsflyer-capacitor-plugin (attribution + SKAN + S2S click_id)
 */

export interface NativeAttribution {
  appsflyerId: string;
  mediaSource: string; // e.g. 'freecash', 'scrambly', 'mistplay', 'applovin_int', 'organic'
  clickId: string;
  campaign: string;
}

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatformName = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

export async function sendS2sMilestone(params: {
  backendUrl: string;
  userId: string;
  clickId: string;
  mediaSource: string;
  eventName: string;
  level: number;
  elapsedSec: number;
  receiptToken?: string;
  revenueUsd?: number;
}): Promise<{ ok: boolean; status?: string }> {
  if (!params.backendUrl) {
    return { ok: true, status: 'LOCAL_SIMULATION' };
  }
  try {
    const res = await fetch(`${params.backendUrl}/api/v1/milestone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId,
        click_id: params.clickId,
        media_source: params.mediaSource,
        event_name: params.eventName,
        level: params.level,
        elapsed_sec: params.elapsedSec,
        receipt_token: params.receiptToken ?? null,
        revenue_usd: params.revenueUsd ?? 0,
        platform: getPlatformName()
      })
    });
    const json = await res.json();
    return { ok: res.ok, status: json.status };
  } catch {
    return { ok: false, status: 'NETWORK_ERROR' };
  }
}
