#!/usr/bin/env node
/**
 * Baseline latency for public Travelhues API routes.
 * Usage: npm run api:benchmark
 * Optional: NEXT_PUBLIC_API_URL, BENCHMARK_SAMPLES (default 8)
 */
const base = process.env.NEXT_PUBLIC_API_URL || "https://65.2.235.120.sslip.io";
const samples = Math.max(3, Number(process.env.BENCHMARK_SAMPLES) || 8);

const paths = [
  "/settings",
  "/countries",
  "/stories",
  "/glimpses",
  "/spot-catalog",
  "/ads/hues",
  "/search?q=test&limit=1",
];

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[Math.max(0, index)];
}

async function measure(path) {
  const ms = [];
  let bytes = 0;
  let status = 0;
  for (let i = 0; i < samples; i += 1) {
    const started = performance.now();
    const response = await fetch(`${base}${path}`);
    const body = await response.arrayBuffer();
    ms.push(performance.now() - started);
    bytes = body.byteLength;
    status = response.status;
  }
  ms.sort((a, b) => a - b);
  return {
    status,
    bytes,
    p50: Math.round(ms[Math.floor(ms.length / 2)]),
    p95: Math.round(percentile(ms, 0.95)),
  };
}

console.log(`API base: ${base}`);
console.log(`Samples per path: ${samples}\n`);
console.log("path\tstatus\tbytes\tp50_ms\tp95_ms");

for (const path of paths) {
  try {
    const row = await measure(path);
    console.log(`${path}\t${row.status}\t${row.bytes}\t${row.p50}\t${row.p95}`);
  } catch (error) {
    console.log(`${path}\terror\t-\t-\t${error instanceof Error ? error.message : error}`);
  }
}

console.log(`
Route waterfalls (typical before optimizations):
  Home: settings + countries + stories + glimpses + marks + up to 4x profiles
  Story: 2x story (metadata+page) + marks + full glimpses + profile
  Studio save: N serial /media + spot-catalog + /me/stories

Backend checklist (when API repo is available):
  - gzip/br compression; slim GET /me/stories or paginate desk payload
  - presigned uploads instead of POST /media dataUrl
  - DB indexes on country, slug, creator_id; search indexes
  - Cache-Control on /settings, /countries, /spot-catalog
`);
