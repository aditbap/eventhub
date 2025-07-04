
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, User as UserIcon, Mail, Lock, Phone, UserRound as GenderIcon, Camera, Loader2, LogOut, ShieldAlert, CheckCircle, CalendarIcon, AtSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';
import { ChangeNameDialog } from '@/components/settings/ChangeNameDialog';
import { ChangeBirthDateDialog } from '@/components/settings/ChangeBirthDateDialog';
import { ChangeGenderDialog } from '@/components/settings/ChangeGenderDialog';
import { ChangeUsernameDialog } from '@/components/settings/ChangeUsernameDialog'; // Import new dialog
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { formatDistanceToNowStrict } from 'date-fns';


interface SettingsItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const SettingsListItem: React.FC<SettingsItemProps> = ({ icon: IconComponent, label, value, subValue, href, onClick, className, disabled }) => {
  const itemContent = (
    <>
      <IconComponent className="h-5 w-5 mr-4 text-muted-foreground shrink-0" />
      <div className="flex-grow min-w-0">
        <p className={cn("text-sm font-medium text-foreground truncate", disabled && "opacity-50")}>{label}</p>
        {value && <p className={cn("text-sm text-muted-foreground truncate", disabled && "opacity-50")}>{value}</p>}
        {subValue && <p className={cn("text-xs text-muted-foreground/70 truncate", disabled && "opacity-50")}>{subValue}</p>}
      </div>
      { (href || onClick) && !disabled && <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 shrink-0" /> }
    </>
  );

  const baseClasses = "flex items-center py-4 px-4 bg-card w-full text-left";
  const interactiveClasses = "hover:bg-muted/50 transition-colors";
  const disabledClasses = "cursor-not-allowed opacity-70";

  if (disabled) {
    return <div className={cn(baseClasses, disabledClasses, className)}>{itemContent}</div>;
  }
  if (href) {
    return <Link href={href} className={cn(baseClasses, interactiveClasses, className)}>{itemContent}</Link>;
  }
  if (onClick) {
    return <button onClick={onClick} className={cn(baseClasses, interactiveClasses, className)}>{itemContent}</button>;
  }
  return <div className={cn(baseClasses, className)}>{itemContent}</div>;
};


export default function SettingsPage() {
  const { user, loading, logout, updateUserName, updateUserBirthDate, updateUserGender, updateUserProfilePicture, updateUserUsername } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isChangeNameDialogOpen, setIsChangeNameDialogOpen] = useState(false);
  const [isChangeUsernameDialogOpen, setIsChangeUsernameDialogOpen] = useState(false); // State for username dialog
  const [isChangeBirthDateDialogOpen, setIsChangeBirthDateDialogOpen] = useState(false);
  const [isChangeGenderDialogOpen, setIsChangeGenderDialogOpen] = useState(false);
  const [currentBirthDate, setCurrentBirthDate] = useState('N/A');
  const [currentGender, setCurrentGender] = useState('N/A');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [usernameChangeInfo, setUsernameChangeInfo] = useState<{ nextChangeAllowedIn?: string; lastChanged?: string; restricted: boolean }>({ restricted: false });


  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentBirthDate(data?.birthDate || 'N/A');
            setCurrentGender(data?.gender || 'N/A');
            
            const lastChanged = data?.usernameLastChangedAt as Timestamp | null;
            if (lastChanged) {
              const lastChangedDate = lastChanged.toDate();
              const thirtyDaysLater = new Date(lastChangedDate);
              thirtyDaysLater.setDate(lastChangedDate.getDate() + 30);
              const now = new Date();
              if (now < thirtyDaysLater) {
                setUsernameChangeInfo({
                  lastChanged: `Changed ${formatDistanceToNowStrict(lastChangedDate, { addSuffix: true })}`,
                  nextChangeAllowedIn: `Next change in ${formatDistanceToNowStrict(thirtyDaysLater, { addSuffix: false })}`,
                  restricted: true,
                });
              } else {
                 setUsernameChangeInfo({ lastChanged: `Changed ${formatDistanceToNowStrict(lastChangedDate, { addSuffix: true })}`, restricted: false });
              }
            } else {
                setUsernameChangeInfo({ restricted: false, lastChanged: "Not changed recently" });
            }

          } else {
            setCurrentBirthDate('N/A');
            setCurrentGender('N/A');
            setUsernameChangeInfo({ restricted: false, lastChanged: "Not set" });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentBirthDate('N/A');
          setCurrentGender('N/A');
          setUsernameChangeInfo({ restricted: false, lastChanged: "Error loading data" });
        }
      }
    };
    fetchUserData();
  }, [user]);


  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (!user) { 
    router.replace('/login');
    return <div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setIsUploadingPicture(true);
      updateUserProfilePicture(file)
        .then(result => {
          if (result.success && result.photoURL) {
            toast({
              title: "Profile Picture Updated",
              description: "Your new profile picture has been set.",
              action: <CheckCircle className="h-5 w-5 text-green-500" />,
            });
          } else {
            throw new Error(result.error?.message || "Failed to update profile picture.");
          }
        })
        .catch(error => {
          toast({
            title: "Upload Failed",
            description: error.message || "Could not upload your profile picture.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsUploadingPicture(false);
          if(fileInputRef.current) { 
            fileInputRef.current.value = "";
          }
        });
    }
  };

  const accountItems: SettingsItemProps[] = [
    { 
      icon: UserIcon, 
      label: 'Full name', 
      value: user.displayName || 'N/A', 
      onClick: () => setIsChangeNameDialogOpen(true)
    }, 
    { 
      icon: AtSign, 
      label: 'Username', 
      value: user.username ? `@${user.username}` : 'Not set',
      subValue: usernameChangeInfo.restricted ? usernameChangeInfo.nextChangeAllowedIn : usernameChangeInfo.lastChanged,
      onClick: () => setIsChangeUsernameDialogOpen(true),
      disabled: !user.username // Disable if initial username not set (should be forced by set-username page)
    },
    { icon: Mail, label: 'Email', value: user.email || 'N/A' }, 
    { icon: Lock, label: 'Change Password', value: '••••••••••••', href: '/new-password' }, 
    { 
      icon: CalendarIcon,
      label: 'Day of birth', 
      value: currentBirthDate,
      onClick: () => setIsChangeBirthDateDialogOpen(true)
    }, 
    { 
      icon: GenderIcon, 
      label: 'Gender', 
      value: currentGender, 
      onClick: () => setIsChangeGenderDialogOpen(true) 
    },
  ];

  const handleDeleteAccountConfirm = () => {
    console.log('Account deletion confirmed by user. Implement actual deletion logic here.');
    setIsDeleteDialogOpen(false);
    logout(); 
  };

  const handleSaveName = async (newName: string) => {
    const result = await updateUserName(newName);
    if (result.success) {
      toast({
        title: "Name Updated",
        description: "Your display name has been successfully updated.",
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } else {
      throw new Error(result.error?.message || "Failed to update name. Please try again.");
    }
  };

  const handleSaveUsername = async (newUsername: string) => {
    const result = await updateUserUsername(newUsername);
    if (result.success) {
      toast({
        title: "Username Updated",
        description: `Your username is now @${newUsername}.`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      // Refetch username change info
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const lastChanged = data?.usernameLastChangedAt as Timestamp | null;
             if (lastChanged) {
              const lastChangedDate = lastChanged.toDate();
              const thirtyDaysLater = new Date(lastChangedDate);
              thirtyDaysLater.setDate(lastChangedDate.getDate() + 30);
              setUsernameChangeInfo({
                  lastChanged: `Changed ${formatDistanceToNowStrict(lastChangedDate, { addSuffix: true })}`,
                  nextChangeAllowedIn: `Next change in ${formatDistanceToNowStrict(thirtyDaysLater, { addSuffix: false })}`,
                  restricted: new Date() < thirtyDaysLater,
                });
            } else {
                 setUsernameChangeInfo({ restricted: false, lastChanged: "Not changed recently" });
            }
        }
    } else {
      // Error with nextChangeDate will be handled by the dialog
      throw new Error(result.error?.message || "Failed to update username.");
    }
  };

  const handleSaveBirthDate = async (newBirthDate: string) => {
    const result = await updateUserBirthDate(newBirthDate);
    if (result.success) {
      setCurrentBirthDate(newBirthDate);
      toast({
        title: "Birth Date Updated",
        description: "Your birth date has been successfully updated.",
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } else {
      throw new Error(result.error?.message || "Failed to update birth date. Please try again.");
    }
  };

  const handleSaveGender = async (newGender: string) => {
    const result = await updateUserGender(newGender);
    if (result.success) {
      setCurrentGender(newGender);
      toast({
        title: "Gender Updated",
        description: "Your gender has been successfully updated.",
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } else {
      throw new Error(result.error?.message || "Failed to update gender. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.push('/profile')} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Settings</h1>
        <div className="w-9 h-9"></div> 
      </header>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleProfilePictureChange}
        accept="image/png, image/jpeg, image/gif"
        style={{ display: 'none' }}
        disabled={isUploadingPicture}
      />

      <div className="flex flex-col items-center pt-6 pb-6 px-4">
        <Avatar className="h-24 w-24 mb-4 border-2 border-border shadow-sm">
          <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.charAt(0)}`} alt={user.displayName || 'User'} data-ai-hint="profile avatar settings" />
          <AvatarFallback className="text-3xl">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <Button 
          variant="outline" 
          className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 text-sm font-medium border-none shadow-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingPicture || loading}
        >
          {isUploadingPicture ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          {isUploadingPicture ? 'Uploading...' : 'Change Profile Picture'}
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
                subValue={item.subValue}
                href={item.href}
                onClick={item.onClick}
                disabled={item.disabled}
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

      <ChangeNameDialog
        isOpen={isChangeNameDialogOpen}
        onClose={() => setIsChangeNameDialogOpen(false)}
        currentName={user.displayName || ''}
        onSave={handleSaveName}
      />

      {user.username && ( // Only render if there's a username to change
        <ChangeUsernameDialog
          isOpen={isChangeUsernameDialogOpen}
          onClose={() => setIsChangeUsernameDialogOpen(false)}
          currentUsername={user.username}
          usernameLastChangedAt={user.usernameLastChangedAt || null}
          onSave={handleSaveUsername}
        />
      )}
      
      <ChangeBirthDateDialog
        isOpen={isChangeBirthDateDialogOpen}
        onClose={() => setIsChangeBirthDateDialogOpen(false)}
        currentBirthDate={currentBirthDate === 'N/A' ? '' : currentBirthDate}
        onSave={handleSaveBirthDate}
      />

      <ChangeGenderDialog
        isOpen={isChangeGenderDialogOpen}
        onClose={() => setIsChangeGenderDialogOpen(false)}
        currentGender={currentGender === 'N/A' ? '' : currentGender}
        onSave={handleSaveGender}
      />
    </div>
  );
}
