
'use client';

import React, { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Users, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, startAt, endAt } from 'firebase/firestore';
import type { PublicUserProfile } from '@/types';
import { UserListItem } from '@/components/profile/UserListItem';
import { motion } from 'framer-motion';

export default function SocialPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(true); // Indicate that a search (for empty) was performed
      return;
    }

    setIsLoadingSearch(true);
    setHasSearched(true);
    try {
      const usersRef = collection(db, 'users');
      // Basic case-sensitive prefix search
      // For a more robust search, consider a dedicated search service or more complex data structuring.
      const q = query(
        usersRef,
        orderBy('displayName'),
        startAt(searchQuery.trim()),
        endAt(searchQuery.trim() + '\uf8ff'),
        limit(20) // Limit results for performance
      );

      const querySnapshot = await getDocs(q);
      const users: PublicUserProfile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Exclude current user from search results
        if (doc.id !== currentUser?.uid) {
          users.push({
            uid: doc.id,
            displayName: data.displayName || 'User',
            photoURL: data.photoURL || undefined,
            bio: data.bio || undefined,
          });
        }
      });
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
      // Optionally, show a toast message for search errors
    } finally {
      setIsLoadingSearch(false);
    }
  };
  
  // Effect to clear results if search query becomes empty after a search
  useEffect(() => {
    if (searchQuery.trim() === '' && hasSearched && !isLoadingSearch) {
        setSearchResults([]);
        // Optionally setHasSearched(false) if you want the initial prompt to reappear
    }
  }, [searchQuery, hasSearched, isLoadingSearch]);

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Connect</h1>
        <div className="w-9 h-9"></div> {/* Spacer */}
      </header>

      <main className="p-4">
        <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-6">
          <Input
            type="search"
            placeholder="Search for people..."
            className="flex-grow h-11 border-primary focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim() === '') { // Auto-clear results if input is cleared
                setSearchResults([]);
                setHasSearched(false);
              }
            }}
          />
          <Button type="submit" size="icon" className="h-11 w-11" disabled={isLoadingSearch}>
            {isLoadingSearch ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </form>

        {isLoadingSearch ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">Found {searchResults.length} user(s):</p>
            {searchResults.map((user) => (
              <UserListItem 
                key={user.uid} 
                profileUser={user} 
                currentUserUid={currentUser?.uid}
                showFollowButton={!!currentUser && user.uid !== currentUser.uid}
              />
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-10 bg-card rounded-xl shadow-sm">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" strokeWidth={1.5}/>
            <p className="text-xl font-semibold text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
              Try a different name or check your spelling.
            </p>
          </div>
        ) : (
            <div className="text-center py-10 bg-card rounded-xl shadow-sm">
                <Users className="h-16 w-16 mx-auto text-primary/30 mb-4" strokeWidth={1.5}/>
                <p className="text-xl font-semibold text-muted-foreground">Find People</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                Search by name to connect with others on UPJ Event Hub.
                </p>
          </div>
        )}
      </main>
    </motion.div>
  );
}
