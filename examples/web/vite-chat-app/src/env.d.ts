/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly TOKEN_VENDING_MACHINE_URL: string;
  readonly MOMENTO_CACHE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}