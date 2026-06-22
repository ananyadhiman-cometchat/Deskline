import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

/**
 * Vite plugin that generates firebase-messaging-sw.js at build time,
 * injecting VITE_FIREBASE_* env vars so credentials stay in .env and
 * are never hardcoded in source.
 */
function firebaseSwPlugin() {
  return {
    name: 'generate-firebase-sw',
    writeBundle() {
      const apiKey = process.env.VITE_FIREBASE_API_KEY || '';
      const projectId = process.env.VITE_FIREBASE_PROJECT_ID || '';
      const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
      const appId = process.env.VITE_FIREBASE_APP_ID || '';

      const swContent = `importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "${apiKey}",
  projectId: "${projectId}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'DeskLine';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body,
      icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.log('[firebase-messaging-sw.js] Failed to initialize Firebase:', error);
}
`;
      fs.writeFileSync(path.resolve(__dirname, 'dist/firebase-messaging-sw.js'), swContent);
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    firebaseSwPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
