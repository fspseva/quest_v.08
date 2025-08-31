# GPS Quest Creator & Discovery System

A complete GPS-based treasure hunt and story creation platform with interactive map discovery.

## 📁 Files Overview

- **index.html** - Quest Creator interface
- **discovery.html** - Story Discovery interface with interactive map
- **styles.css** - Styling for Quest Creator
- **discovery-styles.css** - Styling for Discovery module
- **script.js** - Quest Creator functionality
- **discovery-script.js** - Discovery module functionality

## 🎯 Features

### Quest Creator (index.html)
- Create interactive GPS-based stories
- Add multiple steps with GPS coordinates
- Configure claiming radius and time windows
- Set up reward systems (limited/unlimited)
- Export quests as JSON files
- Mobile-friendly GPS coordinate picker

### Discovery Module (discovery.html)
- Interactive OpenStreetMap integration
- Shows nearest 3 steps from user location
- Real-time distance calculations
- Sliding step details card
- Reward claiming system
- Search functionality
- Automatic location detection

## 🚀 How to Use

### Creating Quests
1. Open `index.html` in your browser
2. Fill in story details (name, description, reward)
3. Add quest steps with GPS coordinates
4. Use "Use Current Location" on mobile for easy GPS input
5. Configure claiming radius and time windows
6. Set up step rewards (optional)
7. Save as JSON file or preview

### Discovering Quests
1. Open `discovery.html` in your browser
2. Allow location access when prompted
3. See nearest 3 quest steps on the map
4. Click markers to view step details
5. Claim rewards when in range and conditions are met
6. Use search to find specific quests

### Loading Custom Quests
- Drag and drop JSON quest files onto the discovery map
- Files created with the Quest Creator are automatically compatible

## 🗺️ Map Features

- **Green markers**: Available steps you can claim
- **Red markers**: Unavailable steps (time/distance restrictions)
- **Gray markers**: Already claimed steps
- **Blue marker**: Your current location
- **Circles around markers**: Claiming radius visualization

## 📱 Mobile Support

- Responsive design for mobile devices
- GPS location services integration
- Touch-friendly interface
- Optimized for both creation and discovery on mobile

## 🎮 Sample Quests

The Discovery module comes with sample quests in New York City:
- Central Park Adventure
- Historic Brooklyn
- Museum Mile
- Times Square Discovery

## 💡 Tips

- Enable location services for the best experience
- Quest files are saved in JSON format for easy sharing
- The system works offline for quest creation
- Discovery requires internet connection for map tiles
- Claimed rewards are saved locally in your browser

## 🔧 Technical Details

- Uses OpenStreetMap with Leaflet.js for mapping
- HTML5 Geolocation API for position tracking
- Local storage for persistent reward claiming
- Responsive CSS Grid and Flexbox layouts
- Vanilla JavaScript (no frameworks required)

Enjoy creating and discovering GPS-based treasure hunts! 🗺️✨