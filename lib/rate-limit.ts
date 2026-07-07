// Sliding-window rate limiter, in-memory per serverless instance.
//
// Scope honestly: on Vercel each warm lambda keeps its own map, so a
// determined attacker spread across cold starts sees higher effective
// limits. That's acceptable here — the goal is stopping cost amplification
// (OpenAI calls, outbound email) from a compromised account or a buggy
// client loop, not surviving a distributed flood. Platform-level DDoS
// mitigation is Vercel's layer (plus WAF rules if ever needed); durable
// per-org caps for email live in the send route via the activities table.

const windows = new Map<string, number[]>()

// Sweep old entries occasionally so long-lived instances don't grow forever.
let lastSweep = Date.now()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now()

  if (now - lastSweep > 5 * 60_000) {
    for (const [k, hits] of windows) {
      if (hits.every((t) => now - t > windowMs)) windows.delete(k)
    }
    lastSweep = now
  }

  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    const retryAfterSeconds = Math.ceil((hits[0] + windowMs - now) / 1000)
    windows.set(key, hits)
    return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) }
  }

  hits.push(now)
  windows.set(key, hits)
  return { ok: true, retryAfterSeconds: 0 }
}
