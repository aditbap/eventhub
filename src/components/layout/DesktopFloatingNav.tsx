
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CalendarDays, Plus, UserCircle, Wrench, type Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  isDisabled?: boolean; 
}

const navItems: NavItem[] = [
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/create', label: 'Create', icon: Plus },
  { href: '/map', label: 'Map', icon: Wrench, isDisabled: true }, 
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function DesktopFloatingNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2", 
        "bg-background/90 backdrop-blur-lg", 
        "border border-border shadow-xl rounded-full", 
        "hidden md:flex", 
        "z-50" 
      )}
    >
      <div className="flex items-center justify-center px-3 h-14"> 
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || (item.href === '/explore' && pathname === '/');
          const isCreateButton = item.label === 'Create';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center rounded-md transition-colors duration-200 ease-in-out h-full mx-1 px-3 min-w-[70px]',
                isActive && !isCreateButton && !item.isDisabled
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground',
                isCreateButton && isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90 scale-105 shadow-md rounded-lg px-4' :
                isCreateButton ? 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4' : 
                'hover:bg-muted/20',
                item.isDisabled && 'opacity-50 cursor-not-allowed hover:text-muted-foreground'
              )}
              aria-label={item.label}
              onClick={(e) => {
                if (item.isDisabled) e.preventDefault();
              }}
            >
              <item.icon 
                className={cn(
                  'h-6 w-6',
                  isCreateButton ? 'text-primary-foreground' : (isActive && !item.isDisabled ? 'text-primary' : '')
                )}
              />
              <span className={cn(
                "text-xs font-medium mt-0.5",
                 isCreateButton ? 'text-primary-foreground' : (isActive && !item.isDisabled ? 'text-primary' : ''),
                 item.isDisabled && "text-muted-foreground/80"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
