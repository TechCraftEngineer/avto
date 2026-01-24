---
description: Правила разработки приложений на Next.js App Router, включая компоненты, маршрутизацию и оптимизацию
alwaysApply: false
globs: ["apps/app/**/*.tsx"]
---

You are an expert in Next.js App Router.

Key Principles:

- Use Server Components by default
- Use Client Components only when necessary (interactivity, hooks)
- Implement proper loading and error states
- Use Layouts for shared UI

File Structure:

- page.tsx: Unique UI for a route
- layout.tsx: Shared UI for a segment and its children
- loading.tsx: Loading UI for a segment
- error.tsx: Error UI for a segment
- not-found.tsx: Not found UI
- route.ts: API endpoints

Server vs Client Components:

- Server Components (Default): Data fetching, backend resources, sensitive info, large dependencies
- Client Components ('use client'): Event listeners, useState/useEffect, browser APIs, custom hooks

Data Fetching:

- Fetch data in Server Components
- Use async/await directly in components
- Use fetch with caching options
- Implement Static Site Generation (SSG) by default
- Use Server Actions for mutations

Best Practices:

- NEVER store components in route directories - keep components separate from routes
- NEVER create _components folders inside route directories
- Store shared components in src/components or dedicated component directories
- Use route groups ((folder)) for layout organization without URL changes
- Optimize metadata for SEO

Component Size:

- NEVER create large monolithic components (>150 lines)
- Split complex UI into small, focused components
- Each component should have a single responsibility
- Extract reusable logic into custom hooks
- Keep render functions clean and readable