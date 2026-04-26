const KEY = "ohmyc.anon_user_id";

export function getOrCreateAnonUserId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(KEY, id);
  }
  return id;
}
