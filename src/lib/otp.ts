/** Supabase email sign-in codes are six digits. Keep pasted separators out. */
export function normalizeEmailCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

export function isEmailCodeComplete(value: string): boolean {
  return normalizeEmailCode(value).length === 6;
}
