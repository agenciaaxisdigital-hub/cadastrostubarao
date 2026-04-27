import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.deputadasarelli.sindspag',
  appName: 'SINDSPAG',
  webDir: 'dist',
  server: {
    url: 'https://sindspag.deputadasarelli.com.br',
    cleartext: true,
  },
};

export default config;
