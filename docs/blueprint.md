# **App Name**: UPJ Event Hub

## Core Features:

- Onboarding Screen: Visually rich welcome screen that introduces the UPJ EventHub branding. Smooth transition to login or registration. Clean green-themed background with centered logo and white minimalist icon.
- Location-Based Event Discovery: User’s current location is detected and displayed (e.g., “Bintaro”). Events shown are filtered by location and proximity.
- Search and Category Filters: Search bar enables users to find events by keywords. Filter events by categories: Music, Food, Sports (horizontal scroll with active tab indicator). Each category is color-tagged (e.g., red for Music, green for Food, orange for Sports).
- Event Feed & Recommendations: Section: Upcoming Events Horizontally scrollable cards with event image, date badge, title, location, attendance count, and icons for user interest. Section: Near You Vertical list of events near the user's location with precise date/time and venue info. Bookmark icon to save/unsave events.
- Event Details Page: Tapping an event card navigates to a detailed view. Includes: full event description, schedule, location map, and a “Get Ticket” button.
- Ticket Checkout: Users can “purchase” a ticket (free or paid), which is recorded in Firestore under their user ID. Optionally show a confirmation message/modal post-purchase.
- User Registration & Login: Firebase Auth email/password login and registration. Registration includes: Name, Email, and Password. Login page with validation and error messages for invalid credentials.
- User Profile Page ("Profile" Tab): Section: My Tickets Shows a list of tickets the user has claimed. Each item includes event name, date, and QR code (optional). Includes logout functionality using Firebase Auth.
- Bottom Navigation Bar: Tabs: Explore (Home feed) Events (All events or categories) Create (for admin or verified users to add events) Map (view events on map) Profile (user info and tickets)
- Persistent Authentication: Automatically keeps users logged in after app restarts using Firebase Auth state persistence.

## Style Guidelines:

- Primary Color: Emerald Green #007E33 Reflects freshness, community, and connection.
- Category Accent Colors: Music: Coral Red #F97068
- Category Accent Colors: Food: Grass Green #4CAF50
- Category Accent Colors: Sports: Amber Orange #FFA000
- Background Color: White #FFFFFF
- Headline Font: 'Poppins' – clean, modern sans-serif for titles
- Body Font: 'Roboto' – highly readable and consistent for app body content
- Icons: Minimalist, rounded, modern icons reflecting a vibrant youth-focused design
- Splash Screen: Centered white logo on full emerald green background. No distractions; sets a professional tone.
- Navigation Style: Bottom navigation tab with clear active/inactive icons.
- Responsiveness: Designed for iOS and Android screen sizes. All components adapt seamlessly.