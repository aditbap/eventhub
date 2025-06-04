// This is a mock Firebase setup. In a real app, you'd initialize Firebase here.
// For example:
// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const auth = getAuth(app);
// const db = getFirestore(app);

// export { app, auth, db };


// Mock implementations
export const auth = {
  // Simulate Firebase Auth onAuthStateChanged
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Simulate checking for a stored user (e.g., in localStorage)
    setTimeout(() => {
      const storedUser = localStorage.getItem('mockUser');
      if (storedUser) {
        callback(JSON.parse(storedUser));
      } else {
        callback(null);
      }
    }, 500); // Simulate async behavior
    // Return a mock unsubscribe function
    return () => {};
  },
  // Simulate signInWithEmailAndPassword
  signInWithEmailAndPassword: async (email?: string, password?: string) => {
    if (email === 'user@example.com' && password === 'password123') {
      const user = { uid: 'mockUid123', email: 'user@example.com', displayName: 'Test User' };
      localStorage.setItem('mockUser', JSON.stringify(user));
      return { user };
    }
    throw new Error('Invalid credentials');
  },
  // Simulate createUserWithEmailAndPassword
  createUserWithEmailAndPassword: async (email?: string, password?: string, name?: string) => {
    const user = { uid: `mockUid${Date.now()}`, email, displayName: name || 'New User' };
    localStorage.setItem('mockUser', JSON.stringify(user));
    return { user };
  },
  // Simulate signOut
  signOut: async () => {
    localStorage.removeItem('mockUser');
  },
  // Simulate currentUser
  get currentUser() {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('mockUser') : null;
    return storedUser ? JSON.parse(storedUser) : null;
  }
};

export const db = {
  // Mock Firestore collection and doc operations
  collection: (path: string) => ({
    doc: (id?: string) => ({
      set: async (data: any) => {
        console.log(`Mock Firestore: Writing to ${path}/${id || '(auto-id)'}`, data);
        // Simulate saving ticket
        if (path === 'userTickets' && id) {
          const tickets = JSON.parse(localStorage.getItem(`tickets_${id}`) || '[]');
          tickets.push({...data, id: `ticket_${Date.now()}` });
          localStorage.setItem(`tickets_${id}`, JSON.stringify(tickets));
        }
        return Promise.resolve();
      },
      get: async () => {
         if (path === 'userTickets' && id) {
          const ticketsData = localStorage.getItem(`tickets_${id}`);
          const tickets = ticketsData ? JSON.parse(ticketsData) : [];
          return Promise.resolve({ exists: () => true, data: () => ({ tickets }) });
         }
         return Promise.resolve({ exists: () => false, data: () => undefined });
      }
    }),
    where: (field: string, op: string, value: any) => ({ // Basic mock for queries
        get: async () => {
            if (path === 'userTickets' && field === 'userId' && op === '==') {
                const ticketsData = localStorage.getItem(`tickets_${value}`);
                const tickets = ticketsData ? JSON.parse(ticketsData) : [];
                return Promise.resolve({ docs: tickets.map((ticket: any) => ({ id: ticket.id, data: () => ticket })) });
            }
            return Promise.resolve({ docs: [] });
        }
    })
  }),
};
