import { createHmac } from "crypto";

export function generateSignature({
  method,
  path,
  timestamp,
  body,
  secret,
}: SigatureParameters): string {
  const payload = `${method}:${path}:${timestamp}:${JSON.stringify(body || {})}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export class SigatureParameters {
  method: string;
  path: string;
  timestamp: string | string[];
  body?: any;
  secret: string;

  constructor(method: string, path: string, timestamp: string | string[], body: any, secret: string) {
    this.method = method;
    this.path = path;
    this.timestamp = timestamp;
    this.body = body;
    this.secret = secret;
  }
}

export function checkExpired(timestamp: string | string[]): boolean {
  const now = Date.now();
  const ts = Number(timestamp);
  return Math.abs(now - ts) > 5 * 60 * 1000; // 5 minutes
}

