
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CalendarDays, Plus, UserCircle, Users, type Icon } from 'lucide-react'; // Removed Wrench
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  isCreateButton?: boolean;
  isDisabled?: boolean;
}

// Order adjusted to place Create in the middle for odd numbers of primary tabs
const navItems: NavItem[] = [
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/create', label: 'Create', icon: Plus, isCreateButton: true },
  { href: '/social', label: 'Social', icon: Users, isDisabled: true },
  { href: '/profile', label: 'Profile', icon: UserCircle },
  // { href: '/map', label: 'Map', icon: Wrench, isDisabled: true }, // Map tab removed
];


export function BottomNavigationBar() {
  const pathname = usePathname();

  // Filter out the Map item for mobile view if it makes the bar too crowded
  // This filter is now redundant as Map is removed from navItems, but kept for clarity if other items are conditionally removed later.
  const mobileNavItems = navItems.filter(item => item.label !== 'Map');


  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-t-lg md:hidden z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-sm mx-auto px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/explore' && pathname === '/');

          if (item.isCreateButton) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 z-10"
                aria-label={item.label}
              >
                <div className={cn(
                  "flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 ease-out",
                  isActive ? "scale-110" : ""
                )}>
                  <item.icon className="h-7 w-7" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-1/5 text-muted-foreground hover:text-primary transition-colors pt-1 pb-0.5', // Adjusted w-1/5 for 5 items
                isActive && !item.isDisabled && 'text-primary',
                item.isDisabled && 'opacity-50 cursor-not-allowed hover:text-muted-foreground'
              )}
              aria-label={item.label}
              onClick={(e) => {
                if (item.isDisabled) e.preventDefault();
              }}
            >
              <item.icon className={cn('h-6 w-6 mb-0.5', isActive && !item.isDisabled ? 'text-primary' : '')}
              />
              <span className={cn("text-xs font-medium", item.isDisabled && "text-muted-foreground/80")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
