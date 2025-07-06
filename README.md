# Dynamap

A dynamic, interactive map application built with Next.js and Leaflet that allows users to create and manage locations and regions on a custom map with rich text editing capabilities and a comprehensive timeline system. Perfect for world-building, fantasy maps, historical mapping, or any interactive mapping project.

## 🚀 Features

### Core Functionality
- **Interactive Map Interface**: Built with Leaflet and react-leaflet for smooth, responsive map interactions
- **Custom Map Background**: Support for custom map images with flexible sizing and positioning options
- **Location Management**: Create, edit, and delete point locations with custom icons and colors
- **Region Management**: Create, edit, and delete polygon regions with custom styling and labels
- **Rich Text Editing**: Full-featured text editor using TipTap for location and region descriptions
- **Custom Fields**: Add unlimited key-value pairs to both locations and regions for additional metadata
- **Type System**: Categorize locations and regions with free-form types (Cities, Kingdoms, Forests, etc.)

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
- **Search Functionality**: Full-text search across locations and regions with relevance scoring

### Timeline System
- **Interactive Timeline Navigation**: Comprehensive timeline system for managing map states across different years
- **Timeline Slider**: Compact, minimalistic timeline interface with smooth navigation controls
- **Year-based Navigation**: Navigate between specific years with precise year selection
- **Change-based Storage**: Efficient progressive change storage system that only stores differences between years
- **Epoch Management**: Create and manage time periods with custom names, colors, and date ranges
- **Timeline Notes**: Add contextual notes to specific years with rich text editing
- **Progressive Changes**: Track how locations and regions evolve over time
- **Creation Year Tracking**: Elements are only visible after their creation year

### Label System
- **Label Collision Strategies**: Three strategies for handling overlapping labels:
  - `None`: Show label regardless of overlap (default)
  - `Hide`: Hide this label if it overlaps with another
  - `Conquer`: Show this label and hide the other if they overlap
- **Dynamic Label Scaling**: Labels scale with zoom level for optimal readability
- **Custom Label Offsets**: Adjustable distance between element and label

### Prominence System
- **Prominence Ranges**: Elements use lower and upper prominence bounds instead of single values
- **Flexible Visibility**: Set minimum and maximum zoom levels for element visibility
- **Real-time Prominence Display**: Current prominence level shown on map
- **Toast Notifications**: Informative messages when elements are outside visibility range

## 🛠 Tech Stack

- **Framework**: Next.js 15.3.3 with React 19
- **Map Library**: Leaflet 1.9.4 with react-leaflet 5.0.0
- **Rich Text Editor**: TipTap 2.13.0 with multiple extensions
- **Styling**: Tailwind CSS 4 with SASS
- **Icons**: React Icons 5.5.0 and Lucide React 0.513.0
- **Type Safety**: TypeScript 5
- **API**: tRPC 11.4.3 for type-safe API communication
- **Database**: PostgreSQL with pg driver
- **State Management**: Zustand for UI state, React Query for server state
- **UI Components**: Custom components with Floating UI for tooltips
- **Notifications**: React Toastify for user feedback

## 📁 Project Structure

```
dynamap/
├── public/                    # Static files and data
│   ├── uploads/              # User uploaded images
│   └── media/                # Map images and assets
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/             # API routes
│   │   │   └── trpc/        # tRPC API endpoints
│   │   │       └── [trpc]/  # tRPC handler
│   │   ├── components/      # React components
│   │   │   ├── dialogs/     # Modal dialogs
│   │   │   ├── map/         # Map-related components
│   │   │   ├── markers/     # Location and region markers
│   │   │   ├── panels/      # Side panels
│   │   │   ├── timeline/    # Timeline components
│   │   │   └── ui/          # UI components
│   │   ├── contexts/        # React contexts
│   │   ├── providers/       # App providers
│   │   └── utils/           # Utility functions
│   ├── css/                 # Stylesheets
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Database and tRPC setup
│   ├── stores/              # Zustand stores
│   └── types/               # TypeScript type definitions
├── scripts/                 # Database setup and migration scripts
└── @types/                  # Custom type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
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

3. **Set up PostgreSQL database**
   ```bash
   # Create the database
   createdb -U postgres dynamap
   
   # Set up database schema
   npm run setup-db
   ```

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=dynamap
   DB_PASSWORD=your_password
   DB_PORT=5432
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup-db` - Set up PostgreSQL database schema
- `npm run migrate` - Run database migrations

## 🗄 Database Schema

The application uses PostgreSQL with the following main tables:

- **locations** - Point locations on the map
- **regions** - Polygon regions on the map  
- **timeline_entries** - Timeline entries for each year
- **timeline_changes** - Progressive changes between years
- **epochs** - Time periods/eras
- **notes** - Timeline notes
- **settings** - Application settings

## 🎯 Usage

### Creating Map Elements

1. **Enable Edit Mode**: Click the settings button and ensure "Edit Mode" is enabled
2. **Add Locations**: Right-click on the map and select "Add Location"
3. **Add Regions**: Use the polygon drawing tool or right-click to add regions
4. **Customize**: Use the rich text editor to add descriptions and custom fields

### Timeline Navigation

1. **Open Timeline**: Click the timeline button (clock icon)
2. **Navigate Years**: Use the timeline slider or year navigation buttons
3. **Add Epochs**: Create time periods to organize your timeline
4. **Add Notes**: Add contextual notes to specific years

### Map Customization

1. **Upload Map Image**: Use the settings panel to upload or configure map images
2. **Adjust Settings**: Configure map scale, roundness, and positioning
3. **Customize Background**: Set background images for the viewport
4. **Configure UI**: Adjust which UI elements show at different zoom levels

## 🔧 Development

### Architecture Overview

The application follows a modern architecture with:

- **Frontend**: Next.js with React 19 and TypeScript
- **API**: tRPC for type-safe API communication
- **Database**: PostgreSQL with efficient change-based storage
- **State Management**: React Query for server state, Zustand for UI state
- **Styling**: Tailwind CSS with custom SASS components

### Key Design Patterns

- **Progressive Enhancement**: Timeline changes are stored incrementally
- **Type Safety**: Full TypeScript coverage with tRPC for end-to-end type safety
- **Component Composition**: Modular component architecture with clear separation of concerns
- **Performance**: Efficient rendering with React Query caching and optimized map interactions

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support, please open an issue on GitHub or contact the maintainers.

---

**Dynamap** - Where your imagination meets the map.
