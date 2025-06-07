
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, CalendarDays, Plus, UserCircle, type Icon } from 'lucide-react'; // Removed MapPin
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  isCreateButton?: boolean;
}

const navItems: NavItem[] = [
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/create', label: 'Create', icon: Plus, isCreateButton: true },
  // { href: '/map', label: 'Map', icon: MapPin }, // Removed Map item
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-t-lg md:hidden z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-sm mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/explore' && pathname === '/');
          
          if (item.isCreateButton) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 z-10" // Negative margin to elevate
                aria-label={item.label}
              >
                <div className={cn(
                  "flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 ease-out",
                  isActive ? "scale-110" : ""
                )}>
                  <item.icon className="h-7 w-7" />
                </div>
                {/* Label for create button is usually omitted when icon is large and distinct */}
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-1/5 text-muted-foreground hover:text-primary transition-colors pt-1 pb-0.5', // Adjusted width to w-1/4 since there are 4 items now
                isActive && 'text-primary'
              )}
              aria-label={item.label}
            >
              <item.icon className={cn('h-6 w-6 mb-0.5', isActive ? 'text-primary' : '')} 
                // fill prop removed: Lucide icons will use currentColor for stroke, set by text-primary
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

