
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, User as UserIcon, Mail, Lock, Phone, UserRound as GenderIcon, Plus, Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';

interface SettingsItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const SettingsListItem: React.FC<SettingsItemProps> = ({ icon: IconComponent, label, value, href, onClick, className }) => {
  const itemContent = (
    <>
      <IconComponent className="h-5 w-5 mr-4 text-muted-foreground shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        {value && <p className="text-sm text-muted-foreground truncate">{value}</p>}
      </div>
      { (href || onClick) && <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 shrink-0" /> }
    </>
  );

  const baseClasses = "flex items-center py-4 px-4 bg-card w-full text-left";
  const interactiveClasses = "hover:bg-muted/50 transition-colors";

  if (href) {
    return <Link href={href} className={cn(baseClasses, interactiveClasses, className)}>{itemContent}</Link>;
  }
  if (onClick) {
    return <button onClick={onClick} className={cn(baseClasses, interactiveClasses, className)}>{itemContent}</button>;
  }
  return <div className={cn(baseClasses, className)}>{itemContent}</div>;
};


export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!user) { 
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const accountItems: SettingsItemProps[] = [
    { icon: UserIcon, label: 'Full name', value: user.displayName || 'N/A', href: '#' }, 
    { icon: Mail, label: 'Email', value: user.email || 'N/A' }, 
    { icon: Lock, label: 'Change Password', value: '••••••••••••', href: '/new-password' }, 
    { icon: Phone, label: 'Day of birth', value: '02/02/2005', href: '#' }, 
    { icon: GenderIcon, label: 'Gender', value: 'Male', href: '#' }, 
  ];

  const handleDeleteAccountConfirm = () => {
    console.log('Account deletion confirmed by user. Implement actual deletion logic here.');
    // Example: Call a function from useAuth like `await deleteAccount();`
    // This function would handle Firebase re-authentication and user deletion.
    // After successful deletion, navigate the user (e.g., to login page).
    setIsDeleteDialogOpen(false);
    // For now, just log out as a placeholder
    logout(); 
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Settings</h1>
        <div className="w-9 h-9"></div> 
      </header>

      <div className="flex flex-col items-center pt-6 pb-6 px-4">
        <Avatar className="h-24 w-24 mb-4 border-2 border-border shadow-sm">
          <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0)}`} alt={user.displayName || 'User'} data-ai-hint="dog avatar" />
          <AvatarFallback className="text-3xl">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <Button variant="outline" className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 text-sm font-medium border-none shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Change Profile Picture
        </Button>
      </div>

      <div className="px-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</h2>
        <div className="rounded-lg shadow-sm overflow-hidden border border-border bg-card">
          {accountItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <SettingsListItem
                icon={item.icon}
                label={item.label}
                value={item.value}
                href={item.href}
              />
              {index < accountItems.length - 1 && <hr className="border-border ml-4" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div className="px-4 mt-8">
         <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Session</h2>
        <div className="rounded-lg shadow-sm overflow-hidden border border-border bg-card">
          <SettingsListItem
            icon={LogOut}
            label="Logout"
            value=""
            onClick={async () => {
              await logout();
            }}
          />
        </div>
      </div>

      <div className="px-4 mt-8 mb-8">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Danger Zone</h2>
        <div className="rounded-lg shadow-sm overflow-hidden border border-destructive/50 bg-card">
           <button 
            onClick={() => setIsDeleteDialogOpen(true)} 
            className={cn(
              "flex items-center py-4 px-4 bg-card w-full text-left hover:bg-destructive/10 transition-colors"
            )}
          >
            <ShieldAlert className="h-5 w-5 mr-4 text-destructive shrink-0" />
            <div className="flex-grow min-w-0">
              <p className="text-sm font-medium text-destructive truncate">Delete Account</p>
              <p className="text-sm text-destructive/70 truncate">Permanently remove your account and all associated data.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-destructive/70 ml-2 shrink-0" />
          </button>
        </div>
      </div>

      <DeleteAccountDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccountConfirm}
      />
    </div>
  );
}
