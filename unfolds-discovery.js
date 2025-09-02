class UnfoldsDiscovery {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.stories = [];
        this.markers = [];
        this.currentFilter = 'all';
        this.sheetState = 'collapsed'; // collapsed, half, full
        this.isListView = false;
        
        this.init();
    }

    init() {
        this.initMap();
        this.bindEvents();
        this.loadStories();
        this.requestLocation();
    }

    initMap() {
        // Initialize map centered on Lisbon (default)
        this.map = L.map('map', {
            center: [38.7223, -9.1393],
            zoom: 13,
            zoomControl: false,
            attributionControl: true
        });

        // Add zoom controls to bottom right
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // Add map tile layer - fallback to standard OSM if dark theme fails
        const primaryTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        });

        const fallbackTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });

        // Try dark theme first, fallback to standard OSM
        primaryTileLayer.addTo(this.map);
        
        primaryTileLayer.on('tileerror', () => {
            console.warn('Dark tiles failed, switching to standard OpenStreetMap');
            this.map.removeLayer(primaryTileLayer);
            fallbackTileLayer.addTo(this.map);
        });

        // Add custom icons
        this.createCustomIcons();
    }

    createCustomIcons() {
        this.icons = {
            user: L.divIcon({
                className: 'custom-icon user-icon',
                html: '<div style="background: #FFD700; border: 3px solid white; width: 20px; height: 20px; border-radius: 50%; box-shadow: 0 2px 10px rgba(255,215,0,0.5);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            }),
            available: L.divIcon({
                className: 'custom-icon available-icon',
                html: '<div style="background: #4CAF50; border: 3px solid white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; box-shadow: 0 2px 10px rgba(76,175,80,0.5);">✓</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            unavailable: L.divIcon({
                className: 'custom-icon unavailable-icon',
                html: '<div style="background: #F44336; border: 3px solid white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; box-shadow: 0 2px 10px rgba(244,67,54,0.5);">✕</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            claimed: L.divIcon({
                className: 'custom-icon claimed-icon',
                html: '<div style="background: #9E9E9E; border: 3px solid white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; box-shadow: 0 2px 10px rgba(158,158,158,0.5);">★</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            story: L.divIcon({
                className: 'custom-icon story-icon',
                html: '<div style="background: linear-gradient(135deg, #FFD700, #FFA500); border: 3px solid white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 4px 15px rgba(255,215,0,0.4);">📍</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        };
    }

    bindEvents() {
        // Sliding sheet interactions
        const sheet = document.getElementById('slidingSheet');
        const header = document.getElementById('sheetHeader');
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        header.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        });

        header.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            currentY = e.touches[0].clientY;
            const deltaY = startY - currentY;
            
            if (deltaY > 75) {
                this.setSheetState('full');
            } else if (deltaY < -50) {
                this.setSheetState('collapsed');
            }
        });

        header.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Mouse events for desktop
        header.addEventListener('click', () => {
            if (this.sheetState === 'collapsed') {
                this.setSheetState('full');
            } else {
                this.setSheetState('collapsed');
            }
        });

        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterStories();
            });
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchStories(e.target.value);
            }, 300);
        });

        // View toggle
        document.getElementById('viewToggle').addEventListener('click', () => {
            this.toggleView();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('storyDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'storyDetailModal') {
                this.closeModal();
            }
        });

        // Map events
        this.map.on('click', () => {
            if (this.sheetState === 'full') {
                this.setSheetState('collapsed');
            }
        });
    }

    setSheetState(state) {
        const sheet = document.getElementById('slidingSheet');
        sheet.className = `sliding-sheet ${state}`;
        this.sheetState = state;
        
        // Invalidate map size after animation
        setTimeout(() => {
            this.map.invalidateSize();
        }, 400);
    }

    toggleView() {
        this.isListView = !this.isListView;
        const toggle = document.getElementById('viewToggle');
        
        if (this.isListView) {
            toggle.innerHTML = '🗺️ Map';
            toggle.classList.add('active');
            this.setSheetState('full');
            this.hideMapMarkers();
        } else {
            toggle.innerHTML = '📋 List';
            toggle.classList.remove('active');
            this.setSheetState('collapsed');
            this.showMapMarkers();
        }
    }

    hideMapMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
    }

    showMapMarkers() {
        this.markers.forEach(marker => {
            this.map.addLayer(marker);
        });
    }

    async requestLocation() {
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000
                    });
                });

                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Update map center
                this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);

                // Add user location marker
                L.marker([this.userLocation.lat, this.userLocation.lng], {
                    icon: this.icons.user,
                    zIndexOffset: 1000
                }).addTo(this.map).bindPopup('Your Location');

                // Update story distances
                this.updateStoryDistances();
                
            } catch (error) {
                console.warn('Location access denied or unavailable:', error);
                this.showLocationError();
            }
        }
    }

    showLocationError() {
        const container = document.getElementById('storiesContainer');
        container.innerHTML = `
            <div class="loading">
                📍 Location access required
                <br><small>Please enable location services to discover nearby stories</small>
            </div>
        `;
    }

    async loadStories() {
        try {
            // Load from multiple sources
            const sources = [
                this.loadFromLocalStorage(),
                this.loadFromDatabase(),
                this.loadLegacyQuests()
            ];

            const results = await Promise.all(sources);
            this.stories = results.flat().filter(story => story !== null);

            if (this.stories.length === 0) {
                this.showEmptyState();
                return;
            }

            this.renderStories();
            this.addMarkersToMap();
            
        } catch (error) {
            console.error('Error loading stories:', error);
            this.showErrorState();
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = JSON.parse(localStorage.getItem('unfolds_stories') || '[]');
            return saved.filter(story => story.status === 'published');
        } catch {
            return [];
        }
    }

    async loadFromDatabase() {
        try {
            const response = await fetch('./unfolds-database.json');
            const data = await response.json();
            return data.unfolds || [];
        } catch {
            return [];
        }
    }

    async loadLegacyQuests() {
        try {
            const response = await fetch('./database.json');
            const data = await response.json();
            
            // Convert legacy format to new format
            return data.quests.map(quest => this.convertLegacyQuest(quest));
        } catch {
            return [];
        }
    }

    convertLegacyQuest(quest) {
        return {
            id: `legacy_${quest.id}`,
            title: quest.story.name,
            description: quest.story.description,
            availability: 'public',
            status: 'published',
            steps: quest.steps.map((step, index) => ({
                id: step.id,
                step_order: index + 1,
                name: step.name,
                description: step.description,
                geo: {
                    lat: step.coordinates.x,
                    lng: step.coordinates.y
                },
                claim_radius: step.claimingRadius,
                step_reward: step.reward
            })),
            aggregated_metadata: {
                difficulty: 'easy',
                estimated_duration: quest.steps.length * 5,
                total_steps: quest.steps.length,
                total_distance: 0 // Would calculate if needed
            },
            created_at: quest.createdAt
        };
    }

    updateStoryDistances() {
        if (!this.userLocation) return;

        this.stories.forEach(story => {
            if (story.steps && story.steps.length > 0) {
                // Use first step location for distance calculation
                const firstStep = story.steps[0];
                story.distance = this.calculateDistance(
                    this.userLocation.lat,
                    this.userLocation.lng,
                    firstStep.geo.lat,
                    firstStep.geo.lng
                );
            }
        });

        // Sort by distance
        this.stories.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
        this.renderStories();
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    renderStories() {
        const container = document.getElementById('storiesContainer');
        
        if (this.stories.length === 0) {
            this.showEmptyState();
            return;
        }

        const filteredStories = this.getFilteredStories();
        
        container.innerHTML = filteredStories.map(story => this.renderStoryCard(story)).join('');
        
        // Add click events to story cards
        container.querySelectorAll('.story-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const storyId = e.currentTarget.dataset.storyId;
                this.showStoryDetail(storyId);
            });
        });
    }

    renderStoryCard(story) {
        const distance = story.distance ? this.formatDistance(story.distance) : 'Unknown';
        const difficulty = story.aggregated_metadata?.difficulty || 'easy';
        const duration = story.aggregated_metadata?.estimated_duration || 0;
        const steps = story.aggregated_metadata?.total_steps || story.steps?.length || 0;

        return `
            <div class="story-card" data-story-id="${story.id}">
                <div class="story-header">
                    <div>
                        <div class="story-title">${story.title}</div>
                        <div class="story-description">${story.description}</div>
                    </div>
                    <div class="story-distance">${distance}</div>
                </div>
                <div class="story-meta">
                    <div class="meta-item">
                        ⏱️ ${duration}min
                    </div>
                    <div class="meta-item">
                        📍 ${steps} steps
                    </div>
                    <div class="difficulty-badge difficulty-${difficulty}">
                        ${difficulty}
                    </div>
                </div>
            </div>
        `;
    }

    formatDistance(distance) {
        if (distance < 1000) {
            return `${Math.round(distance)}m`;
        } else {
            return `${(distance / 1000).toFixed(1)}km`;
        }
    }

    getFilteredStories() {
        let filtered = [...this.stories];
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(story => {
                const difficulty = story.aggregated_metadata?.difficulty || 'easy';
                return difficulty === this.currentFilter;
            });
        }
        
        return filtered;
    }

    addMarkersToMap() {
        // Clear existing markers
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];

        // Add story markers
        this.stories.forEach(story => {
            if (!story.steps || story.steps.length === 0) return;

            story.steps.forEach(step => {
                const marker = L.marker([step.geo.lat, step.geo.lng], {
                    icon: this.icons.available // Would determine actual status based on claim logic
                }).addTo(this.map);

                // Add popup
                marker.bindPopup(`
                    <div>
                        <strong>${step.name}</strong><br>
                        <em>${story.title}</em><br>
                        ${step.description}<br>
                        <small style="color: #FFD700; font-weight: 500;">📍 Claiming radius: ${step.claim_radius || 25}m</small>
                    </div>
                `);

                // Add claiming radius circle
                const circle = L.circle([step.geo.lat, step.geo.lng], {
                    color: '#FFD700',
                    fillColor: '#FFD700',
                    fillOpacity: 0.1,
                    radius: step.claim_radius || 25,
                    weight: 2
                }).addTo(this.map);

                // Click handler
                marker.on('click', () => {
                    this.showStoryDetail(story.id);
                });

                this.markers.push(marker);
                this.markers.push(circle);
            });
        });
    }

    showStoryDetail(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        const modal = document.getElementById('storyDetailModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        modalTitle.textContent = story.title;

        const distance = story.distance ? this.formatDistance(story.distance) : 'Unknown';
        const difficulty = story.aggregated_metadata?.difficulty || 'easy';
        const duration = story.aggregated_metadata?.estimated_duration || 0;
        const steps = story.aggregated_metadata?.total_steps || story.steps?.length || 0;

        // Check if user can start/claim
        const canStart = this.userLocation && story.steps && story.steps.length > 0;
        const firstStep = story.steps?.[0];
        const canClaim = canStart && firstStep && this.calculateDistance(
            this.userLocation.lat, this.userLocation.lng,
            firstStep.geo.lat, firstStep.geo.lng
        ) <= (firstStep.claim_radius || 25);

        modalContent.innerHTML = `
            <div class="story-description">${story.description}</div>
            
            <div class="story-meta" style="margin: 20px 0;">
                <div class="meta-item">📍 Distance: ${distance}</div>
                <div class="meta-item">⏱️ Duration: ${duration} min</div>
                <div class="meta-item">🎯 Steps: ${steps}</div>
                <div class="difficulty-badge difficulty-${difficulty}">${difficulty}</div>
            </div>


            <div class="action-buttons">
                <button class="btn btn-secondary" onclick="unfolds.shareStory('${story.id}')">
                    🔗 Share
                </button>
                <button class="btn btn-primary ${!canStart ? 'disabled' : ''}" 
                        onclick="unfolds.startStory('${story.id}')"
                        ${!canStart ? 'disabled' : ''}>
                    ${canClaim ? '🎯 Claim Step' : '🚀 Start Story'}
                </button>
            </div>
        `;

        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('storyDetailModal').classList.remove('show');
    }

    shareStory(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        const shareUrl = `${window.location.origin}${window.location.pathname}?story=${storyId}`;
        
        if (navigator.share) {
            navigator.share({
                title: story.title,
                text: story.description,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Story link copied to clipboard!');
            });
        }
    }

    startStory(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        // For now, just show an alert. In a real app, this would navigate to play mode
        alert(`Starting "${story.title}"! In a real app, this would begin the step-by-step experience.`);
        this.closeModal();
    }

    searchStories(query) {
        if (!query.trim()) {
            this.renderStories();
            return;
        }

        const searchResults = this.stories.filter(story => {
            const searchText = `${story.title} ${story.description}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        // Temporarily replace stories for rendering
        const originalStories = this.stories;
        this.stories = searchResults;
        this.renderStories();
        this.stories = originalStories;
    }

    filterStories() {
        this.renderStories();
    }

    showEmptyState() {
        const container = document.getElementById('storiesContainer');
        container.innerHTML = `
            <div class="loading">
                📝 No stories found nearby
                <br><small>Be the first to create a story in this area!</small>
                <br><br>
                <button class="btn btn-primary" onclick="window.location.href='unfolds-creator.html'">
                    ➕ Create Story
                </button>
            </div>
        `;
    }

    showErrorState() {
        const container = document.getElementById('storiesContainer');
        container.innerHTML = `
            <div class="loading">
                ❌ Error loading stories
                <br><small>Please check your connection and try again</small>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.unfolds = new UnfoldsDiscovery();
});