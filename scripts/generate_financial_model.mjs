import ExcelJS from 'exceljs';
import path from 'node:path';

const wb = new ExcelJS.Workbook();
wb.creator = 'Bolt & Box 3D Financial Model';
wb.created = new Date();

const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
const accentFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
const subFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const boldFont = { bold: true, size: 10 };

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 24;
}

// ==========================================
// SHEET 1: Assumptions & Core Unit Economics
// ==========================================
const s1 = wb.addWorksheet('1_Assumptions');
s1.columns = [
  { header: 'Parameter', key: 'param', width: 38 },
  { header: 'Value', key: 'val', width: 18 },
  { header: 'Notes / Dataset Benchmark', key: 'note', width: 52 }
];
styleHeader(s1.getRow(1));

const assumptions = [
  ['Apple / Google Store Fee (Small Business)', 0.15, '15% under $1M/yr (change to 0.30 for standard tier)'],
  ['Blended Effective CPI (All Channels)', 5.25, 'Weighted across Paid Social ($4.50), O&O ($5.50), Freecash/Scrambly CPE ($5.20)'],
  ['Target D90 Blended LTV (Net of Store Fee)', 9.10, 'Dataset Hybrid-Casual US iOS/Android benchmark ($7.90-$12.60)'],
  ['IAA Share of D90 LTV', 0.55, 'Sweet spot: 55-65% IAA / 35-45% IAP (avoids Pure IAA stall)'],
  ['IAP Share of D90 LTV', { formula: '1-B5' }, 'Auto-calculated (1 - IAA Share)'],
  ['D30 Cumulative ROAS Curve Factor', 0.78, '78% of D90 LTV realized by D30 (Hybrid IAA-led benchmark)'],
  ['D60 Cumulative ROAS Curve Factor', 0.92, '92% of D90 LTV realized by D60'],
  ['D90 Cumulative ROAS Curve Factor', 1.00, '100% of D90 LTV realized by D90'],
  ['Monthly Fixed Studio / Server / SDK Overhead', 4500, 'Lean indie team + Cloudflare/RevenueCat/AppsFlyer'],
  ['Initial Working Capital Reserve (USD)', 35000, 'Cash buffer for D0-D30 UA float before ad/store payouts clear']
];

assumptions.forEach((r, idx) => {
  const row = s1.addRow({ param: r[0], val: r[1], note: r[2] });
  const c = row.getCell(2);
  if ([0, 3, 4, 5, 6, 7].includes(idx)) c.numFmt = '0.0%';
  else if ([1, 2].includes(idx)) c.numFmt = '$#,##0.00';
  else c.numFmt = '$#,##0';
});

s1.addRow([]);
const kpiHdr = s1.addRow(['Derived Unit Economics', 'Result', 'Interpretation']);
styleHeader(kpiHdr);

const derived = [
  ['D30 Blended ROAS', { formula: '(B4*B7)/B3' }, 'Target >= 100% for fast cash recycling', '0.0%'],
  ['D60 Blended ROAS', { formula: '(B4*B8)/B3' }, 'Strong profit compounding', '0.0%'],
  ['D90 Blended ROAS', { formula: '(B4*B9)/B3' }, 'Dataset Hybrid-Casual US iOS/Android target: 135%-175%', '0.0%'],
  ['Net Contribution Profit per Install (D90)', { formula: 'B4-B3' }, 'D90 Net LTV minus Blended CPI', '$#,##0.00'],
  ['D90 IAA Revenue per Install', { formula: 'B4*B5' }, 'Early cash-flow engine (RV + Interstitials)', '$#,##0.00'],
  ['D90 Net IAP Revenue per Install', { formula: 'B4*B6' }, 'Whale tail + Offerwall Cashback conversion', '$#,##0.00']
];

derived.forEach((d) => {
  const row = s1.addRow([d[0], d[1], d[2]]);
  row.getCell(1).font = boldFont;
  row.getCell(2).font = boldFont;
  row.getCell(2).numFmt = d[3];
});

// ==========================================
// SHEET 2: Freecash / Scrambly CPE Offer Ladder
// ==========================================
const s2 = wb.addWorksheet('2_CPE_Offer_Ladder');
s2.columns = [
  { header: 'Milestone Event (S2S)', key: 'ev', width: 28 },
  { header: 'Time Cap (Days)', key: 'cap', width: 14 },
  { header: 'Completion Rate %', key: 'cr', width: 16 },
  { header: 'Advertiser Payout ($)', key: 'pay', width: 18 },
  { header: 'Expected Payout / Install ($)', key: 'epay', width: 22 },
  { header: 'User Cumul. Net LTV ($)', key: 'ltv', width: 20 },
  { header: 'Cumulative Payout ($)', key: 'cpay', width: 20 },
  { header: 'Margin at Milestone ($)', key: 'marg', width: 20 }
];
styleHeader(s2.getRow(1));

const ladder = [
  ['Install + Complete Level 10', 1, 0.72, 0.25, 0.22],
  ['Reach Level 50', 3, 0.44, 1.00, 1.45],
  ['Buy No-Ads Starter ($4.99)', 7, 0.24, 4.00, 5.45],
  ['Reach Level 150', 10, 0.26, 3.00, 6.20],
  ['Spend $19.99+ Cumul. IAP', 30, 0.09, 14.00, 22.50],
  ['Reach Level 350', 21, 0.12, 7.00, 14.50],
  ['Reach Level 700', 30, 0.04, 18.00, 42.00]
];

ladder.forEach((m, idx) => {
  const rNum = idx + 2;
  const row = s2.addRow({
    ev: m[0],
    cap: m[1],
    cr: m[2],
    pay: m[3],
    epay: { formula: `C${rNum}*D${rNum}` },
    ltv: m[4],
    cpay: { formula: `SUM($D$2:D${rNum})` },
    marg: { formula: `F${rNum}-G${rNum}` }
  });
  row.getCell(3).numFmt = '0.0%';
  row.getCell(4).numFmt = '$#,##0.00';
  row.getCell(5).numFmt = '$#,##0.00';
  row.getCell(6).numFmt = '$#,##0.00';
  row.getCell(7).numFmt = '$#,##0.00';
  row.getCell(8).numFmt = '$#,##0.00';
});

const totRow = s2.addRow({
  ev: 'TOTAL BLENDED OFFERWALL COHORT',
  cap: 30,
  cr: '',
  pay: { formula: 'SUM(D2:D8)' },
  epay: { formula: 'SUM(E2:E8)' },
  ltv: 9.10,
  cpay: '',
  marg: { formula: 'F9-E9' }
});
totRow.eachCell((c) => {
  c.fill = subFill;
  c.font = boldFont;
});
totRow.getCell(4).numFmt = '$#,##0.00';
totRow.getCell(5).numFmt = '$#,##0.00';
totRow.getCell(6).numFmt = '$#,##0.00';
totRow.getCell(8).numFmt = '$#,##0.00';

// ==========================================
// SHEET 3: 12-Month UA Budget & Cash-Flow Model
// ==========================================
const s3 = wb.addWorksheet('3_12M_UA_CashFlow');
s3.columns = [
  { header: 'Month', key: 'm', width: 10 },
  { header: 'UA Spend ($)', key: 'sp', width: 15 },
  { header: 'Installs', key: 'inst', width: 13 },
  { header: 'Rev: Current Month (D0-30)', key: 'r0', width: 22 },
  { header: 'Rev: Prior Month (D31-60)', key: 'r1', width: 22 },
  { header: 'Rev: 2M Ago (D61-90)', key: 'r2', width: 20 },
  { header: 'Total Net Revenue ($)', key: 'totr', width: 18 },
  { header: 'Fixed Costs ($)', key: 'fix', width: 15 },
  { header: 'Monthly Net Cash ($)', key: 'net', width: 18 },
  { header: 'Ending Cash Balance ($)', key: 'bal', width: 20 }
];
styleHeader(s3.getRow(1));

const monthlySpends = [5000, 10000, 18000, 28000, 40000, 55000, 70000, 85000, 100000, 120000, 140000, 160000];

monthlySpends.forEach((sp, i) => {
  const r = i + 2;
  const row = s3.addRow({
    m: `M${i + 1}`,
    sp,
    inst: { formula: `ROUND(B${r}/'1_Assumptions'!$B$3,0)` },
    r0: { formula: `C${r}*'1_Assumptions'!$B$4*'1_Assumptions'!$B$7` },
    r1: i >= 1 ? { formula: `C${r - 1}*'1_Assumptions'!$B$4*('1_Assumptions'!$B$8-'1_Assumptions'!$B$7)` } : 0,
    r2: i >= 2 ? { formula: `C${r - 2}*'1_Assumptions'!$B$4*('1_Assumptions'!$B$9-'1_Assumptions'!$B$8)` } : 0,
    totr: { formula: `SUM(D${r}:F${r})` },
    fix: { formula: `'1_Assumptions'!$B$10` },
    net: { formula: `G${r}-B${r}-H${r}` },
    bal: i === 0 ? { formula: `'1_Assumptions'!$B$11+I${r}` } : { formula: `J${r - 1}+I${r}` }
  });
  [2, 4, 5, 6, 7, 8, 9, 10].forEach((cIdx) => {
    row.getCell(cIdx).numFmt = '$#,##0';
  });
  row.getCell(3).numFmt = '#,##0';
});

const sum3 = s3.addRow({
  m: 'YEAR 1',
  sp: { formula: 'SUM(B2:B13)' },
  inst: { formula: 'SUM(C2:C13)' },
  r0: { formula: 'SUM(D2:D13)' },
  r1: { formula: 'SUM(E2:E13)' },
  r2: { formula: 'SUM(F2:F13)' },
  totr: { formula: 'SUM(G2:G13)' },
  fix: { formula: 'SUM(H2:H13)' },
  net: { formula: 'SUM(I2:I13)' },
  bal: { formula: 'J13' }
});
sum3.eachCell((c) => {
  c.fill = accentFill;
  c.font = headerFont;
});
[2, 4, 5, 6, 7, 8, 9, 10].forEach((cIdx) => {
  sum3.getCell(cIdx).numFmt = '$#,##0';
});
sum3.getCell(3).numFmt = '#,##0';

// ==========================================
// SHEET 4: Geo / OS Unit Economics (Dataset Benchmarks)
// ==========================================
const s4 = wb.addWorksheet('4_Geo_OS_Benchmarks');
s4.columns = [
  { header: 'Geo / OS Market', key: 'g', width: 22 },
  { header: 'Primary Channel Role', key: 'role', width: 26 },
  { header: 'Target eCPI ($)', key: 'cpi', width: 16 },
  { header: 'Target D90 LTV ($)', key: 'ltv', width: 18 },
  { header: 'Target IAA %', key: 'iaa', width: 14 },
  { header: 'Target D30 ROAS', key: 'd30', width: 16 },
  { header: 'Target D90 ROAS', key: 'd90', width: 16 },
  { header: 'Profit / Install ($)', key: 'prof', width: 18 }
];
styleHeader(s4.getRow(1));

const geos = [
  ['US iOS', 'Tier-0 Profit Engine (O&O + Freecash)', 7.19, 12.59, 0.55, 1.38],
  ['US Android', 'Scale Backbone (O&O + AppLovin)', 5.50, 7.90, 0.65, 1.05],
  ['GB Android / iOS', 'Fast Payback Tier-1 Expansion', 3.41, 5.10, 0.65, 1.12],
  ['CA Android / iOS', 'Fast Payback Tier-1 Expansion', 3.46, 5.50, 0.62, 1.15],
  ['JP iOS / Android', 'B2B Offerwall Arbitrage (Localized)', 4.52, 7.80, 0.45, 1.18],
  ['KR Android / iOS', 'B2B Offerwall Arbitrage (Localized)', 4.40, 6.90, 0.45, 1.12]
];

geos.forEach((g, idx) => {
  const r = idx + 2;
  const row = s4.addRow({
    g: g[0],
    role: g[1],
    cpi: g[2],
    ltv: g[3],
    iaa: g[4],
    d30: g[5],
    d90: { formula: `D${r}/C${r}` },
    prof: { formula: `D${r}-C${r}` }
  });
  row.getCell(3).numFmt = '$#,##0.00';
  row.getCell(4).numFmt = '$#,##0.00';
  row.getCell(5).numFmt = '0%';
  row.getCell(6).numFmt = '0.0%';
  row.getCell(7).numFmt = '0.0%';
  row.getCell(8).numFmt = '$#,##0.00';
});

const outPath = path.resolve(process.cwd(), '..', 'Bolt_and_Box_3D_UA_Financial_Model.xlsx');
await wb.xlsx.writeFile(outPath);
console.log('Generated financial model at:', outPath);
