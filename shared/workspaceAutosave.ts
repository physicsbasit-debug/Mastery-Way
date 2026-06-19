export function canUseLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function loadWorkspace<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T {
  if (!canUseLocalStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveWorkspace<T>(key: string, value: T): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // تجاهل فشل الحفظ حتى لا تتعطل الواجهة إذا امتلأت مساحة التخزين.
  }
}

export function clearWorkspace(key: string): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // تجاهل فشل المسح.
  }
}

export function getAutosaveTimestamp(): string {
  try {
    return new Date().toISOString();
  } catch {
    return '';
  }
}
