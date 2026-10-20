import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "../config/env.js";

// Initialize the Redis client using Upstash Redis Rest URL & Token
let redisClient: Redis | null = null;
try {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {
  redisClient = null;
}

// In-memory fallback sliding window limiter for local dev or when Upstash is unreachable
class MemoryRateLimiter {
  private requests = new Map<string, number[]>();
  private readonly max = 20;
  private readonly windowMs = 60 * 1000;

  async limit(identifier: string) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.requests.get(identifier) || []).filter(t => t > windowStart);

    if (timestamps.length >= this.max) {
      return {
        success: false,
        limit: this.max,
        remaining: 0,
        reset: timestamps[0] + this.windowMs,
      };
    }

    timestamps.push(now);
    this.requests.set(identifier, timestamps);
    return {
      success: true,
      limit: this.max,
      remaining: this.max - timestamps.length,
      reset: now + this.windowMs,
    };
  }
}

const memoryFallback = new MemoryRateLimiter();

const upstashLimiter = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.fixedWindow(10, "60 s"),
      analytics: false,
      prefix: "@upstash/ratelimit",
    })
  : null;

// Export a resilient limiter wrapper that gracefully handles Upstash connection failures
export const copilotRateLimiter = {
  async limit(identifier: string) {
    if (upstashLimiter) {
      try {
        return await upstashLimiter.limit(identifier);
      } catch {
        // Fall back to memory limiter on network/DNS failure
        return await memoryFallback.limit(identifier);
      }
    }
    return await memoryFallback.limit(identifier);
  },
};

