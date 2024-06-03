/// <reference types="vite/client" />
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_APP_AWS_ACCESS_KEY_ID: string;
  readonly VITE_APP_AWS_SECRET_ACCESS_KEY: string;
  readonly VITE_TOKEN_VENDING_MACHINE_URL: string;
  readonly VITE_MOMENTO_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
