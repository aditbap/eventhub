
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
import { Loader2, CalendarIcon } from 'lucide-react';

interface ChangeBirthDateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentBirthDate: string; // Expects YYYY-MM-DD or empty
  onSave: (newBirthDate: string) => Promise<void>;
}

export function ChangeBirthDateDialog({ isOpen, onClose, currentBirthDate, onSave }: ChangeBirthDateDialogProps) {
  const [newBirthDate, setNewBirthDate] = useState(currentBirthDate);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewBirthDate(currentBirthDate || '');
      setIsSaving(false);
      setError(null);
    }
  }, [isOpen, currentBirthDate]);

  const isValidDate = (dateString: string): boolean => {
    // Basic YYYY-MM-DD format check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    // Check if date components are valid and form a real date
    return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedNewBirthDate = newBirthDate.trim();

    if (!trimmedNewBirthDate) {
      setError("Birth date cannot be empty.");
      return;
    }
    if (!isValidDate(trimmedNewBirthDate)) {
      setError("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }
    if (trimmedNewBirthDate === (currentBirthDate || '').trim()) {
      onClose(); // No change, just close
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedNewBirthDate);
      onClose(); 
    } catch (err: any) {
      setError(err.message || "Failed to update birth date. Please try again.");
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
            <DialogTitle>Change Your Birth Date</DialogTitle>
            <DialogDescription>
              Enter your new birth date below in YYYY-MM-DD format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative">
              <Label htmlFor="newBirthDate" className="sr-only">
                Birth Date
              </Label>
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                id="newBirthDate"
                value={newBirthDate}
                onChange={(e) => setNewBirthDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="pl-10"
                disabled={isSaving}
                autoFocus
              />
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
              disabled={isSaving || !newBirthDate.trim() || !isValidDate(newBirthDate.trim()) || newBirthDate.trim() === (currentBirthDate || '').trim()}
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
