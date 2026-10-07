import { describe, it, expect } from 'vitest';
import { healthService } from '../src/health/health.service.js';

describe('Health & Readiness Service', () => {
  it('returns valid liveness report', () => {
    const liveness = healthService.getLiveness();
    expect(liveness.status).toBe('ok');
    expect(liveness.service).toBe('placement-api');
    expect(liveness.timestamp).toBeDefined();
    expect(liveness.version).toBe('0.1.0');
  });

  it('evaluates readiness without throwing even when external services are offline', async () => {
    const readiness = await healthService.getReadiness();
    expect(readiness.service).toBe('placement-api');
    expect(readiness.timestamp).toBeDefined();
    expect(readiness.checks).toBeDefined();
    expect(readiness.checks.database).toBeDefined();
    expect(readiness.checks.redis).toBeDefined();
    expect(readiness.checks.mlService).toBeDefined();
  });
});
