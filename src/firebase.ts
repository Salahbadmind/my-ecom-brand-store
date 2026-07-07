import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from "firebase/firestore";

// Firebase Config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCLoCOyM7JZK72yN09y06ArOJ80vAeVXFA",
  authDomain: "optimistic-science-6dzcr.firebaseapp.com",
  projectId: "optimistic-science-6dzcr",
  storageBucket: "optimistic-science-6dzcr.firebasestorage.app",
  messagingSenderId: "659428731299",
  appId: "1:659428731299:web:49239c10936408390a5216"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, "ai-studio-34f1163a-a54e-490e-a36b-e5b0025462f8");

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Auth Providers & helpers
export { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
};

// Connection Validation as required by firebase-integration skill
async function testConnection() {
  try {
    // Attempting server fetch of a test connection document
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("🔥 SBB Tech Store: Connected to Firestore successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("client is offline")) {
      console.warn("⚠️ Firebase connection warning: The client appears to be offline.");
    } else {
      console.log("ℹ️ Firestore initialization test completed.");
    }
  }
}

testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

