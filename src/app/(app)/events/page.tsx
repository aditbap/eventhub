'use client';

// This is a placeholder for the "All Events" page.
// It could be similar to the Explore page but with different default filters or layout.
// For now, it will just show a message.

import { CalendarDays } from 'lucide-react';

export default function EventsPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <CalendarDays className="h-16 w-16 mx-auto text-primary mb-4" />
      <h1 className="text-3xl font-headline font-bold mb-4">All Events</h1>
      <p className="text-muted-foreground">
        This section will display all available events.
        <br />
        You can browse by category, date, or search for specific events.
      </p>
      <p className="mt-4 text-sm">
        (Content for this page is under development)
      </p>
    </div>
  );
}
