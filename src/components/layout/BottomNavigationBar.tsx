'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, PlusSquare, MapPin, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/explore', label: 'Explore', icon: Home },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/create', label: 'Create', icon: PlusSquare },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-t-lg md:hidden z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/explore' && pathname === '/'); // Consider Explore active for root
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-1/5 text-muted-foreground hover:text-primary transition-colors',
                isActive && 'text-primary'
              )}
            >
              <item.icon className={cn('h-6 w-6 mb-0.5', isActive ? 'fill-primary/20' : '')} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
