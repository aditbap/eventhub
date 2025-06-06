
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

interface ChangeGenderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentGender: string; // Expects 'Male', 'Female', 'Other', 'Prefer not to say', or empty
  onSave: (newGender: string) => Promise<void>;
}

const genderOptions = [
  { id: 'male', value: 'Male', label: 'Male' },
  { id: 'female', value: 'Female', label: 'Female' },
  { id: 'other', value: 'Other', label: 'Other' },
  { id: 'preferNotToSay', value: 'Prefer not to say', label: 'Prefer not to say' },
];

export function ChangeGenderDialog({ isOpen, onClose, currentGender, onSave }: ChangeGenderDialogProps) {
  const [selectedGender, setSelectedGender] = useState(currentGender);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedGender(currentGender || '');
      setIsSaving(false);
      setError(null);
    }
  }, [isOpen, currentGender]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedGender) {
      setError("Please select a gender option.");
      return;
    }
    if (selectedGender === currentGender) {
      onClose(); // No change, just close
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selectedGender);
      onClose(); 
    } catch (err: any) {
      setError(err.message || "Failed to update gender. Please try again.");
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
            <DialogTitle>Change Your Gender</DialogTitle>
            <DialogDescription>
              Select your gender from the options below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup 
              value={selectedGender} 
              onValueChange={setSelectedGender}
              className="space-y-2"
              disabled={isSaving}
            >
              {genderOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.id} />
                  <Label htmlFor={option.id}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
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
              disabled={isSaving || !selectedGender || selectedGender === currentGender}
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
