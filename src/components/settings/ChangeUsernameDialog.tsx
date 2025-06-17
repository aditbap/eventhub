
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, AtSign, Info } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { differenceInDays, formatDistanceToNowStrict, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth'; // To get current user for comparison

interface ChangeUsernameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  usernameLastChangedAt: Timestamp | null;
  onSave: (newUsername: string) => Promise<void>;
}

export function ChangeUsernameDialog({ isOpen, onClose, currentUsername, usernameLastChangedAt, onSave }: ChangeUsernameDialogProps) {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restrictionInfo, setRestrictionInfo] = useState<string | null>(null);
  const [isChangeAllowed, setIsChangeAllowed] = useState(true);
  const { user } = useAuth();


  useEffect(() => {
    if (isOpen) {
      setNewUsername(currentUsername || '');
      setIsSaving(false);
      setError(null);

      if (usernameLastChangedAt) {
        const lastChangedDate = usernameLastChangedAt.toDate();
        const now = new Date();
        const daysSinceLastChange = differenceInDays(now, lastChangedDate);
        
        if (daysSinceLastChange < 30) {
          const nextChangeDate = new Date(lastChangedDate);
          nextChangeDate.setDate(lastChangedDate.getDate() + 30);
          setIsChangeAllowed(false);
          setRestrictionInfo(
            `You last changed your username on ${format(lastChangedDate, 'PPP')}. ` +
            `You can change it again after ${format(nextChangeDate, 'PPP')} ` +
            `(${formatDistanceToNowStrict(nextChangeDate, { addSuffix: true })}).`
          );
        } else {
          setIsChangeAllowed(true);
          setRestrictionInfo(`You can change your username. Last change was ${formatDistanceToNowStrict(lastChangedDate, { addSuffix: true })}.`);
        }
      } else {
        setIsChangeAllowed(true);
        setRestrictionInfo("You can change your username. This will be your first change or the previous change was long ago.");
      }
    }
  }, [isOpen, currentUsername, usernameLastChangedAt]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedNewUsername = newUsername.trim().toLowerCase();

    if (!trimmedNewUsername) {
      setError("Username cannot be empty.");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(trimmedNewUsername)) {
      setError('Username must be 3-20 characters, lowercase letters, numbers, or underscores only.');
      return;
    }
    if (trimmedNewUsername === (currentUsername || '').toLowerCase()) {
      setError("This is already your current username.");
      return;
    }
    if (!isChangeAllowed) {
        setError(restrictionInfo || "You cannot change your username at this time due to the 30-day limit.");
        return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedNewUsername); // onSave should handle actual API call and uniqueness
      onClose(); 
    } catch (err: any) {
      // Check if error message includes "nextChangeDate" information
      if (err.message && err.message.includes("You can change your username again after")) {
         const dateMatch = err.message.match(/after ([\w\s,]+)\./);
         if (dateMatch && dateMatch[1]) {
            const nextDateStr = dateMatch[1];
            const nextDateObj = new Date(nextDateStr); // Attempt to parse
            if (!isNaN(nextDateObj.getTime())) {
                 setRestrictionInfo(`You can change it again after ${format(nextDateObj, 'PPP')} (${formatDistanceToNowStrict(nextDateObj, { addSuffix: true })}).`);
                 setIsChangeAllowed(false);
            }
         }
      }
      setError(err.message || "Failed to update username. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(openStatus) => !openStatus && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Your Username</DialogTitle>
            <DialogDescription>
              Your username is unique. You can change it once every 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              <Label htmlFor="newUsername" className="sr-only">
                New Username
              </Label>
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                id="newUsername"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                placeholder="Enter new username"
                className="pl-10"
                disabled={isSaving || !isChangeAllowed}
                autoFocus
              />
            </div>
            {restrictionInfo && (
              <div className={`flex items-start p-3 rounded-md text-sm ${isChangeAllowed ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                <Info className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                <p>{restrictionInfo}</p>
              </div>
            )}
            {error && <p className="text-sm text-destructive px-1">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isSaving || !newUsername.trim() || !isChangeAllowed || newUsername.trim().toLowerCase() === (currentUsername || '').toLowerCase()}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Username
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
