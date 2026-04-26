const KEY = "ohmyc.anon_user_id";
let memoryAnonId: string | null = null;

function fallbackId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `anon-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function getOrCreateAnonUserId(): string {
  if (typeof window === "undefined") {
    if (!memoryAnonId) memoryAnonId = fallbackId();
    return memoryAnonId;
  }

  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      // 백워드 호환: 이전 sessionStorage 값이 있으면 1회 이전.
      try {
        const legacy = window.sessionStorage.getItem(KEY);
        if (legacy) {
          id = legacy;
          window.localStorage.setItem(KEY, legacy);
          window.sessionStorage.removeItem(KEY);
        }
      } catch {
        // 무시: 새로 생성
      }
    }
    if (!id) {
      id = fallbackId();
      window.localStorage.setItem(KEY, id);
    }
    memoryAnonId = id;
    return id;
  } catch {
    if (!memoryAnonId) memoryAnonId = fallbackId();
    return memoryAnonId;
  }
}
