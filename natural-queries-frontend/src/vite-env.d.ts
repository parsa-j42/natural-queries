/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the FastAPI backend. Defaults to http://localhost:8000 in dev.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
