import type { RendererElectron } from '../main/preload';

declare global {
  interface Window {
    electron: RendererElectron;
  }
}

export {};
