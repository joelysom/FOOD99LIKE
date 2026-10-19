// Independent card project; restaurant settings and existing URLs stay in their current environment.
const env = import.meta.env
export const cardsFirebaseConfig = {
  apiKey: env.VITE_CARDS_FIREBASE_API_KEY || 'AIzaSyDKcC8S9JkN2hcVOvNjKd3zMCARmcMinuc',
  authDomain: env.VITE_CARDS_FIREBASE_AUTH_DOMAIN || 'tokka-foods.firebaseapp.com',
  projectId: env.VITE_CARDS_FIREBASE_PROJECT_ID || 'tokka-foods',
  storageBucket: env.VITE_CARDS_FIREBASE_STORAGE_BUCKET || 'tokka-foods.firebasestorage.app',
  messagingSenderId: '810576160609',
  appId: env.VITE_CARDS_FIREBASE_APP_ID || '1:810576160609:web:c759f9ac88496c187f4720',
}
