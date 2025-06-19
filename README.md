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

### Map Settings & Customization
- **General Settings Panel**: Comprehensive settings interface accessible via the settings button
- **Map Image Controls**: 
  - Upload custom map images via file upload
  - Set map images from URLs
  - Choose from image gallery
  - Adjust map image roundness (0-100%)
  - Configure map scale (km per pixel)
  - Size options: Cover, Contain, Auto, or Custom dimensions
  - Position control: 9-directional positioning
  - Aspect ratio locking for custom dimensions
- **Background Image Settings**:
  - Upload custom background images
  - Set background images from URLs
  - Choose from image gallery
  - Background images always cover the viewport
- **Map Name System**:
  - Rich text map name editor with full formatting options
  - Show/hide toggle for map name visibility
  - Position options: Center (with fade on zoom), corners
  - Smooth fade animation on zoom level changes
- **Edit Mode Toggle**: 
  - Enable/disable editing capabilities
  - When disabled, context menus are completely disabled
  - Perfect for presentation mode or view-only access
  - Persistent setting across sessions

### Advanced Features
- **Dynamic Font Sizing**: Region labels automatically scale based on polygon area
- **Mention System**: Link locations and regions within descriptions using @mentions
- **Prominence System**: Advanced visibility-based system with prominence ranges (lower/upper bounds)
- **Context Menu**: Right-click context menus for quick actions on map elements
- **Move Mode**: Drag-and-drop functionality for relocating locations
- **Polygon Drawing**: Interactive drawing mode for creating custom regions
- **Toast Notifications**: User feedback for element visibility and actions
- **Scale Bar**: Visual scale indicator on the map
- **Smooth Zoom**: Enhanced zoom experience with smooth wheel zoom
- **Icon Gallery**: Extensive collection of themed icons (castles, dungeons, landmarks, etc.)

### Timeline System
- **Interactive Timeline Navigation**: Comprehensive timeline system for managing map states across different years
- **Timeline Slider**: Compact, minimalistic timeline interface with smooth navigation controls
- **Year-based Navigation**: Navigate between specific years with precise year selection
- **Entry-based System**: Efficient change-based timeline storing only changes per snapshot
- **Epoch Management**: Create and manage time periods (epochs) with custom names, date ranges, and styling
- **Epoch Features**:
  - Custom epoch names and descriptions
  - Year prefix and suffix options
  - Restart at zero functionality for relative year counting
  - Show/hide end date option
  - Color-coded epoch display
  - Rich text descriptions with formatting
- **Note System**: Add contextual notes to specific years with rich text editing
- **Note Features**:
  - Multiple notes per year
  - Rich text descriptions with full formatting
  - Notification-style floating widgets
  - Individual close buttons for each note
  - Smooth slide-in animations from the right
- **Timeline Controls**:
  - Previous/Next year navigation
  - Previous/Next entry navigation
  - Direct year input and selection
  - Play/Pause timeline functionality
  - Entry-based navigation for quick jumps
- **Context Menu Integration**: Right-click support for timeline elements
  - Right-click notes to edit them
  - Right-click epoch banners to edit epochs
  - Context menus appear above timeline elements
- **Edit Mode Integration**: Timeline editing features only available when edit mode is enabled
  - Add new notes and epochs
  - Edit existing timeline elements
  - Context menu functionality
- **Zoom-based Visibility**: Timeline and settings buttons can be configured to show/hide based on zoom level
  - "Show timeline when zoomed" setting
  - "Show settings when zoomed" setting
  - Maintains UI cleanliness at different zoom levels
- **Timeline Data Management**:
  - Efficient storage using change-based system
  - Automatic data migration from legacy systems
  - Structured timeline entries with notes and epochs
  - API endpoints for timeline CRUD operations
- **Timeline UI Components**:
  - TimelineIcon: Floating timeline button with consistent styling
  - TimelineSlider: Main timeline interface with navigation controls
  - TimelineNotes: Notification-style note display
  - NoteDialog: Rich text editor for creating/editing notes
  - NotePanel: Full-screen note viewing interface
  - EpochDialog: Epoch creation and editing interface
  - EpochPanel: Epoch information and note browsing interface
- **Timeline Integration**:
  - Seamless integration with existing map elements
  - Automatic data refresh when navigating timeline
  - Proper z-index management for all timeline components
  - Non-interfering backdrop design for wheel zoom support

### Enhanced UI/UX Features
- **Responsive Design**: Modern UI with Tailwind CSS and SASS
- **Tab-based Dialogs**: Organized editing interface with Content, Styling, and Fields tabs
- **Color-aware Backgrounds**: Icon galleries adapt to color brightness
- **Keyboard Shortcuts**: Escape key to close dialogs, intuitive navigation
- **Form Validation**: Proper validation for all user inputs
- **Panel Navigation**: Stack-based navigation system with back/forward functionality
- **Hierarchical Navigation**: Breadcrumb-style navigation showing regional hierarchy
- **Smart Map Positioning**: Automatic map centering when opening panels
- **Region Animations**: Smooth fade-in animations for regions with customizable duration
- **Settings Persistence**: All map settings are automatically saved and restored
- **Click Outside to Close**: Settings panel closes when clicking outside the panel area

### Label System
- **Advanced Label Positioning**: 9-directional label placement (Center, Left top, Mid top, Right top, Left mid, Right mid, Left bottom, Mid bottom, Right bottom)
- **Label Collision Strategies**: Three strategies for handling overlapping labels:
  - `None`: Show label regardless of overlap (default)
  - `Hide`: Hide this label if it overlaps with another
  - `Conquer`: Show this label and hide the other if they overlap
- **Dynamic Label Scaling**: Labels scale with zoom level for optimal readability
- **Custom Label Offsets**: Adjustable distance between element and label

### Prominence System
- **Prominence Ranges**: Elements now use lower and upper prominence bounds instead of single values
- **Flexible Visibility**: Set minimum and maximum zoom levels for element visibility
- **Real-time Prominence Display**: Current prominence level shown on map
- **Toast Notifications**: Informative messages when elements are outside visibility range

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
│   ├── timeline.json         # Timeline data storage
│   ├── types.json            # Type definitions
│   ├── settings.json         # Map settings and preferences
│   ├── uploads/              # User uploaded images
│   └── media/                # Map images and assets
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes for CRUD operations
│   │   │   ├── locations/   # Location API endpoints
│   │   │   ├── regions/     # Region API endpoints
│   │   │   ├── timeline/    # Timeline API endpoints
│   │   │   ├── settings/    # Settings API endpoint
│   │   │   └── upload/      # Image upload API endpoint
│   │   ├── components/      # React components
│   │   │   ├── dialogs/     # Modal dialog components
│   │   │   ├── editor/      # Rich text editor components
│   │   │   ├── map/         # Map-related components
│   │   │   ├── markers/     # Map marker components
│   │   │   ├── panels/      # Side panel components
│   │   │   ├── timeline/    # Timeline system components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── utils/           # App-specific utilities
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page component
│   ├── css/                 # Global styles and component CSS
│   ├── hooks/               # Custom React hooks
│   │   ├── elements/        # Hooks for managing locations and regions
│   │   ├── timeline/        # Hooks for timeline management
│   │   ├── dialogs/         # Dialog management hooks
│   │   ├── ui/              # UI interaction hooks
│   │   └── view/            # Map view and zoom hooks
│   ├── types/               # TypeScript type definitions
│   │   ├── elements.ts      # Core element interfaces
│   │   ├── locations.ts     # Location-specific types
│   │   ├── regions.ts       # Region-specific types
│   │   ├── timeline.ts      # Timeline system types
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
  labelPosition?: LabelPosition; // New: Advanced label positioning
  description?: string;
  image?: string;
  color: string;
  prominence: ProminenceRange; // Updated: Now uses range instead of single value
  icon: ElementIcon;
  type: string;
  position: [number, number] | [number, number][];
  fields: { [key: string]: string };
  labelCollisionStrategy?: LabelCollisionStrategy; // New: Label collision handling
}

interface ProminenceRange {
  lower: number;       // Minimum prominence level (0-10, 0 = no lower bound)
  upper: number;       // Maximum prominence level (1-10)
}

interface LabelPosition {
  direction: LabelDirection; // 9-directional positioning
  offset: number;      // Offset in coordinate units
}

type LabelCollisionStrategy = 'None' | 'Hide' | 'Conquer';
```

### Coordinate System

Dynamap uses a custom pixel-based coordinate system rather than geographic coordinates:
- The map is based on a 2000x2000 pixel grid
- Scale is defined in kilometers per pixel (configurable in settings)
- Default scale: 2000 km = 115 pixels at base zoom
- All coordinates are stored in pixel values
- Drawing tools (like circles) automatically convert from geographic units to pixel units

### Locations
- Single point positions `[number, number]` in pixel coordinates
- Custom icons from extensive icon gallery
- Rich text descriptions with mentions
- Custom fields for metadata
- Icon size scaling with zoom level

### Regions
- Polygon positions `[number, number][]` in pixel coordinates
- Support for both manual polygon drawing and circle-to-polygon conversion
- Circle drawing automatically converts radius from meters to pixels using map scale
- Custom styling (fill color, border, opacity)
- Dynamic label sizing based on area
- Rich text descriptions with mentions
- Custom fields for metadata
- Area fade-in animations with customizable duration
- Area calculation in square kilometers

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
- **Panel Navigation**: Click elements to open panels, use back button for navigation

### Map Settings & Customization

#### Accessing Settings
- Click the settings button (gear icon) in the bottom-right corner
- The settings panel slides in from the right
- Click outside the panel to close it

#### Map Image Configuration
1. **Change Map Image**: Use Upload, URL, or Gallery options
2. **Adjust Roundness**: Use the slider to set corner roundness (0-100%)
3. **Set Map Scale**: Configure km per pixel for accurate measurements
4. **Size Options**:
   - **Cover**: Fill the entire map area
   - **Contain**: Fit within the map area while maintaining aspect ratio
   - **Auto**: Use original image dimensions
   - **Custom**: Set specific width and height with optional aspect ratio lock
5. **Position Control**: Choose from 9 directional positions

#### Background Image
- Upload or set background images that cover the entire viewport
- Background images are separate from map images
- Use the gallery to quickly switch between backgrounds

#### Map Name
- **Rich Text Editor**: Format your map name with colors, fonts, and styling
- **Visibility Toggle**: Show or hide the map name
- **Position Options**: Center (with fade on zoom) or corner positions
- **Fade Animation**: Smooth fade out when zooming in

#### Edit Mode
- **Toggle Edit Mode**: Enable or disable editing capabilities
- **Presentation Mode**: Disable editing for view-only access
- **Context Menu Control**: When disabled, right-click context menus are disabled
- **Persistent Setting**: Your preference is saved across sessions

### Timeline System

#### Accessing the Timeline
- Click the timeline button (timeline icon) in the bottom-right corner
- The timeline slider appears with current year and epoch information
- Use the navigation controls to move between years

#### Timeline Navigation
- **Year Navigation**: Use the previous/next year buttons to move one year at a time
- **Entry Navigation**: Use the previous/next entry buttons to jump between timeline entries
- **Direct Year Selection**: Click on the year display to enter a specific year
- **Epoch Information**: View current epoch details in the banner at the top

#### Creating Timeline Elements
1. **Add Notes**: Click the "+ Note" button to add a contextual note for the current year
2. **Add Epochs**: Click the "+ Epoch" button to create a new time period
3. **Edit Elements**: Right-click on notes or epoch banners to edit them

#### Epoch Management
- **Epoch Names**: Give your time periods descriptive names
- **Date Ranges**: Set start and end years for each epoch
- **Year Formatting**: Add prefixes and suffixes to year displays
- **Restart at Zero**: Enable relative year counting (Year 1, Year 2, etc.)
- **Show End Date**: Optionally hide the epoch end year
- **Color Coding**: Assign colors to visually distinguish epochs
- **Rich Descriptions**: Add detailed descriptions with full formatting

#### Note System
- **Multiple Notes**: Add several notes to the same year
- **Rich Text Editing**: Use the full rich text editor for note content
- **Notification Display**: Notes appear as floating widgets below the timeline
- **Individual Controls**: Each note has its own close button
- **Smooth Animations**: Notes slide in from the right with staggered timing

#### Timeline Settings
- **Show Timeline When Zoomed**: Control timeline button visibility at different zoom levels
- **Show Settings When Zoomed**: Control settings button visibility at different zoom levels
- **Edit Mode Integration**: Timeline editing features require edit mode to be enabled

#### Context Menu Integration
- **Note Editing**: Right-click on notes to edit them
- **Epoch Editing**: Right-click on epoch banners to edit epochs
- **Proper Layering**: Context menus appear above timeline elements

### Prominence System

- **Set Visibility Ranges**: Configure lower and upper prominence bounds for elements
- **Monitor Current Level**: View current prominence level in the bottom-left corner
- **Automatic Hiding**: Elements automatically show/hide based on zoom level
- **Toast Notifications**: Get informed when elements are outside visibility range

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
- Implement proper cleanup for animations and event listeners

## Data Storage

The application uses JSON files for data persistence:
- `public/locations.json` - Location data
- `public/regions.json` - Region data
- `public/timeline.json` - Timeline data (entries, epochs, notes)
- `public/types.json` - Type definitions
- `public/settings.json` - Map settings and preferences (automatically managed)

### Settings Persistence

The application automatically saves and restores user preferences including:
- Map image settings (image, roundness, scale, size, position)
- Background image settings
- Map name content and display settings
- Edit mode toggle state
- Image gallery (user-uploaded images)

All settings are persisted across browser sessions and automatically loaded when the application starts.

### Migration Scripts

Use the migration script to update data structure:
```bash
npm run migrate-locations
```

## Recent Updates

### v0.2.1+ (Current)
- **Timeline System**: Comprehensive timeline navigation system for managing map states across different years
  - Interactive timeline slider with year-based navigation
  - Epoch management with custom names, date ranges, and styling options
  - Note system with rich text editing and notification-style display
  - Context menu integration for timeline elements
  - Edit mode integration for timeline editing features
  - Zoom-based visibility settings for timeline and settings buttons
  - Efficient change-based timeline storage system
  - Proper z-index management for all timeline components
  - Non-interfering backdrop design supporting wheel zoom
- **Custom Coordinate System**: Implemented pixel-based coordinate system for precise mapping
- **Circle Drawing Improvements**: Enhanced circle-to-polygon conversion with proper scaling
- **Scale Bar Integration**: Added visual scale indicator showing km/pixel ratio
- **Drawing Tool Enhancements**: Better handling of geographic to pixel coordinate conversion
- **Improved Error Handling**: Added defensive checks for GeoJSON conversion in region drawing

### v0.2.0+
- **General Settings Panel**: Comprehensive settings interface with slide-in panel design
- **Map Image Customization**: Full control over map image with upload, URL, and gallery options
- **Dynamic Map Sizing**: Cover, contain, auto, and custom dimension options with aspect ratio locking
- **Background Image System**: Separate background image controls with viewport coverage
- **Rich Text Map Name**: Advanced map name editor with formatting, positioning, and fade animations
- **Edit Mode Toggle**: Enable/disable editing capabilities for presentation and view-only modes
- **Settings Persistence**: Automatic saving and restoration of all user preferences
- **Image Upload System**: Server-side image upload with gallery management
- **Enhanced Error Handling**: Robust error handling for settings API with fallback defaults
- **Click Outside to Close**: Intuitive panel interaction with backdrop click detection

### v0.1.0+ (Previous)
- **Enhanced Prominence System**: Replaced single prominence values with ranges (lower/upper bounds)
- **Advanced Label Positioning**: 9-directional label placement with customizable offsets
- **Label Collision Management**: Three strategies for handling overlapping labels
- **Panel Navigation**: Stack-based navigation with back/forward functionality
- **Hierarchical Navigation**: Breadcrumb-style navigation showing regional relationships
- **Region Animations**: Smooth fade-in animations with customizable duration
- **Smart Map Positioning**: Automatic centering when opening panels
- **Improved Performance**: Debounced zoom updates and optimized rendering
- **Enhanced Type Safety**: More comprehensive TypeScript definitions
- **Better Error Handling**: Improved validation and error recovery

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
