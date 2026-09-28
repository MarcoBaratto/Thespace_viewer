# Plan: The Space Cinema Cerro Maggiore Custom Interface

## 1. Goal
Create a better, at-a-glance interface for The Space Cinema (Cerro Maggiore location) to quickly see current and next movies, highlighting the "sala" (screen) and "lingua originale" (original language) options.

## 2. Technical Stack
- **Framework**: React / Next.js
- **Styling**: Tailwind CSS (for quick, clean dashboard styling)
- **Data Source**: The Space Cinema internal API for Cerro Maggiore (Cinema ID: `1016`)

## 3. Data Fetching Strategy
Through network inspection, we found the undocumented API endpoint used by the website:
`GET https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?showingDate={YYYY-MM-DD}&minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true`

This endpoint returns structured JSON containing:
- Movie titles and details
- Sessions (showtimes)
- Screen information (`sala`)
- Session attributes (e.g., `versione-originale`)

We will create a Next.js API route to act as a proxy to fetch this data to avoid any potential CORS issues and keep the frontend clean.

## 4. UI/UX Design
The interface will be a clean, modern web application featuring:
- **Date Selector**: A sticky top bar to easily switch between today, tomorrow, and upcoming days.
- **Dual View Modes** (Toggleable):
  1. **By Movie (Default)**: Grid of movie posters/titles. Expanding a movie shows all its showtimes for the day, clearly labeled with the time, *Sala* number, and *Lingua Originale* badges.
  2. **By Time**: A chronological timeline of all upcoming showings for the day across all movies, perfect for the "I want to go to the cinema right now, what's playing?" use case.
- **Visual Badges**: High-contrast badges for important attributes:
  - 🟢 **Lingua Originale** (Original Language)
  - 🔵 **Sala #** (Screen number)
  - 🟡 **3D / Special Formats**

## 5. Implementation Steps
1. **Initialize Project**: Create a new Next.js project with Tailwind CSS.
2. **API Proxy**: Build a Next.js API route (`/api/schedule`) that fetches and formats the data from The Space Cinema API.
3. **Components**:
   - `MovieCard`: Displays movie info and its sessions.
   - `TimeSlot`: Displays a single session in the chronological view.
   - `Badge`: Reusable UI for "Sala" and "Lingua Originale".
   - `ViewToggle`: Switch between "By Movie" and "By Time" views.
4. **State Management**: Manage selected date and view mode.
5. **Testing & Refinement**: Run locally, ensure the UI is responsive and the data parsing correctly identifies the "sala" and language attributes.
