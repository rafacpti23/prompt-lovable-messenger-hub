# AI Development Rules

This document provides guidelines for the AI developer to follow when working on this project. Adhering to these rules ensures consistency, maintainability, and high-quality code.

## Tech Stack

The application is built with a modern, type-safe, and efficient technology stack:

-   **Framework**: React with Vite for a fast development experience.
-   **Language**: TypeScript for type safety and improved developer experience.
-   **UI Components**: A combination of `shadcn/ui` and Radix UI primitives.
-   **Styling**: Tailwind CSS for all utility-first styling.
-   **Backend & Database**: Supabase for authentication, database, storage, and serverless functions.
-   **Data Fetching**: TanStack Query for managing server state, including caching, refetching, and mutations.
-   **Routing**: React Router (`react-router-dom`) for all client-side routing.
-   **Forms**: React Hook Form with Zod for robust and type-safe form handling and validation.
-   **Icons**: `lucide-react` for a consistent and clean set of icons.
-   **Charts**: `recharts` for creating responsive and interactive charts.

## Library Usage Guidelines

To maintain consistency, please follow these rules for using specific libraries:

-   **UI Components**:
    -   **ALWAYS** use components from `shadcn/ui` (`@/components/ui`) when available.
    -   If a required component does not exist in `shadcn/ui`, create a new, reusable component in the `src/components` directory.
    -   Build new components using Radix UI primitives and style them with Tailwind CSS, following the `shadcn/ui` architecture.
    -   **DO NOT** introduce other component libraries like Material-UI, Ant Design, or Chakra UI.

-   **Styling**:
    -   **ONLY** use Tailwind CSS for styling.
    -   Use the `cn` utility function from `@/lib/utils` to conditionally apply or merge Tailwind classes.
    -   Avoid writing custom CSS in `.css` files unless absolutely necessary for global styles or complex animations not achievable with Tailwind.

-   **State Management**:
    -   For server state (data from Supabase), **ALWAYS** use TanStack Query (`useQuery`, `useMutation`).
    -   For local component state, use React's built-in hooks like `useState` and `useReducer`.
    -   Avoid introducing global state managers like Redux or Zustand. If complex global state is needed, discuss it first.

-   **Backend (Supabase)**:
    -   All interactions with Supabase (database, auth, storage, functions) **MUST** use the shared client instance from `@/integrations/supabase/client`.
    -   Create custom hooks in the `src/hooks` directory to encapsulate data-fetching logic (e.g., `useUserProfile`).

-   **Forms**:
    -   Use `react-hook-form` for all forms.
    -   Define validation schemas using `zod` and connect them to your forms with `@hookform/resolvers`.

-   **Routing**:
    -   Manage all application routes within `src/App.tsx` using `<BrowserRouter>`, `<Routes>`, and `<Route>`.
    -   Create new pages as components in the `src/pages` directory.

-   **Icons**:
    -   Exclusively use icons from the `lucide-react` package.

-   **Notifications (Toasts)**:
    -   Use `sonner` for simple, non-blocking notifications. It is configured globally in `App.tsx`.
    -   Use the `toast` function from the `shadcn/ui` `use-toast` hook for notifications that require more complex actions or layouts.

-   **Charts & Data Visualization**:
    -   Use the `recharts` library for all charts and graphs. Ensure they are responsive by wrapping them in `ResponsiveContainer`.