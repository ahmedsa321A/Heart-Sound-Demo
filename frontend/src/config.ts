/**
 * Demo mode — set VITE_DEMO_MODE=true to run without backend/database.
 * When true: demo user, in-browser history, and the AI model runs locally in the browser.
 * When false: uses backend API + AI service (original behavior).
 */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

/** Maximum recording duration in seconds. */
export const MAX_RECORDING_SECONDS = 30;
