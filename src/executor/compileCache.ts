import crypto from "crypto";

const cache = new Map<string, string>();

export function getHash(code: string, lang: string) {
  return crypto
    .createHash("sha256")
    .update(lang + ":" + code)
    .digest("hex");
}

export function getCached(hash: string) {
  return cache.get(hash);
}

export function setCached(hash: string, path: string) {
  cache.set(hash, path);
}