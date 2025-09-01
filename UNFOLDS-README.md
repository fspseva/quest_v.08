# UNFOLDS - Geo-Located Story Platform

UNFOLDS is a comprehensive mobile-first platform for creating and discovering geo-located stories that unfold step by step. Users can create interactive GPS-based narratives and explore stories created by others through an immersive map-centric experience.

## 🚀 Quick Navigation
| Module | Description | Launch |
|--------|-------------|--------|
| **Story Creator** | Author new geo-located stories with interactive maps | **[📝 Create Story](unfolds-creator.html)** |
| **Story Discovery** | Explore stories on an interactive map with mobile-first design | **[🗺️ Discover Stories](unfolds-discovery.html)** |
| **User Profile** | Manage your stories, view achievements, and track rewards | **[👤 My Profile](unfolds-profile.html)** |
| **Legacy Creator** | Original quest creation interface (backward compatibility) | **[⚙️ Legacy Creator](index.html)** |
| **Legacy Discovery** | Original discovery interface | **[🔍 Legacy Discovery](discovery.html)** |

## 🌟 Features Overview

### Core Concepts
- **Unfolds (Stories)**: Container for geo-located narrative experiences
- **Steps**: GPS-referenced checkpoints that users must visit to progress
- **Access Policies**: Control who can access stories (public, private, restricted)
- **Claims**: User attempts to capture steps with validation
- **Rewards**: Unique coupon codes issued for story/step completion

### Key Capabilities
- **Mobile-First Design**: Optimized for smartphone discovery and creation
- **Map-Centric Experience**: Interactive mapping with bottom sliding sheets
- **Real-Time Geolocation**: Accurate GPS tracking with anti-abuse measures
- **Flexible Access Control**: Public, private, and restricted group stories
- **Reward System**: Cryptographically secure coupon generation
- **Moderation Workflow**: Quality control for public content
- **Progressive Discovery**: Stories unfold step-by-step as users progress

## 🗂️ File Structure

```
UNFOLDS Implementation/
├── unfolds-schema.json          # Complete database schema definition
├── unfolds-database.json        # Enhanced database with UNFOLDS structure
├── unfolds-creator.html         # Story Creation Module interface
├── unfolds-creator.js          # Story creation functionality
├── unfolds-discovery.html      # Story Discovery Module interface  
├── unfolds-discovery.js        # Discovery and map functionality
├── unfolds-profile.html        # User Profile Module interface
├── unfolds-profile.js          # Profile management functionality
├── database.json              # Legacy quest data (backward compatibility)
├── discovery.html             # Legacy discovery interface
├── index.html                 # Legacy quest creator
└── UNFOLDS-README.md          # This documentation
```

## 🚀 Quick Start

### 📱 Live Demo Links
- **[📝 Story Creator](unfolds-creator.html)** - Create new geo-located stories
- **[🗺️ Story Discovery](unfolds-discovery.html)** - Explore and discover stories on the map
- **[👤 User Profile](unfolds-profile.html)** - Manage your stories, achievements, and rewards

### 1. Story Creation
```bash
# Open the story creator
open unfolds-creator.html
```

1. **Basic Information**: Enter story name and description
2. **Availability**: Choose public (requires moderation) or private access
3. **Privacy Settings**: Configure link-only or restricted group access
4. **Steps Creation**: Add GPS checkpoints with interactive maps
5. **Reward Configuration**: Set up step and story completion rewards
6. **Publishing**: Save as draft or publish (triggers moderation if public)

### 2. Story Discovery  
```bash
# Open the discovery interface
open unfolds-discovery.html
```

1. **Map Exploration**: Browse stories on an interactive map
2. **Location Detection**: App centers on user's current location
3. **Filter & Search**: Find stories by difficulty, keywords, or proximity
4. **Bottom Sheet**: Sliding interface shows nearby stories
5. **Story Details**: Tap markers or cards to view full information
6. **Claim Steps**: Visit GPS locations to progress through stories

### 3. Profile Management
```bash
# Open the profile interface  
open unfolds-profile.html
```

1. **Overview**: View stats and recent achievements
2. **Created Stories**: Manage your authored content
3. **Completed Stories**: Track your discovery progress
4. **Rewards Inventory**: View earned coupon codes
5. **Achievements**: Unlock badges for various activities
6. **Settings**: Configure notifications and preferences

## 📋 Core Modules

### 1. Story Creation Module (`unfolds-creator.html`)

**Purpose**: Comprehensive interface for authoring geo-located stories

**Key Features**:
- Interactive step-by-step form with validation
- Integrated map for GPS coordinate selection  
- Flexible privacy and access control options
- Real-time preview functionality
- CSV upload for restricted group whitelists
- Mobile-responsive design with current location detection

**Technical Implementation**:
- Vanilla JavaScript with Leaflet.js for mapping
- Form validation with real-time error feedback
- Local storage for draft management
- Mobile geolocation API integration

### 2. Story Discovery Module (`unfolds-discovery.html`)

**Purpose**: Mobile-first map interface for finding and engaging with stories

**Key Features**:
- Dark theme with yellow accent colors (brand compliant)
- Bottom sliding sheet with three states (collapsed/half/full)
- Real-time distance calculations from user location
- Search and filtering capabilities
- Interactive map markers with status indicators
- Responsive design optimized for mobile gestures

**Technical Implementation**:
- Custom dark map tiles for immersive experience
- Touch gesture handling for sheet interactions
- Geolocation tracking with accuracy validation
- Dynamic marker generation based on story status
- Progressive loading of nearby content

### 3. Profile Module (`unfolds-profile.html`)

**Purpose**: Personal hub for user activity and progress management

**Key Features**:
- Tabbed interface (Overview, Created, Completed, Rewards, Achievements, Settings)
- Comprehensive statistics tracking
- Story management with edit/share/archive actions
- Achievement system with progress badges
- Notification preferences configuration
- Data export functionality

**Technical Implementation**:
- Local storage-based user management
- Dynamic achievement calculation
- Modular tab system with lazy loading
- CSV data export functionality

## 🛠️ Database Schema

### Core Objects

#### Unfold (Story)
```json
{
  "id": "string (UUIDv4)",
  "title": "string",
  "description": "string",
  "availability": "public|private|restricted", 
  "status": "draft|pending|approved|published|rejected|archived",
  "author_id": "string",
  "access_policy_id": "string",
  "aggregated_metadata": {
    "estimated_duration": "number (minutes)",
    "difficulty": "easy|medium|hard|epic",
    "total_steps": "number",
    "completion_count": "number"
  }
}
```

#### Step
```json
{
  "id": "string (UUIDv4)",
  "unfold_id": "string",
  "step_order": "number", 
  "name": "string",
  "description": "string",
  "geo": {"lat": "number", "lng": "number"},
  "claim_radius": "number (meters)",
  "time_window": {
    "start_at": "datetime (optional)",
    "due_at": "datetime (optional)"
  }
}
```

#### Access Policy
```json
{
  "id": "string (UUIDv4)",
  "type": "public|link_qr_unlisted|restricted_group",
  "configuration": {
    "whitelist": ["array of emails"],
    "credential_type": "nft|id|sso"
  }
}
```

## 🔐 Security & Anti-Abuse

### Geolocation Validation
- **Accuracy Requirement**: Location accuracy must be ≤ 50 meters
- **Dwell Time**: 3-5 second minimum presence before claim
- **Speed Check**: Claims blocked if movement speed > 30 km/h
- **Mock Location Detection**: Identifies GPS spoofing attempts
- **Rate Limiting**: Per-device, account, and IP restrictions

### Reward Security
- **Cryptographic Generation**: UUIDv4 + salted hash for uniqueness
- **Idempotent Claims**: Same claim always generates same reward code
- **Backend Validation**: All rewards generated server-side
- **Expiration Handling**: Optional time-based reward expiry
- **Merchant Integration**: Webhook support for redemption validation

## 🎯 Time Rules & Constraints

### Global Story Windows
- Story availability = intersection of all step time windows
- `story.start_at = max(step.start_at values)`
- `story.due_at = min(step.due_at values)`
- Steps without time windows don't restrict global availability

### Claiming Logic
A step becomes claimable when:
1. User is within `claim_radius` (default 25m)
2. Current time is within `[start_at, due_at]` window (if defined)
3. Access policy requirements are satisfied
4. Anti-abuse checks pass

## 📱 Mobile Experience

### Design Principles
- **Mobile-First**: Interface designed for smartphone usage
- **Yellow Accent**: Brand-consistent highlighting for primary actions
- **Bottom Sheet**: Native mobile interaction pattern
- **Touch Gestures**: Intuitive drag, tap, and swipe interactions
- **Offline Capability**: Cached tiles and metadata for poor connectivity

### Responsive Breakpoints
- **Mobile**: < 768px (optimized touch targets, full-screen modals)
- **Tablet**: 768px - 1024px (adapted layouts, preserved mobile patterns)
- **Desktop**: > 1024px (enhanced multi-column layouts)

## 🔄 Moderation Workflow

### Status Progression
1. **Draft**: Private editing state
2. **Pending**: Submitted for review (public stories only)
3. **Approved/Rejected**: Moderator decision
4. **Published**: Live on platform
5. **Archived**: Removed from active discovery

### Moderation Actions
- **Approve**: Story becomes publicly available
- **Reject**: Story blocked with feedback
- **Adjust**: Request changes while maintaining pending status
- **Private Bypass**: Unlisted/restricted stories skip moderation

## 🏆 Achievement System

### Categories
- **Creation**: First story, 5+ stories, 10+ stories
- **Exploration**: First completion, 5+ completions, 10+ completions  
- **Distance**: 1km, 5km, 10km+ traveled
- **Engagement**: Step completion milestones
- **Special**: Time-based, location-based, community achievements

### Implementation
- Dynamic calculation based on user statistics
- Local badge storage with sync capability
- Progressive unlock system
- Social sharing integration

## 🔌 Integration Points

### Current Integrations
- **OpenStreetMap**: Base mapping with custom dark tiles
- **HTML5 Geolocation**: Native browser positioning
- **Local Storage**: Client-side data persistence
- **File API**: CSV upload and data export

### Planned Integrations
- **Credential Gates**: NFT, ID verification, SSO providers
- **Merchant Systems**: Coupon redemption webhooks
- **Cloud Storage**: User data synchronization
- **Push Notifications**: Geofence alerts and reminders
- **Analytics**: User behavior and engagement tracking

## 🚦 Getting Started - Development

### Prerequisites
- Modern web browser with HTML5 support
- Location services enabled
- Local web server (recommended for file:// protocol limitations)

### Local Development
```bash
# Serve files locally (Python example)
python -m http.server 8000

# Access modules
http://localhost:8000/unfolds-creator.html
http://localhost:8000/unfolds-discovery.html  
http://localhost:8000/unfolds-profile.html
```

### Testing Workflow
1. **Create Stories**: Use creator module to author test content
2. **Discovery Testing**: Verify map display and filtering
3. **Profile Validation**: Check stats and achievement calculation
4. **Mobile Testing**: Test responsive behavior and touch interactions
5. **Data Persistence**: Validate local storage functionality

## 📊 Performance Considerations

### Loading Optimization
- **Cold Start**: < 2 seconds with cached nearby content
- **Geo Queries**: Distance-based pagination with clustering
- **Map Tiles**: Efficient tile caching and loading
- **Asset Optimization**: Minified CSS/JS for production

### Scalability Architecture
- **Modular Services**: Separate Geo/Query, Claims/Rewards, Moderation, Auth
- **Database Indexing**: Spatial indexes for geo queries
- **Caching Strategy**: Multi-layer caching for frequently accessed data
- **CDN Integration**: Static asset delivery optimization

## 🔍 Troubleshooting

### Common Issues

**Location Not Working**
- Ensure HTTPS (required for geolocation)
- Check browser permissions
- Verify device location services enabled

**Stories Not Loading**  
- Check network connectivity
- Verify database.json accessibility
- Clear browser cache/local storage

**Map Display Issues**
- Confirm OpenStreetMap tile access
- Check console for JavaScript errors
- Verify Leaflet.js library loading

**Mobile Responsiveness**
- Test viewport meta tag configuration
- Verify CSS media query implementation
- Check touch event handling

## 🤝 Contributing

This implementation provides a complete foundation for the UNFOLDS platform. Key areas for enhancement include:

- **Backend Integration**: Replace local storage with API endpoints
- **Real-Time Features**: Live collaboration and social interactions
- **Advanced Analytics**: User behavior tracking and optimization
- **Content Moderation**: AI-assisted review and filtering
- **Performance**: Optimization for large-scale deployment

## 📄 License & Usage

This implementation serves as a comprehensive reference for building geo-located story platforms. The modular architecture allows for easy customization and extension based on specific requirements.

---

## Implementation Status

✅ **Completed Features**
- Story Creation Module with full form validation
- Story Discovery Module with mobile-first design
- Profile Module with comprehensive user management
- Database schema design and migration support
- Responsive design across all modules
- Local storage-based data persistence

🔄 **In Progress**
- Moderation workflow implementation
- Advanced geolocation validation
- Reward generation system
- Cross-module integration testing

📋 **Planned Enhancements**
- Backend API integration
- Real-time synchronization
- Advanced security features
- Performance optimizations
- Community features

This README provides complete documentation for understanding, implementing, and extending the UNFOLDS platform. Each module is designed to work independently while contributing to a cohesive user experience.