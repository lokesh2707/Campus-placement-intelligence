#!/usr/bin/env node

/**
 * Service health verification utility.
 * Pings Backend API, ML Service, and Web Frontend to verify connectivity.
 */

const SERVICES = [
  { name: 'Backend API Liveness', url: 'http://localhost:4000/api/v1/health' },
  { name: 'Backend API Readiness', url: 'http://localhost:4000/api/v1/health/ready' },
  { name: 'AI/ML Microservice', url: 'http://localhost:8000/health' },
  { name: 'Web Application', url: 'http://localhost:3000' },
];

async function checkService(service) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(service.url, { signal: controller.signal });
    clearTimeout(timer);
    const duration = Date.now() - start;

    if (res.ok) {
      console.log(`✅ [OK]   ${service.name.padEnd(25)} status: ${res.status} (${duration}ms)`);
      return true;
    } else {
      console.log(`⚠️ [WARN] ${service.name.padEnd(25)} status: ${res.status} (${duration}ms)`);
      return false;
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`❌ [DOWN] ${service.name.padEnd(25)} (${err.message})`);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Checking Campus Placement Platform Services...\n');
  let passed = 0;

  for (const s of SERVICES) {
    const ok = await checkService(s);
    if (ok) passed++;
  }

  console.log(`\nResults: ${passed}/${SERVICES.length} endpoints reached.\n`);
}

main();
