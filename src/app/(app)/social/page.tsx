
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
import { useToast } from '@/hooks/use-toast';

export default function SocialPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setHasSearched(true); 
      return;
    }

    setIsLoadingSearch(true);
    setHasSearched(true);
    try {
      const usersRef = collection(db, 'users');
      const normalizedQueryLowercase = trimmedQuery.toLowerCase();
      // Capitalize first letter, rest lowercase (e.g., "john doe" -> "John doe")
      const normalizedQueryCapitalized = 
        trimmedQuery.charAt(0).toUpperCase() + trimmedQuery.slice(1).toLowerCase();

      const queriesToRun = [];

      // 1. displayName query (as typed by user)
      queriesToRun.push(query(
        usersRef,
        orderBy('displayName'),
        startAt(trimmedQuery),
        endAt(trimmedQuery + '\uf8ff'),
        limit(10)
      ));

      // 2. displayName query (capitalized version, if different from as-typed)
      //    This helps if user types "john" and display name is "John"
      if (trimmedQuery !== normalizedQueryCapitalized) {
        queriesToRun.push(query(
          usersRef,
          orderBy('displayName'),
          startAt(normalizedQueryCapitalized),
          endAt(normalizedQueryCapitalized + '\uf8ff'),
          limit(10)
        ));
      }
      // Note: A true case-insensitive prefix search across all displayName variations in Firestore
      // usually requires storing a normalized (e.g., lowercase) version of displayName for querying.

      // 3. username query (lowercase prefix match)
      //    Assumes 'username' field in Firestore is stored in lowercase and is indexed for ordering.
      queriesToRun.push(query(
        usersRef,
        orderBy('username'), 
        startAt(normalizedQueryLowercase),
        endAt(normalizedQueryLowercase + '\uf8ff'),
        limit(10)
      ));
      
      const querySnapshots = await Promise.all(queriesToRun.map(q => getDocs(q)));

      const usersMap = new Map<string, PublicUserProfile>();

      querySnapshots.forEach(snapshot => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== currentUser?.uid && !usersMap.has(doc.id)) { // Exclude current user and avoid duplicates
            usersMap.set(doc.id, {
              uid: doc.id,
              displayName: data.displayName || 'User',
              username: data.username || null,
              photoURL: data.photoURL || undefined,
              bio: data.bio || undefined,
            });
          }
        });
      });

      setSearchResults(Array.from(usersMap.values()));

    } catch (error: any) {
      console.error("Error searching users:", error);
      setSearchResults([]);
      toast({ 
        title: "Search Error", 
        description: error.code === 'failed-precondition' 
          ? "The search query requires an index. Please check Firestore indexes. See console for details." 
          : "Could not perform search. Please try again.", 
        variant: "destructive" 
      });
      if (error.code === 'failed-precondition') {
        console.warn("Firestore 'failed-precondition' error likely means a composite index is missing. Firebase might log a direct link to create it in this console.");
      }
    } finally {
      setIsLoadingSearch(false);
    }
  };
  
  useEffect(() => {
    if (searchQuery.trim() === '' && hasSearched && !isLoadingSearch) {
        setSearchResults([]);
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
            placeholder="Search by start of name or @username..."
            className="flex-grow h-11 border-primary focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim() === '') { 
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
            <p className="text-sm text-muted-foreground mb-2">Found {searchResults.length} user(s) starting with "{searchQuery}":</p>
            {searchResults.map((user) => (
              <UserListItem 
                key={user.uid} 
                profileUser={user} 
                currentUserUid={currentUser?.uid}
                onFollowStateChange={() => { /* Optionally refetch or update counts */ }}
                showFollowButton={!!currentUser && user.uid !== currentUser.uid}
              />
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-10 bg-card rounded-xl shadow-sm">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" strokeWidth={1.5}/>
            <p className="text-xl font-semibold text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
              Try a different search term. Search looks for names or usernames that *start with* your term.
            </p>
          </div>
        ) : (
            <div className="text-center py-10 bg-card rounded-xl shadow-sm">
                <Users className="h-16 w-16 mx-auto text-primary/30 mb-4" strokeWidth={1.5}/>
                <p className="text-xl font-semibold text-muted-foreground">Find People</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                Search by the beginning of a name or @username to connect with others.
                </p>
          </div>
        )}
      </main>
    </motion.div>
  );
}

