const memoryStorage = new Map<string, string>();
let storageUsable: boolean | null = null;

export function canUseLocalStorage(): boolean {
  if (storageUsable !== null) return storageUsable;
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      storageUsable = false;
      return false;
    }
    const testKey = '__bosla_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    storageUsable = true;
    return true;
  } catch {
    storageUsable = false;
    return false;
  }
}

function readRaw(key: string): string | null {
  if (canUseLocalStorage()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      storageUsable = false;
    }
  }
  return memoryStorage.get(key) ?? null;
}

function writeRaw(key: string, value: string): void {
  memoryStorage.set(key, value);
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    storageUsable = false;
  }
}

function removeRaw(key: string): void {
  memoryStorage.delete(key);
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    storageUsable = false;
  }
}

export function isUsingMemoryStorageFallback(): boolean {
  return !canUseLocalStorage();
}

export function loadWorkspace<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T {
  try {
    const raw = readRaw(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveWorkspace<T>(key: string, value: T): void {
  try {
    writeRaw(key, JSON.stringify(value));
  } catch {
    // لا نوقف التطبيق إذا منع Safari التخزين المحلي أو كان الجهاز في وضع خاص.
  }
}

export function clearWorkspace(key: string): void {
  removeRaw(key);
}

export function getAutosaveTimestamp(): string {
  try {
    return new Date().toISOString();
  } catch {
    return '';
  }
}
