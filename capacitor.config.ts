// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rihla.app',
  appName: 'Rihla',
  webDir: 'dist/customer/browser',
  server: {
    url: 'http://10.233.213.92:4100',  // your laptop's IP + port
    cleartext: true                    // allow HTTP (not HTTPS) for dev
  }
};

export default config;