
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { UpjLogo } from '@/components/icons/UpjLogo';
import { Compass, CalendarDays, PlusCircle, UserCircle, Settings as SettingsIcon, LogOut, Ticket, MapPin, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/events', label: 'All Events', icon: CalendarDays },
  { href: '/create', label: 'Create Event', icon: PlusCircle },
  { href: '/map', label: 'Map', icon: MapPin },
];

const userActivityItems = [
  { href: '/profile/my-tickets', label: 'My Tickets', icon: Ticket },
  { href: '/profile/saved-events', label: 'Saved Events', icon: Bookmark },
];

const accountNavItems = [
  { href: '/profile', label: 'Profile', icon: UserCircle },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // router.push will be handled by AuthContext side effect
  };

  if (!user) return null; // Don't render sidebar if user is not available yet

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar" // Standard sidebar style
      className="hidden md:flex flex-col border-r bg-card" // Only show on md and up, ensure flex-col layout
      defaultOpen={true} // Default to expanded on desktop
    >
      <SidebarHeader className="p-4 border-b">
        <Link href="/explore" className="flex items-center gap-2" aria-label="Go to Explore page">
          <UpjLogo iconOnly className="h-8 w-8 text-primary" fill="hsl(var(--primary))" />
          <span className={cn(
            "font-semibold text-lg text-foreground",
            "group-data-[state=collapsed]:hidden" // class from ui/sidebar for when collapsed
          )}>
            UPJ EventHub
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-grow p-2 space-y-4">
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  className="w-full justify-start text-foreground hover:bg-muted hover:text-primary"
                  isActive={pathname === item.href || (item.href === '/explore' && pathname === '/')}
                  tooltip={{children: item.label, side: "right", align: "center" }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Separator */}
        <div className={cn(
          "h-px bg-border mx-2",
          "group-data-[state=collapsed]:mx-auto group-data-[state=collapsed]:w-3/4"
        )}></div>

        <SidebarMenu>
          {userActivityItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  className="w-full justify-start text-foreground hover:bg-muted hover:text-primary"
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{children: item.label, side: "right", align: "center" }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        {/* Separator */}
        <div className={cn(
          "h-px bg-border mx-2",
          "group-data-[state=collapsed]:mx-auto group-data-[state=collapsed]:w-3/4"
        )}></div>

        <SidebarMenu>
          {accountNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  className="w-full justify-start text-foreground hover:bg-muted hover:text-primary"
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{children: item.label, side: "right", align: "center" }}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        <SidebarMenuButton
          onClick={handleLogout}
          className="w-full justify-start text-foreground hover:bg-muted hover:text-primary"
          tooltip={{children: "Logout", side: "right", align: "center" }}
        >
          <LogOut className="h-5 w-5" />
          <span className="group-data-[state=collapsed]:hidden">Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
