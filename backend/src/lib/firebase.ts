import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import { env } from '../config/env.js';

const configured = !!(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);

let firebaseInitialized = false;

if (configured && getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    firebaseInitialized = false;
  }
} else if (getApps().length > 0) {
  firebaseInitialized = true;
}

export async function sendPushNotification(token: string, title: string, body: string) {
  if (!firebaseInitialized) {
    return null;
  }

  try {
    return await getMessaging().send({
      token,
      notification: { title, body }
    });
  } catch (error) {
    console.error('FCM send failed:', (error as Error)?.message ?? error);
    return null;
  }
}
