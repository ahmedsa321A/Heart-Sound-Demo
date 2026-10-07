/** localStorage helpers for demo mode — failures (private mode, blocked storage) fall back to in-memory state. */

export function loadJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

export function saveJson(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore — demo state just won't survive a reload
    }
}
