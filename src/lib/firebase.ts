
// This is a mock Firebase setup. In a real app, you'd initialize Firebase here.

// Key for storing all registered users in localStorage
const MOCK_REGISTERED_USERS_KEY = 'mockRegisteredUsers';

// Helper function to get registered users from localStorage
const getRegisteredUsers = (): any[] => {
  if (typeof window === 'undefined') return [];
  const users = localStorage.getItem(MOCK_REGISTERED_USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Helper function to save registered users to localStorage
const saveRegisteredUsers = (users: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_REGISTERED_USERS_KEY, JSON.stringify(users));
};

export const auth = {
  onAuthStateChanged: (callback: (user: any) => void) => {
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('mockUser');
        if (storedUser) {
          callback(JSON.parse(storedUser));
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    }, 500);
    return () => {};
  },

  signInWithEmailAndPassword: async (email?: string, password?: string) => {
    if (typeof window === 'undefined') {
      throw new Error('Authentication operations can only be performed in the browser.');
    }
    const registeredUsers = getRegisteredUsers();
    const foundUser = registeredUsers.find(
      (u: any) => u.email === email && u.password === password // Plain text password check for mock
    );

    if (foundUser) {
      // Don't store password in the "active session" mockUser
      const sessionUser = { uid: foundUser.uid, email: foundUser.email, displayName: foundUser.displayName };
      localStorage.setItem('mockUser', JSON.stringify(sessionUser));
      return { user: sessionUser };
    }
    throw new Error('Invalid credentials');
  },

  createUserWithEmailAndPassword: async (email?: string, password?: string, name?: string) => {
    if (typeof window === 'undefined') {
      throw new Error('Authentication operations can only be performed in the browser.');
    }
    if (!email || !password) {
        throw new Error('Email and password are required for registration.');
    }
    const registeredUsers = getRegisteredUsers();
    if (registeredUsers.some((u: any) => u.email === email)) {
      throw new Error('auth/email-already-in-use'); // More Firebase-like error
    }

    const newUser = {
      uid: `mockUid${Date.now()}`,
      email,
      password, // Store password for mock checking, DO NOT do this in a real app
      displayName: name || 'New User',
    };
    registeredUsers.push(newUser);
    saveRegisteredUsers(registeredUsers);

    // Simulate auto-login after registration
    const sessionUser = { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName };
    localStorage.setItem('mockUser', JSON.stringify(sessionUser));
    return { user: sessionUser };
  },

  signOut: async () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('mockUser');
  },

  get currentUser() {
    if (typeof window === 'undefined') return null;
    const storedUser = localStorage.getItem('mockUser');
    return storedUser ? JSON.parse(storedUser) : null;
  }
};

export const db = {
  collection: (path: string) => ({
    doc: (id?: string) => ({
      set: async (data: any) => {
        console.log(`Mock Firestore: Writing to ${path}/${id || '(auto-id)'}`, data);
        if (typeof window !== 'undefined') {
            if (path === 'userTickets' && id) {
                // Attempt to get current user for ticket association
                const currentUser = auth.currentUser;
                if (currentUser && currentUser.uid === id) { // Ensure ticket is for current logged in user
                    const ticketsKey = `tickets_${currentUser.uid}`;
                    const tickets = JSON.parse(localStorage.getItem(ticketsKey) || '[]');
                    // Add ticket with a unique ID, ensuring it's linked to the user
                    const newTicket = { ...data, id: `ticket_${Date.now()}`, userId: currentUser.uid };
                    tickets.push(newTicket);
                    localStorage.setItem(ticketsKey, JSON.stringify(tickets));
                } else {
                    console.warn("Mock DB: Attempted to set ticket for non-matching or non-logged-in user.");
                }
            } else if (path === 'users' && id) {
              // Example for storing user profile data, can be expanded
              localStorage.setItem(`user_profile_${id}`, JSON.stringify(data));
            }
        }
        return Promise.resolve();
      },
      get: async () => {
        if (typeof window !== 'undefined') {
            if (path === 'userTickets' && id) {
                const ticketsKey = `tickets_${id}`; // id here is userId
                const ticketsData = localStorage.getItem(ticketsKey);
                const tickets = ticketsData ? JSON.parse(ticketsData) : [];
                // For get(), we might return the whole user document if that's how tickets are stored (e.g. user doc has a tickets array)
                // Or, if tickets are queried by userId, this structure needs to align with the query in ProfilePage
                // For simplicity here, assuming get by user ID will return structure ProfilePage expects
                // The ProfilePage query is currently db.collection('userTickets').where('userId', '==', user.uid).get();
                // So this .doc(id).get() is not directly hit by ProfilePage for tickets.
                // Let's assume this would fetch a user's doc that might contain tickets array (not current model)
                // For now, let this be a placeholder, as ticket fetching is done via .where().get()
                return Promise.resolve({ exists: () => false, data: () => undefined }); // Simplified
            } else if (path === 'users' && id) {
                const profileData = localStorage.getItem(`user_profile_${id}`);
                if (profileData) {
                    return Promise.resolve({ exists: () => true, data: () => JSON.parse(profileData) });
                }
            }
        }
        return Promise.resolve({ exists: () => false, data: () => undefined });
      }
    }),
    where: (field: string, op: string, value: any) => ({
        get: async () => {
            if (typeof window !== 'undefined') {
                if (path === 'userTickets' && field === 'userId' && op === '==') {
                    const ticketsKey = `tickets_${value}`; // value here is userId
                    const ticketsData = localStorage.getItem(ticketsKey);
                    const ticketsArray = ticketsData ? JSON.parse(ticketsData) : [];
                    // Firestore's get() on a query returns an object with a docs array
                    return Promise.resolve({ 
                        docs: ticketsArray.map((ticket: any) => ({ 
                            id: ticket.id, 
                            data: () => ticket 
                        })) 
                    });
                }
            }
            return Promise.resolve({ docs: [] });
        }
    })
  }),
};
