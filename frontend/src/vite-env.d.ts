/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_ENABLE_REDUX_DEVTOOLS?: string;
    readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
