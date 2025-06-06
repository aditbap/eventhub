
'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button'; // For the destructive action button
import { Loader2 } from 'lucide-react';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // This will eventually trigger the actual deletion logic
}

const CONFIRMATION_TEXT = "DELETE";

export function DeleteAccountDialog({ isOpen, onClose, onConfirm }: DeleteAccountDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDeleting, setIsDeleting] = useState(false); // For loading state during deletion

  const isConfirmationMatched = inputValue === CONFIRMATION_TEXT;

  useEffect(() => {
    if (isOpen) {
      setInputValue(''); // Reset input when dialog opens
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirmClick = async () => {
    if (!isConfirmationMatched) return;
    setIsDeleting(true);
    try {
      // Simulate API call or actual deletion process
      await new Promise(resolve => setTimeout(resolve, 1500)); // Placeholder for actual deletion
      onConfirm(); 
    } catch (error) {
      console.error("Error during account deletion:", error);
      // Handle error display if necessary
    } finally {
      // setIsDeleting(false); // onClose will reset this via useEffect
      // onClose(); // onConfirm should handle closing if successful
    }
  };

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            <br />
            To confirm, please type "<strong>{CONFIRMATION_TEXT}</strong>" in the box below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2 space-y-2">
          <Label htmlFor="delete-confirm-input" className="sr-only">
            Type {CONFIRMATION_TEXT} to confirm
          </Label>
          <Input
            id="delete-confirm-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Type "${CONFIRMATION_TEXT}" here`}
            className="border-destructive focus:border-destructive ring-destructive"
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirmClick}
            disabled={!isConfirmationMatched || isDeleting}
            aria-label="Confirm account deletion"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
