export function idempotencyHeaders() {
  return {
    'Idempotency-Key': crypto.randomUUID(),
  }
}
