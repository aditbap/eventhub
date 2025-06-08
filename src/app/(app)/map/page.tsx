
'use client';

import { Wrench } from 'lucide-react'; // Using a different icon for variety

export default function MapPage() {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center bg-background p-8 text-center">
      <Wrench className="h-20 w-20 text-primary/50 mb-6" strokeWidth={1.5} />
      <h1 className="text-2xl font-headline font-semibold text-foreground mb-2">
        Map Feature Under Development
      </h1>
      <p className="text-muted-foreground max-w-md">
        We are working hard to bring you an interactive map experience. Please check back later!
      </p>
    </div>
  );
}
