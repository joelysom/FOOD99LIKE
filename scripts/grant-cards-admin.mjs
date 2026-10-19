import { applicationDefault, initializeApp } from '../functions/node_modules/firebase-admin/lib/esm/app/index.js'
import { getAuth } from '../functions/node_modules/firebase-admin/lib/esm/auth/index.js'
import { getFirestore, FieldValue } from '../functions/node_modules/firebase-admin/lib/esm/firestore/index.js'
const [userId] = process.argv.slice(2)
if (!userId || !/^[a-zA-Z0-9_-]{1,128}$/.test(userId)) throw new Error('Uso: npm run firebase:grant-cards-admin -- UID_FIREBASE. Requer Application Default Credentials confiáveis.')
const app = initializeApp({ credential: applicationDefault(), projectId: process.env.GCLOUD_PROJECT || 'tokka-eb4ae' })
const user = await getAuth(app).getUser(userId)
if (user.disabled) throw new Error('A conta está desativada.')
const db = getFirestore(app)
const batch = db.batch()
batch.set(db.collection('cardsAdmins').doc(userId), { role: 'admin', active: true, grantedAt: FieldValue.serverTimestamp() })
batch.create(db.collection('cardsAudit').doc(), { event: 'admin_granted', userId, createdAt: FieldValue.serverTimestamp() })
await batch.commit()
console.log('Permissão de administrador de cartões concedida ao UID informado.')
