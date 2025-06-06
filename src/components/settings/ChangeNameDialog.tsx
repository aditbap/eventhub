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
import { Loader2 } from 'lucide-react';

interface ChangeNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => Promise<void>; // This function can throw an error for the dialog to catch
}

export function ChangeNameDialog({ isOpen, onClose, currentName, onSave }: ChangeNameDialogProps) {
  const [newName, setNewName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName || ''); // Ensure currentName is not null
      setIsSaving(false);
      setError(null);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedNewName = newName.trim();

    if (!trimmedNewName) {
      setError("Name cannot be empty.");
      return;
    }
    if (trimmedNewName === (currentName || '').trim()) {
      onClose(); // No change, just close
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedNewName);
      onClose(); // Close dialog on successful save
    } catch (err: any) {
      setError(err.message || "Failed to update name. Please try again.");
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
            <DialogTitle>Change Your Name</DialogTitle>
            <DialogDescription>
              Enter your new display name below. This will be visible on your profile and tickets.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newName" className="text-right sr-only">
                Name
              </Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your new name"
                className="col-span-4"
                disabled={isSaving}
                autoFocus
              />
            </div>
            {error && <p className="col-span-4 text-sm text-destructive px-1">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isSaving || !newName.trim() || newName.trim() === (currentName || '').trim()}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
