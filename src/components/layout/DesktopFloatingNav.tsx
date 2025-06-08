'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CalendarDays, Plus, UserCircle, MapPin, type Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

// Navigation items, similar to mobile but will be styled horizontally
const navItems: NavItem[] = [
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/create', label: 'Create', icon: Plus },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function DesktopFloatingNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2", // Positions the bar at the bottom-center
        "bg-background/90 backdrop-blur-lg", // Styling for the floating effect (semi-transparent background with blur)
        "border border-border shadow-xl rounded-full", // Border, shadow, and rounded corners
        "hidden md:flex", // Only visible on medium screens and up (desktop)
        "z-50" // Ensures it stays on top of other content
      )}
    >
      <div className="flex items-center justify-center px-3 h-14"> {/* Container for nav items */}
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || (item.href === '/explore' && pathname === '/');
          const isCreateButton = item.label === 'Create'; // Special handling for Create button style

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center rounded-md transition-colors duration-200 ease-in-out h-full mx-1 px-3 min-w-[70px]',
                isActive && !isCreateButton
                  ? 'text-primary' // Active state for regular items
                  : 'text-muted-foreground hover:text-foreground',
                isCreateButton && isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90 scale-105 shadow-md rounded-lg px-4' :
                isCreateButton ? 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4' : 
                'hover:bg-muted/20' // Hover for non-create buttons
              )}
              aria-label={item.label}
            >
              <item.icon 
                className={cn(
                  'h-6 w-6',
                  isCreateButton ? 'text-primary-foreground' : (isActive ? 'text-primary' : '')
                )}
              />
              <span className={cn(
                "text-xs font-medium mt-0.5",
                 isCreateButton ? 'text-primary-foreground' : (isActive ? 'text-primary' : '')
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
