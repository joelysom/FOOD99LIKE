import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { deleteApp, initializeApp } from 'firebase/app'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseConfig } from './firebase'

export const bootstrapAdminEmail = 'cocobambu@tokka.com.br'

function normalizeAdminEmail(email) {
  return String(email ?? '')
    .trim()
    .replace(/\\+@/g, '@')
    .toLowerCase()
}

export function watchAdminSession(restaurantId, onChange) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange({ loading: false, user: null, isAdmin: false, error: '' })
      return
    }

    try {
      const adminRef = doc(db, 'restaurants', restaurantId, 'admins', user.uid)
      let adminSnapshot = await getDoc(adminRef)

      if (!adminSnapshot.exists() && restaurantId === 'tokka-foods' && user.email === bootstrapAdminEmail) {
        await setDoc(adminRef, {
          email: user.email,
          username: user.displayName || 'Administrador',
          role: 'owner',
          createdAt: serverTimestamp(),
        })

        adminSnapshot = await getDoc(adminRef)
      }

      onChange({
        loading: false,
        user,
        isAdmin: adminSnapshot.exists(),
        error: adminSnapshot.exists() ? '' : 'Conta sem permissao administrativa.',
      })
    } catch (error) {
      onChange({
        loading: false,
        user,
        isAdmin: false,
        error: translateAdminAuthError(error),
      })
    }
  })
}

export function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, normalizeAdminEmail(email), password)
}

export async function resolveAdminRestaurantId(user, preferredRestaurantId = 'tokka-foods') {
  if (!user?.uid) return ''

  try {
    const directorySnapshot = await getDoc(doc(db, 'adminDirectory', user.uid))
    const directory = directorySnapshot.data()

    if (directorySnapshot.exists() && directory.active !== false && directory.restaurantId) {
      return directory.restaurantId
    }
  } catch {
    // Fall back to the legacy checks while existing accounts are migrated.
  }

  const candidates = [...new Set([preferredRestaurantId, 'tokka-foods', 'barraca-do-fabio'])]

  for (const candidate of candidates) {
    try {
      const adminSnapshot = await getDoc(doc(db, 'restaurants', candidate, 'admins', user.uid))
      if (adminSnapshot.exists()) return candidate
    } catch {
      // Continue checking the remaining restaurants available to this account.
    }
  }

  return ''
}

export async function registerAdmin(restaurantId, { username, email, password }) {
  const normalizedEmail = normalizeAdminEmail(email)
  const normalizedUsername = username.trim()
  const role = normalizedEmail === bootstrapAdminEmail ? 'owner' : 'admin'
  let credential

  try {
    credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
  } catch (error) {
    if (error?.code !== 'auth/email-already-in-use') {
      throw error
    }

    credential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
  }

  if (normalizedUsername) {
    await updateProfile(credential.user, { displayName: normalizedUsername })
  }

  const adminRef = doc(db, 'restaurants', restaurantId, 'admins', credential.user.uid)
  const adminSnapshot = await getDoc(adminRef)

  if (adminSnapshot.exists()) {
    return credential
  }

  await setDoc(adminRef, {
    email: normalizedEmail,
    username: normalizedUsername,
    role,
    createdAt: serverTimestamp(),
  })

  return credential
}

export function recoverAdminPassword(email) {
  return sendPasswordResetEmail(auth, normalizeAdminEmail(email), {
    url: `${window.location.origin}${window.location.pathname}#admin-principal`,
  })
}

export function logoutAdmin() {
  return signOut(auth)
}

export async function changeAdminCredentials(restaurantId, { currentPassword, email, password }) {
  const user = auth.currentUser
  if (!user?.email) throw new Error('auth/user-not-found')

  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword))

  const normalizedEmail = normalizeAdminEmail(email)
  if (normalizedEmail && normalizedEmail !== user.email) await updateEmail(user, normalizedEmail)
  if (password) await updatePassword(user, password)

  await setDoc(doc(db, 'restaurants', restaurantId, 'admins', user.uid), {
    email: normalizedEmail || user.email,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function createRestaurantWithAdmin({ ownerRestaurantId, name, slug, adminName, email, password, menuState }) {
  const secondaryApp = initializeApp(firebaseConfig, `restaurant-admin-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const normalizedEmail = normalizeAdminEmail(email)
    let credential

    try {
      credential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, password)
    } catch (error) {
      if (error?.code !== 'auth/email-already-in-use') {
        throw error
      }

      credential = await signInWithEmailAndPassword(secondaryAuth, normalizedEmail, password)
    }

    if (adminName.trim()) await updateProfile(credential.user, { displayName: adminName.trim() })

    await setDoc(doc(db, 'restaurants', slug), {
      name: name.trim(),
      slug,
      active: true,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'restaurants', slug, 'admins', credential.user.uid), {
      email: normalizedEmail,
      username: adminName.trim(),
      role: 'owner',
      createdAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'adminDirectory', credential.user.uid), {
      restaurantId: slug,
      email: normalizedEmail,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'menuDirectory', slug), {
      restaurantId: slug,
      active: true,
      createdAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'restaurants', slug, 'settings', 'menus', 'items', slug), {
      ...menuState,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { restaurantId: slug, user: credential.user, ownerRestaurantId }
  } finally {
    await signOut(secondaryAuth).catch(() => {})
    await deleteApp(secondaryApp)
  }
}

export function translateAdminAuthError(error) {
  const code = error?.code ?? error?.message ?? ''

  if (code.includes('auth/admin-permission-denied')) {
    return 'Esta conta nao possui permissao administrativa em nenhum restaurante.'
  }

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return 'Email ou senha incorretos.'
  }

  if (code.includes('auth/user-not-found')) {
    return 'Conta administrativa nao encontrada.'
  }

  if (code.includes('auth/user-disabled')) {
    return 'Esta conta administrativa foi desativada no Firebase.'
  }

  if (code.includes('auth/email-already-in-use')) {
    return 'Este email ja possui uma conta administrativa.'
  }

  if (code.includes('auth/weak-password')) {
    return 'Use uma senha com pelo menos 6 caracteres.'
  }

  if (code.includes('auth/invalid-email')) {
    return 'Informe um email valido.'
  }

  if (code.includes('auth/operation-not-allowed')) {
    return 'Login por email e senha nao esta habilitado no Firebase Auth.'
  }

  if (code.includes('auth/invalid-api-key') || code.includes('auth/api-key-not-valid')) {
    return 'Configuracao do Firebase invalida neste deploy.'
  }

  if (code.includes('auth/network-request-failed')) {
    return 'Falha de rede ao conectar com o Firebase.'
  }

  if (code.includes('auth/missing-password')) {
    return 'Informe a senha para continuar.'
  }

  if (code.includes('auth/too-many-requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  }

  if (code.includes('auth/requires-recent-login')) {
    return 'Confirme sua senha atual para alterar os dados de acesso.'
  }

  if (code.includes('permission-denied')) {
    return 'Conta criada, mas o perfil administrativo nao foi liberado pelas regras do Firebase.'
  }

  return 'Nao foi possivel entrar agora. Verifique a conexao e tente novamente.'
}
