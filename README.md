# Dynamap

A dynamic, interactive map application built with Next.js and Leaflet that allows users to create and manage locations and regions on a map with rich text editing capabilities.

## Features

- Interactive map interface using Leaflet
- Create and manage locations with custom icons and colors
- Create and manage regions (polygons) with custom styling
- Rich text editing for location and region descriptions
- Custom fields support for both locations and regions
- Dynamic font sizing for region labels based on area
- Location and region type management
- Mention system for linking locations and regions in descriptions
- Responsive design with modern UI components
- Prominence-based visibility system for map elements
- Context menu system for quick actions
- Move mode for relocating locations
- Polygon drawing mode for creating regions
- Toast notifications for element visibility
- Scale bar and prominence level indicators
- Dynamic icon gallery with color-aware background
- Custom type management with dynamic type creation

## Tech Stack

- **Framework**: Next.js 14.x with React 18
- **Map Library**: Leaflet with react-leaflet
- **Rich Text Editor**: TipTap
- **Styling**: Tailwind CSS with SASS
- **Icons**: React Icons
- **Type Safety**: TypeScript

## Project Structure

```
.
├── public/                # Static files
├── src/                   # Source code
│   ├── app/              # Next.js app directory
│   │   ├── api/         # API routes
│   │   ├── components/  # React components
│   │   │   ├── dialogs/    # Dialog components
│   │   │   ├── editor/     # Rich text editor components
│   │   │   ├── map/        # Map-related components
│   │   │   ├── panels/     # Panel components
│   │   │   └── ui/         # Reusable UI components
│   │   ├── utils/       # App-specific utilities
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Main page
│   ├── css/             # Global styles and component CSS
│   ├── hooks/           # Custom React hooks
│   │   └── elements/    # Hooks for managing locations and regions
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # Application constants
│   ├── styles/          # Global styles
│   └── utils/           # Shared utilities
├── package.json         # Project dependencies and scripts
├── package-lock.json    # Locked dependencies
├── tsconfig.json       # TypeScript configuration
├── postcss.config.mjs  # PostCSS configuration
├── next.config.ts      # Next.js configuration
└── next-env.d.ts       # Next.js type declarations

```

## Key Components

### Map Elements

- **Locations**: Points on the map with custom icons, colors, and descriptions
- **Regions**: Polygons on the map with custom styling, labels, and descriptions
- Both support custom fields for additional metadata

### Rich Text Editor

- Built with TipTap
- Supports mentions, text formatting, and custom styling
- Used in both location and region descriptions
- Special handling for region labels with dynamic font sizing

### Fields

- Add custom key-value pairs to both locations and regions
- Managed through dedicated tabs in the dialogs
- Displayed in a table format in the panels
- Stored as part of the element data

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Guidelines

### Adding New Features

1. **Map Elements**:
   - Add new types in `src/types/elements.ts`
   - Create corresponding hooks in `src/hooks/elements/`
   - Implement dialog and panel components in `src/app/components/`
   - Consider prominence levels for visibility
   - Implement context menu actions in `useContextMenu` hook

2. **Fields**:
   - Elements extend the `MapElement` interface
   - Custom fields are stored in the `fields` property
   - Use the existing dialog and panel patterns for consistency
   - Follow the tab-based dialog structure

3. **Styling**:
   - Component-specific styles are in `src/css/`
   - Follow the existing naming conventions
   - Use Tailwind for utility classes
   - Consider color brightness for icon galleries

4. **Dialog Components**:
   - Follow the tab-based structure (Content, Styling, Fields)
   - Implement proper form validation
   - Handle keyboard events (Escape to close)
   - Use the existing dialog patterns for consistency

5. **Toast Notifications**:
   - Use the toast system for user feedback
   - Implement prominence-based notifications
   - Follow existing patterns in `src/app/utils/toast.ts`

### Key Files

- `src/types/elements.ts`: Core type definitions
- `src/hooks/elements/useLocations.ts` & `useRegions.ts`: Data management
- `src/app/components/dialogs/`: Dialog components for editing
- `src/app/components/panels/`: Panel components for viewing
- `src/app/components/editor/RichTextEditor.tsx`: Rich text editing

### Best Practices

1. **Type Safety**:
   - Always use TypeScript types
   - Extend existing interfaces when adding features
   - Keep types in the `src/types/` directory

2. **Component Structure**:
   - Keep components focused and single-responsibility
   - Use custom hooks for data management
   - Follow the existing patterns for dialogs and panels

3. **Styling**:
   - Use component-specific CSS files
   - Follow BEM naming conventions
   - Leverage Tailwind for utility classes

4. **State Management**:
   - Use React hooks for local state
   - Custom hooks for shared logic
   - Keep API calls in hooks

## Contributing

1. Create a new branch for your feature
2. Follow the existing code style and patterns
3. Add appropriate types and documentation
4. Test your changes thoroughly
5. Submit a pull request

## License

Private - All rights reserved
