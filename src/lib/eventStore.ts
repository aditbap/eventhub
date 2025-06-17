
import type { Event } from '@/types';
// Firestore direct interaction will now happen in page components or dedicated service functions.
// eventStore will primarily manage client-side state like bookmarks for events loaded from Firestore.

let eventsData: Event[] = []; // This will be populated from Firestore by pages
const subscribers: Set<() => void> = new Set();

const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

export const eventStore = {
  // Method for pages to set events after fetching from Firestore.
  // This allows eventStore to be aware of events and manage their bookmark state.
  setEvents: (newEvents: Event[]): void => {
    // When new events are set (e.g., from Firestore),
    // try to preserve existing bookmark statuses for events that were already in the store.
    const bookmarkedEventIds = new Set<string>();
    eventsData.forEach(event => {
      if (event.isBookmarked) {
        bookmarkedEventIds.add(event.id);
      }
    });

    eventsData = newEvents.map(event => ({
      ...event,
      isBookmarked: bookmarkedEventIds.has(event.id) || event.isBookmarked || false,
    }));
    notifySubscribers();
  },

  getEvents: (): Event[] => {
    // Returns events currently in the store.
    // Sorting by date descending is now handled by the components after fetching or from Firestore query.
    return [...eventsData];
  },

  getEventById: (id: string): Event | undefined => {
    // This can still be used for quick local lookup if needed,
    // but detail pages should prefer fetching fresh data from Firestore.
    return eventsData.find(event => event.id === id);
  },

  toggleEventBookmark: (eventId: string): void => {
    let eventFound = false;
    eventsData = eventsData.map(event => {
      if (event.id === eventId) {
        eventFound = true;
        return { ...event, isBookmarked: !event.isBookmarked };
      }
      return event;
    });
    if (!eventFound) {
      // This might happen if events are not yet loaded into the store when a bookmark is toggled.
      // Consider fetching event and adding to store if not found, or ensuring store is populated first.
      console.warn(`EventStore: toggleEventBookmark called for eventId '${eventId}' not found in local store.`);
    }
    notifySubscribers();
  },

  subscribe: (callback: () => void): (() => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  // addEvent is removed from here. Event creation now directly interacts with Firestore.
};
