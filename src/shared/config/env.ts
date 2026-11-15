import { parseEnv } from './env.schema';

// Único punto que lee import.meta.env; en Jest se sustituye por jest/env.stub.ts (plan R-3)
export const env = parseEnv(import.meta.env);
