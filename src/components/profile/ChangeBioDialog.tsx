
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface ChangeBioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentBio: string | null;
  onSave: (newBio: string) => Promise<void>; 
}

const BIO_MAX_LENGTH = 150;

export function ChangeBioDialog({ isOpen, onClose, currentBio, onSave }: ChangeBioDialogProps) {
  const [newBio, setNewBio] = useState(currentBio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewBio(currentBio || '');
      setIsSaving(false);
      setError(null);
    }
  }, [isOpen, currentBio]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedNewBio = newBio.trim();

    if (trimmedNewBio.length > BIO_MAX_LENGTH) {
      setError(`Bio cannot exceed ${BIO_MAX_LENGTH} characters.`);
      return;
    }

    // Allow saving an empty bio to clear it
    if (trimmedNewBio === (currentBio || '').trim()) {
      onClose(); 
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedNewBio);
      onClose(); 
    } catch (err: any) {
      setError(err.message || "Failed to update bio. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const charactersRemaining = BIO_MAX_LENGTH - newBio.length;

  return (
    <Dialog open={isOpen} onOpenChange={(openStatus) => !openStatus && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Your Bio</DialogTitle>
            <DialogDescription>
              Share a little about yourself. Max {BIO_MAX_LENGTH} characters.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="newBio" className="sr-only">
                Bio
              </Label>
              <Textarea
                id="newBio"
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="col-span-4 min-h-[100px]"
                disabled={isSaving}
                maxLength={BIO_MAX_LENGTH}
                autoFocus
              />
              <p className={`text-xs ${charactersRemaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charactersRemaining} characters remaining
              </p>
            </div>
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
              disabled={isSaving || newBio.trim() === (currentBio || '').trim() || newBio.length > BIO_MAX_LENGTH}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Bio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
