# Mobile Deployment & UA Setup Checklist (Capacitor + S2S Backend)

## 1. Add Native Platforms (Run on Mac for iOS, Linux/Win/Mac for Android)
```bash
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
npm run cap:sync
```

## 2. Production SDK Plugins to Install Before Store Submission
* **IAP & Receipt Validation (RevenueCat):** `npm install @revenuecat/purchases-capacitor`
* **Attribution & SKAN (AppsFlyer):** `npm install appsflyer-capacitor-plugin`
* **Ad Mediation (AppLovin MAX):** Install MAX Capacitor plugin and map `AdManager` placements (`rv_extra_box`, `rv_booster`, `rv_revive`, `rv_2x_coins`, `inter_post_level`).

## 3. Deploy S2S Anti-Fraud & Offerwall Postback Worker
```bash
npx wrangler secret put POSTBACK_SECRET
npx wrangler secret put FREECASH_POSTBACK_URL
npx wrangler secret put SCRAMBLY_POSTBACK_URL
npx wrangler deploy backend/s2s-postback-worker.ts
```

## 4. Store & Financial Checklist
1. Enroll in **Apple App Store Small Business Program** (15% fee under $1M/yr) and **Google Play 15% Service Fee Tier**.
2. Configure **Play Integrity API** (Android) and **App Attest** (iOS) to reject emulator/rooted offerwall traffic.
3. Upload `dist-playable/index.html` directly to **AppLovin / Meta Playable Ad Previewer** for CPI creative tests.
