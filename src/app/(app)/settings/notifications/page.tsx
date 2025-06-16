
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BellRing, Users, Zap, Volume2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

interface NotificationSettingItemProps {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const NotificationSettingItem: React.FC<NotificationSettingItemProps> = ({
  id,
  icon: Icon,
  title,
  description,
  isChecked,
  onCheckedChange,
}) => {
  return (
    <div className="flex items-center justify-between space-x-4 py-4">
      <div className="flex items-start space-x-3">
        <Icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
        <div>
          <Label htmlFor={id} className="text-base font-medium text-foreground">
            {title}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={isChecked}
        onCheckedChange={onCheckedChange}
        aria-label={`Toggle ${title} notifications`}
      />
    </div>
  );
};

export default function NotificationSettingsPage() {
  const router = useRouter();

  // Placeholder states for notification settings
  // In a real app, these would be fetched from and saved to user preferences
  const [eventNotifications, setEventNotifications] = useState(true);
  const [socialNotifications, setSocialNotifications] = useState(true);
  const [appUpdates, setAppUpdates] = useState(true);
  const [promotionalNotifications, setPromotionalNotifications] = useState(false);
  const [soundNotifications, setSoundNotifications] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-4 py-3 bg-background/80 backdrop-blur-md border-b w-full">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-foreground hover:bg-muted/20 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-headline font-semibold text-foreground">Notification Settings</h1>
        <div className="w-9 h-9"></div> {/* Spacer */}
      </header>

      <main className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-muted-foreground mb-6 text-sm">
            Manage how you receive notifications from UPJ Event Hub. These settings allow you to customize your experience.
          </p>

          <NotificationSettingItem
            id="event-notifications"
            icon={BellRing}
            title="Event Notifications"
            description="Receive alerts for ticket confirmations, event reminders, and updates about events you're attending or have saved."
            isChecked={eventNotifications}
            onCheckedChange={setEventNotifications}
          />
          <Separator />
          <NotificationSettingItem
            id="social-notifications"
            icon={Users}
            title="Social Activity"
            description="Get notified about new followers, mentions, or other social interactions (if applicable)."
            isChecked={socialNotifications}
            onCheckedChange={setSocialNotifications}
          />
          <Separator />
          <NotificationSettingItem
            id="app-updates"
            icon={Info}
            title="App Updates & Announcements"
            description="Stay informed about new features, important announcements, and service updates."
            isChecked={appUpdates}
            onCheckedChange={setAppUpdates}
          />
          <Separator />
           <NotificationSettingItem
            id="promotional-notifications"
            icon={Zap}
            title="Promotions & Recommendations"
            description="Receive curated event recommendations and special offers based on your interests."
            isChecked={promotionalNotifications}
            onCheckedChange={setPromotionalNotifications}
          />
          <Separator />
          <NotificationSettingItem
            id="sound-notifications"
            icon={Volume2}
            title="Notification Sounds"
            description="Enable or disable sounds for incoming notifications."
            isChecked={soundNotifications}
            onCheckedChange={setSoundNotifications}
          />
        </div>
        
        <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => router.push('/notifications')}>
                Back to Notifications
            </Button>
        </div>
      </main>
    </motion.div>
  );
}
