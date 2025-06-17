
import type { Timestamp } from 'firebase/firestore';

// Represents the publicly viewable user profile information
export interface PublicUserProfile {
  uid: string;
  displayName: string | null;
  username?: string | null; // Added username (lowercase)
  photoURL?: string | null;
  bio?: string | null;
  usernameLastChangedAt?: Timestamp | null; // For checking change restrictions
  // Additional public fields can be added here if needed
  // e.g., followerCount, followingCount (though often fetched dynamically)
}

