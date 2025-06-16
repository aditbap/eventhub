
// Represents the publicly viewable user profile information
export interface PublicUserProfile {
  uid: string;
  displayName: string | null;
  photoURL?: string | null;
  bio?: string | null;
  // Additional public fields can be added here if needed
  // e.g., followerCount, followingCount (though often fetched dynamically)
}
