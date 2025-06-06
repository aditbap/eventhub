
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Bell, BellRing } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SmilingBellIcon = () => (
  <div className="relative w-48 h-48 text-primary/20">
    {/* Bell Shape */}
    <Bell className="w-full h-full" strokeWidth={1.5} />
    {/* Ringing lines - subtle */}
    <BellRing className="absolute top-4 left-4 w-8 h-8 animate-pulse opacity-50" strokeWidth={1.5} />
    
    {/* Smile */}
    <svg 
      viewBox="0 0 100 100" 
      className="absolute bottom-[28%] left-1/2 transform -translate-x-1/2 w-1/3 h-1/3 text-primary"
      fill="none" 
      stroke="currentColor" 
      strokeWidth="5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M25 50 Q50 75, 75 50" />
    </svg>
    {/* Eyes */}
    <div className="absolute top-[38%] left-[38%] w-3 h-3 bg-primary rounded-full"></div>
    <div className="absolute top-[38%] right-[38%] w-3 h-3 bg-primary rounded-full"></div>

     {/* Badge */}
    <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-background">
      0
    </div>
  </div>
);


export default function NotificationPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Notification</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/20 rounded-full">
              <MoreVertical className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark all as read</DropdownMenuItem>
            <DropdownMenuItem>Notification settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <SmilingBellIcon />
        <p className="text-xl font-semibold text-primary mt-8 mb-2">
          No Notifications!
        </p>
        <p className="text-muted-foreground">
          No notifications for now!
        </p>
      </main>
    </div>
  );
}
