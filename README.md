# Dynamap

A dynamic, interactive map application built with Next.js and Leaflet that allows users to create and manage locations and regions on a custom map with rich text editing capabilities. Perfect for world-building, fantasy maps, or any interactive mapping project.

## Features

### Core Functionality
- **Interactive Map Interface**: Built with Leaflet and react-leaflet for smooth, responsive map interactions
- **Custom Map Background**: Support for custom map images (currently configured for 2000x2000px maps)
- **Location Management**: Create, edit, and delete point locations with custom icons and colors
- **Region Management**: Create, edit, and delete polygon regions with custom styling and labels
- **Rich Text Editing**: Full-featured text editor using TipTap for location and region descriptions
- **Custom Fields**: Add unlimited key-value pairs to both locations and regions for additional metadata
- **Type System**: Categorize locations and regions with predefined types (Cities, Kingdoms, Forests, etc.)

### Advanced Features
- **Dynamic Font Sizing**: Region labels automatically scale based on polygon area
- **Mention System**: Link locations and regions within descriptions using @mentions
- **Prominence System**: Visibility-based system for map elements with prominence levels
- **Context Menu**: Right-click context menus for quick actions on map elements
- **Move Mode**: Drag-and-drop functionality for relocating locations
- **Polygon Drawing**: Interactive drawing mode for creating custom regions
- **Toast Notifications**: User feedback for element visibility and actions
- **Scale Bar**: Visual scale indicator on the map
- **Smooth Zoom**: Enhanced zoom experience with smooth wheel zoom
- **Icon Gallery**: Extensive collection of themed icons (castles, dungeons, landmarks, etc.)

### UI/UX Features
- **Responsive Design**: Modern UI with Tailwind CSS and SASS
- **Tab-based Dialogs**: Organized editing interface with Content, Styling, and Fields tabs
- **Color-aware Backgrounds**: Icon galleries adapt to color brightness
- **Keyboard Shortcuts**: Escape key to close dialogs, intuitive navigation
- **Form Validation**: Proper validation for all user inputs

## Tech Stack

- **Framework**: Next.js 15.3.3 with React 19
- **Map Library**: Leaflet 1.9.4 with react-leaflet 5.0.0
- **Rich Text Editor**: TipTap 2.13.0 with multiple extensions
- **Styling**: Tailwind CSS 4 with SASS
- **Icons**: React Icons 5.5.0 and Lucide React 0.513.0
- **Type Safety**: TypeScript 5
- **UI Components**: Custom components with Floating UI for tooltips
- **Notifications**: React Toastify for user feedback

## Project Structure

```
dynamap/
├── public/                    # Static files and data
│   ├── locations.json        # Location data storage
│   ├── regions.json          # Region data storage
│   ├── types.json            # Type definitions
│   └── media/                # Map images and assets
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes for CRUD operations
│   │   │   ├── locations/   # Location API endpoints
│   │   │   └── regions/     # Region API endpoints
│   │   ├── components/      # React components
│   │   │   ├── dialogs/     # Modal dialog components
│   │   │   ├── editor/      # Rich text editor components
│   │   │   ├── map/         # Map-related components
│   │   │   ├── markers/     # Map marker components
│   │   │   ├── panels/      # Side panel components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── utils/           # App-specific utilities
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page component
│   ├── css/                 # Global styles and component CSS
│   ├── hooks/               # Custom React hooks
│   │   ├── elements/        # Hooks for managing locations and regions
│   │   ├── dialogs/         # Dialog management hooks
│   │   ├── ui/              # UI interaction hooks
│   │   └── view/            # Map view and zoom hooks
│   ├── types/               # TypeScript type definitions
│   │   ├── elements.ts      # Core element interfaces
│   │   ├── locations.ts     # Location-specific types
│   │   ├── regions.ts       # Region-specific types
│   │   ├── dialogs.ts       # Dialog state types
│   │   └── editor/          # Rich text editor types
│   ├── constants/           # Application constants
│   │   └── map.ts           # Map configuration
│   ├── utils/               # Shared utilities
│   └── scripts/             # Utility scripts
│       └── migrate-locations.ts  # Data migration script
├── package.json             # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── next.config.ts          # Next.js configuration
└── README.md               # This file
```

## Data Structure

### Map Elements
All map elements (locations and regions) extend the `MapElement` interface:

```typescript
interface MapElement {
  id: string;
  name?: string;
  label?: string;
  showLabel?: boolean;
  description?: string;
  image?: string;
  color: string;
  prominence: number;
  icon: ElementIcon;
  type: string;
  position: [number, number] | [number, number][];
  fields: { [key: string]: string };
}
```

### Locations
- Single point positions `[number, number]`
- Custom icons from extensive icon gallery
- Rich text descriptions with mentions
- Custom fields for metadata

### Regions
- Polygon positions `[number, number][]`
- Custom styling (fill color, border, opacity)
- Dynamic label sizing based on area
- Rich text descriptions with mentions
- Custom fields for metadata

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dynamap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate-locations` - Run location data migration

## Usage

### Creating Elements

1. **Add a Location**: Right-click on the map and select "Add Location"
2. **Add a Region**: Right-click on the map and select "Add Region" to start drawing
3. **Edit Elements**: Right-click on any element and select "Edit"

### Rich Text Editor

The rich text editor supports:
- **Text Formatting**: Bold, italic, underline, headings
- **Text Alignment**: Left, center, right alignment
- **Font Styling**: Font family, size, color, highlighting
- **Mentions**: Use @ to mention other locations or regions
- **Links**: Add clickable links
- **Images**: Insert images into descriptions

### Custom Fields

Add custom metadata to any element:
1. Open the element's edit dialog
2. Navigate to the "Fields" tab
3. Add key-value pairs for additional information

### Map Navigation

- **Pan**: Click and drag to move the map
- **Zoom**: Use mouse wheel or zoom controls
- **Fit to Elements**: Use the fit zoom functionality
- **Context Menu**: Right-click for quick actions

## Development Guidelines

### Adding New Features

#### Map Elements
1. **Types**: Add new types in `src/types/elements.ts`
2. **Hooks**: Create corresponding hooks in `src/hooks/elements/`
3. **Components**: Implement dialog and panel components
4. **API**: Add API routes in `src/app/api/`
5. **Prominence**: Consider visibility levels for new elements

#### Icons
1. **Add Icons**: Import new icons in `src/types/elements.ts`
2. **Update Gallery**: Add to `ELEMENT_ICONS` constant
3. **Color Awareness**: Ensure icons work with color-aware backgrounds

#### Styling
1. **Component CSS**: Add styles in `src/css/`
2. **Tailwind**: Use utility classes for common styling
3. **BEM**: Follow BEM naming conventions for component styles

### Best Practices

#### Type Safety
- Always use TypeScript types
- Extend existing interfaces when adding features
- Keep types organized in `src/types/`

#### Component Structure
- Single responsibility principle
- Use custom hooks for data management
- Follow existing patterns for dialogs and panels

#### State Management
- Use React hooks for local state
- Custom hooks for shared logic
- Keep API calls in dedicated hooks

#### Performance
- Debounce zoom updates to prevent excessive re-renders
- Use dynamic imports for heavy components
- Optimize map element rendering

## Data Storage

The application uses JSON files for data persistence:
- `public/locations.json` - Location data
- `public/regions.json` - Region data
- `public/types.json` - Type definitions

### Migration Scripts

Use the migration script to update data structure:
```bash
npm run migrate-locations
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow coding standards**:
   - Use TypeScript for all new code
   - Follow existing component patterns
   - Add appropriate types and documentation
4. **Test thoroughly**:
   - Test on different screen sizes
   - Verify all CRUD operations
   - Check rich text editor functionality
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

## License

Private - All rights reserved

## Support

For questions or issues, please check the existing issues or create a new one in the repository.
