# Dynamap

A dynamic, interactive map application built with Next.js and Leaflet that allows users to create and manage locations and regions on a custom map with rich text editing capabilities and a comprehensive timeline system. Perfect for world-building, fantasy maps, historical mapping, or any interactive mapping project.

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
- **Zoom-based UI Controls**: Timeline and settings buttons can be configured to show/hide based on zoom level
  - "Show timeline when zoomed" setting
  - "Show settings when zoomed" setting
  - Maintains UI cleanliness at different zoom levels

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
- **Change-based Storage**: Efficient progressive change storage system that only stores differences between years
- **Element Creation Tracking**: Each element tracks its creation year and only stores changes for future years
- **Timeline Context**: Unified timeline state management across all components
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
- **Timeline Data Management**:
  - Efficient storage using change-based system
  - Automatic data migration from legacy systems
  - Structured timeline entries with notes and epochs
  - RESTful API endpoints for timeline CRUD operations
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
  - Real-time timeline updates after element modifications

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
│   │   │   ├── locations/   # Location API endpoints (RESTful)
│   │   │   │   ├── route.ts # GET (all), POST (create)
│   │   │   │   └── [id]/    # GET, PUT, DELETE by ID
│   │   │   ├── regions/     # Region API endpoints (RESTful)
│   │   │   │   ├── route.ts # GET (all), POST (create)
│   │   │   │   └── [id]/    # GET, PUT, DELETE by ID
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
│   ├── contexts/            # React contexts
│   │   └── TimelineContext.tsx # Unified timeline state management
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
│   │   ├── timeline-changes.ts # Timeline change tracking and reconstruction
│   │   ├── draw.ts          # Polygon drawing utilities
│   │   └── image-bounds.ts  # Image bounds calculation utilities
│   └── scripts/             # Utility scripts
│       └── migrate-locations.ts  # Data migration script
```

## Recent Improvements

### Timeline System Enhancements
- **Progressive Change Storage**: Implemented efficient change-based timeline system that only stores differences between years
- **Element Creation Tracking**: Each element now tracks its creation year and only stores changes for future years
- **Timeline Context**: Created unified timeline state management to prevent multiple timeline instances
- **Real-time Updates**: Timeline data automatically refreshes after element modifications
- **RESTful API Structure**: Updated all API endpoints to follow proper REST conventions

### API Improvements
- **RESTful Endpoints**: Migrated from body-based to path-based API design
  - `GET /api/locations` - Fetch all locations
  - `POST /api/locations` - Create new location
  - `GET /api/locations/[id]` - Fetch specific location
  - `PUT /api/locations/[id]` - Update specific location
  - `DELETE /api/locations/[id]` - Delete specific location
- **Consistent Error Handling**: Improved error responses and validation
- **Proper HTTP Methods**: All endpoints now use appropriate HTTP methods

### Performance Optimizations
- **Efficient Change Tracking**: Only stores actual changes instead of full snapshots
- **Smart Reconstruction**: Reconstructs element state for any year using base data + changes
- **Reduced Storage**: Significantly reduced timeline data size
- **Faster Navigation**: Quick timeline navigation with minimal data transfer

### User Experience Improvements
- **Immediate Feedback**: Changes appear instantly without requiring page refresh
- **Smooth Navigation**: Seamless timeline navigation with proper state management
- **Context Menus**: Right-click support for timeline elements (notes, epochs)
- **Edit Mode Integration**: Timeline editing features respect global edit mode setting
- **Zoom-based UI**: Timeline and settings buttons can be hidden at certain zoom levels

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Basic Map Operations
- **Create Locations**: Click on the map in edit mode to add new locations
- **Create Regions**: Use the polygon drawing tool to create custom regions
- **Edit Elements**: Right-click on elements to open the editing interface
- **Timeline Navigation**: Use the timeline slider to navigate between different years

### Timeline Features
- **Add Notes**: Click the "+ Note" button in the timeline to add contextual notes
- **Create Epochs**: Use the "+ Epoch" button to define time periods
- **Edit Timeline Elements**: Right-click on notes or epoch banners to edit them
- **Navigate Years**: Use the timeline controls to jump between specific years

### Advanced Features
- **Custom Fields**: Add unlimited key-value pairs to elements
- **Rich Text Editing**: Use the full-featured editor for descriptions
- **Type System**: Categorize elements with predefined types
- **Prominence System**: Control element visibility based on zoom level

## Contributing

This project is actively maintained and welcomes contributions. Please feel free to submit issues, feature requests, or pull requests.
