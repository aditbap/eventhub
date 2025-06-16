
'use client';

import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LinkIcon, MessageSquare, Copy } from 'lucide-react';

// SVG Icons for social media (simplified versions)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M16.75 13.96c.25.83-.25 1.5-.83 1.75-.5.17-1.08.17-1.58-.08-.5-.25-.92-.5-1.25-.75-.33-.25-.67-.58-1.08-.92-.42-.33-.75-.67-1.08-1-.33-.33-.67-.75-1-1.08-.33-.42-.5-.75-.75-1.25-.25-.5-.25-1.08-.08-1.58.25-.58.92-1.08 1.75-.83.25.08.42.17.58.25.17.17.33.42.5.67.17.25.25.42.33.5.08.17.17.25.25.33.25.33.5.58.75.83.25.25.5.42.83.58.25.08.42.17.5.17.08.08.17.17.25.25.25.17.5.33.67.5.25.17.42.25.5.33.17.08.25.17.33.17.08.08.17.17.25.25.17.17.25.33.33.5.08.17.17.25.25.33.08.08.08.17.08.25zM12 2a10 10 0 100 20 10 10 0 000-20zm0 18.5c-4.75 0-8.5-3.75-8.5-8.5s3.75-8.5 8.5-8.5 8.5 3.75 8.5 8.5-3.75 8.5-8.5 8.5z"></path></svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.555 1.587-1.555l1.684-.002V3.121c-.291-.039-1.29-.125-2.455-.125-2.43 0-4.102 1.486-4.102 4.225v2.358H7.42v3.209h2.753v8.196h3.224z"></path></svg>
);
const MessengerIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M12 2.031c-5.523 0-10 3.586-10 7.996 0 2.203.898 4.207 2.363 5.695-.32.984-.73 1.883-1.223 2.672-.207.328-.125.765.195.992.156.102.336.148.516.148.195 0 .39-.062.554-.187 1.14-.844 2.074-1.46 2.633-1.9.902.266 1.847.407 2.816.407 5.523 0 10-3.586 10-7.996S17.523 2.031 12 2.031zm.582 10.184l-3.113-3.129-5.762 3.129c.195-.93.133-1.992-.172-3.129l4.64-4.754 3.114 3.129 5.766-3.129c-.203.934-.14 2-.176 3.133l-4.643 4.754h.004z"></path></svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M22.46 6c-.77.35-1.6.58-2.46.67.9-.53 1.59-1.37 1.92-2.38-.84.5-1.78.86-2.79 1.07C18.26 4.42 17.03 4 15.64 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C7.73 8.98 4.1 7.16 1.68 4.36c-.34.58-.53 1.25-.53 1.97 0 1.49.76 2.8 1.92 3.57-.71 0-1.37-.22-1.95-.53v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 01-1.94.07 4.28 4.28 0 004 2.98 8.521 8.521 0 01-5.33 1.84c-.34 0-.68-.02-1.01-.06C3.18 20.29 5.26 21 7.5 21c7.62 0 11.99-6.39 11.99-12.16 0-.18 0-.37-.01-.55.81-.59 1.51-1.32 2.07-2.16z"></path></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const SkypeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M21.671 15.814c-1.267-2.039-3.09-3.34-5.331-4.148-.494-.179-.933.028-1.107.499-.159.429.011.858.478 1.128 1.54.891 2.373 1.934 2.887 3.192.532 1.319.532 2.738.028 4.045-.538 1.382-1.727 2.348-3.357 2.681-1.499.304-3.018-.042-4.243-.818-1.254-.796-1.993-1.98-2.12-3.383-.112-1.211.336-2.332 1.159-3.164.818-.818 1.967-1.318 3.297-1.346 1.28-.028 2.402.309 3.283.921.378.252.869.168 1.14-.196.28-.379.21-.903-.168-1.164C16.14 8.36 14.291 7.99 12.46 8c-1.765.011-3.41.54-4.747 1.561-1.346 1.014-2.277 2.443-2.549 4.102-.252 1.658.126 3.331.995 4.717.922 1.469 2.381 2.522 4.118 2.995 1.821.499 3.733.322 5.382-.409 1.693-.74 2.994-1.993 3.654-3.612.686-1.67.686-3.524 0-5.235l-.015-.037z"></path></svg>
);

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventUrl: string;
}

interface ShareOption {
  name: string;
  icon: React.ElementType;
  action: () => void;
  href?: string; // For direct links
}

export function ShareSheet({ isOpen, onClose, eventTitle, eventUrl }: ShareSheetProps) {
  const { toast } = useToast();
  const [currentEventUrl, setCurrentEventUrl] = useState('');

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      setCurrentEventUrl(window.location.href);
    }
  }, [isOpen]);


  const handleCopyLink = async () => {
    if (!currentEventUrl) return;
    try {
      await navigator.clipboard.writeText(currentEventUrl);
      toast({
        title: 'Link Copied!',
        description: 'Event link copied to your clipboard.',
        action: <Copy className="text-green-500" />,
      });
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not copy link. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to copy: ', err);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      name: 'Copy Link',
      icon: LinkIcon,
      action: handleCopyLink,
    },
    {
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      href: `https://wa.me/?text=${encodeURIComponent(`Check out this event: ${eventTitle} - ${currentEventUrl}`)}`,
      action: () => {}, // Action handled by href
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentEventUrl)}&quote=${encodeURIComponent(`Check out this event: ${eventTitle}`)}`,
      action: () => {},
    },
    {
      name: 'Messenger',
      icon: MessengerIcon,
      action: () => toast({ title: 'Share to Messenger', description: 'This feature will be implemented soon.' }),
    },
    {
      name: 'Twitter',
      icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentEventUrl)}&text=${encodeURIComponent(`Check out this event: ${eventTitle}`)}`,
      action: () => {},
    },
    {
      name: 'Instagram',
      icon: InstagramIcon,
      action: () => toast({ title: 'Share to Instagram', description: 'This feature will be implemented soon.' }),
    },
    {
      name: 'Skype',
      icon: SkypeIcon,
      action: () => toast({ title: 'Share to Skype', description: 'This feature will be implemented soon.' }),
    },
    {
      name: 'Message',
      icon: MessageSquare,
      href: `sms:?&body=${encodeURIComponent(`Check out this event: ${eventTitle} - ${currentEventUrl}`)}`,
      action: () => {},
    },
  ];


  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-xl font-semibold text-center">Share with friends</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-4 gap-x-2 gap-y-6 p-6 justify-items-center">
          {shareOptions.map((option) => (
            <div key={option.name} className="flex flex-col items-center text-center">
              {option.href ? (
                <a
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-muted transition-colors w-full"
                  aria-label={`Share to ${option.name}`}
                >
                  <div className="bg-muted/60 rounded-xl p-3 mb-1.5 flex items-center justify-center h-14 w-14">
                    <option.icon />
                  </div>
                  <span className="text-xs text-muted-foreground">{option.name}</span>
                </a>
              ) : (
                <button
                  onClick={() => { option.action(); if (option.name !== 'Copy Link') onClose();}}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-muted transition-colors w-full"
                  aria-label={`Share via ${option.name}`}
                >
                  <div className="bg-muted/60 rounded-xl p-3 mb-1.5 flex items-center justify-center h-14 w-14">
                     <option.icon />
                  </div>
                  <span className="text-xs text-muted-foreground">{option.name}</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <SheetFooter className="p-4 border-t">
          <SheetClose asChild>
            <Button variant="outline" className="w-full h-12 text-base">
              CANCEL
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
