# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based PDF document parser application built for processing transport documents and extracting structured data. It's deployed through Lovable.dev and uses a modern React/TypeScript stack with Vite as the build tool.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Build Tool**: Vite with React SWC plugin
- **Framework**: React 18 with TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom theming

### Project Structure
- `/src/App.tsx` - Main application wrapper with routing and providers
- `/src/pages/` - Route components (Index.tsx handles main PDF parsing view)
- `/src/components/` - Reusable components (PDFUploader, ParsedResults)
- `/src/components/ui/` - shadcn/ui components
- `/src/utils/documentParser.ts` - Core PDF parsing logic for transport documents
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions and configurations

### Key Features
1. **PDF Upload**: PDFUploader component handles file uploads with geolocation support
2. **Document Parsing**: DocumentParser class extracts structured data from transport documents (items, quantities, specifications)
3. **Telegram Web App Ready**: Styled for Telegram Web App integration

### Path Aliasing
The project uses `@/` as an alias for the `src/` directory. Use this in imports:
```typescript
import { Component } from '@/components/Component'
```

## Component Conventions

When creating new components:
1. Follow existing patterns in `/src/components/`
2. Use shadcn/ui components from `/src/components/ui/` when available
3. Apply Tailwind classes using the custom utility classes defined in the theme
4. Use React Hook Form for form handling with Zod schemas for validation

## Deployment

The project is connected to Lovable.dev (Project URL: https://lovable.dev/projects/19647b35-a28f-40ba-9f72-18415b3140de). Changes pushed to the Git repository are automatically reflected in Lovable.