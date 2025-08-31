class QuestDiscovery {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.userMarker = null;
        this.userAccuracyCircle = null;
        this.stepMarkers = [];
        this.allSteps = [];
        this.nearestSteps = [];
        this.selectedStep = null;
        this.claimedSteps = new Set();
        this.currentView = 'map'; // 'map' or 'list'
        this.currentSort = 'distance';
        this.currentFilter = 'all';
        
        this.initializeMap();
        this.initializeEventListeners();
        this.loadSampleData();
        this.getUserLocation();
    }

    initializeMap() {
        this.map = L.map('map').setView([40.7128, -74.0060], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        this.map.on('click', () => {
            this.hideStepCard();
        });
    }

    initializeEventListeners() {
        const locationBtn = document.getElementById('location-btn');
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        const closeCard = document.getElementById('close-card');
        const claimBtn = document.getElementById('claim-btn');
        const directionsBtn = document.getElementById('directions-btn');
        const closeRewardModal = document.getElementById('close-reward-modal');
        const viewToggleBtn = document.getElementById('view-toggle-btn');
        const sortSelect = document.getElementById('sort-select');
        const filterSelect = document.getElementById('filter-select');
        const dbMenuBtn = document.getElementById('db-menu-btn');
        const exportDbBtn = document.getElementById('export-db-btn');
        const clearDbBtn = document.getElementById('clear-db-btn');
        const clearClaimsBtn = document.getElementById('clear-claims-btn');

        locationBtn.addEventListener('click', () => this.getUserLocation());
        searchBtn.addEventListener('click', () => this.performSearch());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        closeCard.addEventListener('click', () => this.hideStepCard());
        claimBtn.addEventListener('click', () => this.claimReward());
        directionsBtn.addEventListener('click', () => this.getDirections());
        closeRewardModal.addEventListener('click', () => this.hideRewardModal());
        viewToggleBtn.addEventListener('click', () => this.toggleView());
        sortSelect.addEventListener('change', () => this.updateListView());
        filterSelect.addEventListener('change', () => this.updateListView());
        dbMenuBtn.addEventListener('click', () => this.toggleDatabaseMenu());
        exportDbBtn.addEventListener('click', () => this.exportDatabase());
        clearDbBtn.addEventListener('click', () => this.confirmClearDatabase());
        clearClaimsBtn.addEventListener('click', () => this.clearClaimedSteps());

        // Close modals on outside click
        document.getElementById('reward-modal').addEventListener('click', (e) => {
            if (e.target.id === 'reward-modal') {
                this.hideRewardModal();
            }
        });
        
        // Close database menu on outside click
        document.addEventListener('click', (e) => {
            const databaseMenu = document.getElementById('database-menu');
            const dbMenuBtn = document.getElementById('db-menu-btn');
            
            if (!databaseMenu.contains(e.target) && !dbMenuBtn.contains(e.target)) {
                this.hideDatabaseMenu();
            }
        });
    }

    getUserLocation() {
        const loadingOverlay = document.getElementById('loading-overlay');
        const locationBtn = document.getElementById('location-btn');
        
        loadingOverlay.classList.remove('hidden');
        locationBtn.textContent = '📍 Locating...';

        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            loadingOverlay.classList.add('hidden');
            locationBtn.textContent = '📍 Find Me';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                this.updateUserLocationOnMap();
                this.findNearestSteps();
                this.updateStepMarkers();

                loadingOverlay.classList.add('hidden');
                locationBtn.textContent = '📍 Find Me';
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.handleLocationError(error);
                loadingOverlay.classList.add('hidden');
                locationBtn.textContent = '📍 Find Me';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    handleLocationError(error) {
        let message = 'Unable to retrieve location.';
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied. Please enable location services.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out.';
                break;
        }
        alert(message);
        
        // Use default location (New York City) as fallback
        this.userLocation = { lat: 40.7128, lng: -74.0060, accuracy: null };
        this.updateUserLocationOnMap();
        this.findNearestSteps();
        this.updateStepMarkers();
    }

    updateUserLocationOnMap() {
        // Remove existing user marker and accuracy circle
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }
        if (this.userAccuracyCircle) {
            this.map.removeLayer(this.userAccuracyCircle);
        }

        // Add user location marker
        const userIcon = L.divIcon({
            className: 'custom-marker marker-user',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        this.userMarker = L.marker([this.userLocation.lat, this.userLocation.lng], {
            icon: userIcon
        }).addTo(this.map);

        // Add accuracy circle if available
        if (this.userLocation.accuracy) {
            this.userAccuracyCircle = L.circle([this.userLocation.lat, this.userLocation.lng], {
                radius: this.userLocation.accuracy,
                className: 'user-location-accuracy'
            }).addTo(this.map);
        }

        // Center map on user location
        this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    findNearestSteps() {
        if (!this.userLocation) return;

        // Calculate distances for all steps
        this.allSteps.forEach(step => {
            step.distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                step.coordinates.x,
                step.coordinates.y
            );
        });

        // Sort by distance and take nearest 3
        this.nearestSteps = this.allSteps
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
            
        // Update list view if active
        if (this.currentView === 'list') {
            this.updateListView();
        }
    }

    updateStepMarkers() {
        // Clear existing markers
        this.stepMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.stepMarkers = [];

        // Add markers for nearest 3 steps
        this.nearestSteps.forEach(step => {
            const markerClass = this.getMarkerClass(step);
            
            const stepIcon = L.divIcon({
                className: `custom-marker ${markerClass}`,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                html: `<div style="width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">${step.stepNumber || ''}</div>`
            });

            const marker = L.marker([step.coordinates.x, step.coordinates.y], {
                icon: stepIcon
            }).addTo(this.map);

            // Add click event to show step details
            marker.on('click', () => {
                this.showStepCard(step);
            });

            // Add claiming radius circle
            const radiusCircle = L.circle([step.coordinates.x, step.coordinates.y], {
                radius: step.claimingRadius,
                fillColor: this.getMarkerClass(step).includes('available') ? '#27ae60' : '#e74c3c',
                fillOpacity: 0.1,
                color: this.getMarkerClass(step).includes('available') ? '#27ae60' : '#e74c3c',
                weight: 2,
                opacity: 0.6
            }).addTo(this.map);

            this.stepMarkers.push(marker, radiusCircle);
        });
    }

    getMarkerClass(step) {
        if (this.claimedSteps.has(step.id)) {
            return 'marker-claimed';
        }
        
        if (this.isStepAvailable(step)) {
            return 'marker-available';
        }
        
        return 'marker-unavailable';
    }

    isStepAvailable(step) {
        const now = new Date();
        
        // Check if step is within claiming window
        if (step.claimingWindow.enabled) {
            const startDate = new Date(step.claimingWindow.startDate);
            const dueDate = new Date(step.claimingWindow.dueDate);
            
            if (now < startDate || now > dueDate) {
                return false;
            }
        }
        
        // Check if rewards are available
        if (step.reward.enabled && step.reward.limited) {
            if (step.reward.claimedCount >= step.reward.quantity) {
                return false;
            }
        }
        
        return true;
    }

    isUserInClaimingRadius(step) {
        if (!this.userLocation) return false;
        
        const distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            step.coordinates.x,
            step.coordinates.y
        );
        
        // Convert claiming radius from meters to kilometers
        const radiusKm = step.claimingRadius / 1000;
        
        return distance <= radiusKm;
    }

    showStepCard(step) {
        this.selectedStep = step;
        const card = document.getElementById('step-card');
        
        // Populate card content
        document.getElementById('step-name').textContent = step.name;
        document.getElementById('step-description').textContent = step.description;
        document.getElementById('step-distance').textContent = `${step.distance.toFixed(2)} km`;
        
        // Handle timing information
        const timingItem = document.getElementById('step-timing');
        const timingLabel = document.getElementById('timing-label');
        const timingValue = document.getElementById('timing-value');
        
        if (step.claimingWindow.enabled) {
            const now = new Date();
            const startDate = new Date(step.claimingWindow.startDate);
            const dueDate = new Date(step.claimingWindow.dueDate);
            
            timingItem.style.display = 'flex';
            
            if (now < startDate) {
                timingLabel.textContent = 'Available from:';
                timingValue.textContent = startDate.toLocaleDateString();
            } else if (now > dueDate) {
                timingLabel.textContent = 'Expired on:';
                timingValue.textContent = dueDate.toLocaleDateString();
            } else {
                timingLabel.textContent = 'Due date:';
                timingValue.textContent = dueDate.toLocaleDateString();
            }
        } else {
            timingItem.style.display = 'none';
        }
        
        // Handle rewards information
        const rewardsItem = document.getElementById('step-rewards');
        const rewardsCount = document.getElementById('rewards-count');
        
        if (step.reward.enabled && step.reward.limited) {
            rewardsItem.style.display = 'flex';
            const remaining = step.reward.quantity - (step.reward.claimedCount || 0);
            rewardsCount.textContent = `${remaining} of ${step.reward.quantity}`;
        } else {
            rewardsItem.style.display = 'none';
        }
        
        // Handle claim button
        const claimBtn = document.getElementById('claim-btn');
        const canClaim = this.isStepAvailable(step) && 
                        this.isUserInClaimingRadius(step) && 
                        !this.claimedSteps.has(step.id);
        
        claimBtn.disabled = !canClaim;
        
        if (this.claimedSteps.has(step.id)) {
            claimBtn.textContent = 'Already Claimed';
        } else if (!this.isStepAvailable(step)) {
            claimBtn.textContent = 'Not Available';
        } else if (!this.isUserInClaimingRadius(step)) {
            claimBtn.textContent = 'Too Far Away';
        } else {
            claimBtn.textContent = 'Claim Reward';
        }
        
        // Show the card
        card.classList.add('active');
    }

    hideStepCard() {
        const card = document.getElementById('step-card');
        card.classList.remove('active');
        this.selectedStep = null;
    }

    claimReward() {
        if (!this.selectedStep || !this.isStepAvailable(this.selectedStep) || 
            !this.isUserInClaimingRadius(this.selectedStep) || 
            this.claimedSteps.has(this.selectedStep.id)) {
            return;
        }
        
        // Mark step as claimed
        this.claimedSteps.add(this.selectedStep.id);
        
        // Update claimed count for limited rewards
        if (this.selectedStep.reward.limited) {
            this.selectedStep.reward.claimedCount = (this.selectedStep.reward.claimedCount || 0) + 1;
        }
        
        // Show reward modal
        const rewardCode = this.selectedStep.reward.code || this.generateRewardCode();
        document.getElementById('claimed-reward-code').textContent = rewardCode;
        document.getElementById('reward-modal').classList.add('active');
        
        // Update markers and card
        this.updateStepMarkers();
        this.hideStepCard();
        
        // Update list view if active
        if (this.currentView === 'list') {
            this.updateListView();
        }
        
        // Save to localStorage
        this.saveClaimedSteps();
    }

    generateRewardCode() {
        return 'REWARD' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    hideRewardModal() {
        document.getElementById('reward-modal').classList.remove('active');
    }

    getDirections() {
        if (!this.selectedStep || !this.userLocation) return;
        
        const url = `https://www.openstreetmap.org/directions?from=${this.userLocation.lat},${this.userLocation.lng}&to=${this.selectedStep.coordinates.x},${this.selectedStep.coordinates.y}&route=foot`;
        window.open(url, '_blank');
    }

    performSearch() {
        const query = document.getElementById('search-input').value.trim().toLowerCase();
        
        if (!query) return;
        
        const searchResults = this.allSteps.filter(step => 
            step.name.toLowerCase().includes(query) ||
            step.description.toLowerCase().includes(query) ||
            step.storyName.toLowerCase().includes(query)
        );
        
        if (searchResults.length > 0) {
            // Show first result
            const firstResult = searchResults[0];
            this.map.setView([firstResult.coordinates.x, firstResult.coordinates.y], 16);
            this.showStepCard(firstResult);
        } else {
            alert('No quests found matching your search.');
        }
    }

    saveClaimedSteps() {
        localStorage.setItem('claimedSteps', JSON.stringify([...this.claimedSteps]));
    }

    loadClaimedSteps() {
        const saved = localStorage.getItem('claimedSteps');
        if (saved) {
            this.claimedSteps = new Set(JSON.parse(saved));
        }
    }

    async loadSampleData() {
        // Start with empty quest database - quests will be loaded from database.json and localStorage
        this.allSteps = [];
        this.loadClaimedSteps();
        
        // Try loading from file first, then from localStorage
        await this.loadQuestsFromDatabase();
        await this.loadQuestsFromLocalStorage();
    }

    async loadQuestsFromDatabase() {
        try {
            const response = await fetch('./database.json');
            const data = await response.json();
            
            if (data.quests && Array.isArray(data.quests)) {
                data.quests.forEach(quest => {
                    this.addQuestToMap(quest);
                });
                
                console.log(`Loaded ${data.quests.length} quests from database`);
                
                // Refresh displays after loading
                if (this.userLocation) {
                    this.findNearestSteps();
                    this.updateStepMarkers();
                }
                
                if (this.currentView === 'list') {
                    this.updateListView();
                }
            }
        } catch (error) {
            console.log('No database.json found or error loading quests:', error);
            // This is fine - starting with empty database
        }
    }

    async saveQuestToDatabase(questData) {
        try {
            // For a simple file-based system, we'll use localStorage as a bridge
            // In a real app, this would be a proper database API call
            
            let database;
            try {
                const response = await fetch('./database.json');
                database = await response.json();
            } catch {
                database = { quests: [], metadata: { version: "1.0", totalQuests: 0 } };
            }

            // Add the new quest
            database.quests.push(questData);
            database.metadata.totalQuests = database.quests.length;
            database.metadata.lastUpdated = new Date().toISOString();

            // Store in localStorage for persistence (since we can't write files from browser)
            localStorage.setItem('questDatabase', JSON.stringify(database));
            
            console.log('Quest saved to database:', questData.story.name);
            
            // Add to current session
            this.addQuestToMap(questData);
            
            return true;
        } catch (error) {
            console.error('Error saving quest to database:', error);
            return false;
        }
    }

    async loadQuestsFromLocalStorage() {
        try {
            const data = localStorage.getItem('questDatabase');
            if (data) {
                const database = JSON.parse(data);
                if (database.quests && Array.isArray(database.quests)) {
                    database.quests.forEach(quest => {
                        this.addQuestToMap(quest);
                    });
                    console.log(`Loaded ${database.quests.length} quests from localStorage`);
                }
            }
        } catch (error) {
            console.error('Error loading quests from localStorage:', error);
        }
    }

    clearDatabase() {
        localStorage.removeItem('questDatabase');
        this.allSteps = [];
        this.nearestSteps = [];
        
        // Clear map markers
        this.stepMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.stepMarkers = [];
        
        // Refresh displays
        if (this.currentView === 'list') {
            this.updateListView();
        }
        
        console.log('Database cleared');
        this.hideDatabaseMenu();
    }

    exportDatabase() {
        const database = localStorage.getItem('questDatabase');
        if (database) {
            const blob = new Blob([database], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'database.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Database exported successfully!');
        } else {
            alert('No database to export - create some quests first!');
        }
        this.hideDatabaseMenu();
    }

    confirmClearDatabase() {
        const count = this.allSteps.length;
        if (count === 0) {
            alert('Database is already empty.');
            this.hideDatabaseMenu();
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete all ${count} quests from the database?\n\nThis action cannot be undone.`);
        if (confirmed) {
            this.clearDatabase();
            alert('Database cleared successfully!');
        }
        this.hideDatabaseMenu();
    }

    clearClaimedSteps() {
        const count = this.claimedSteps.size;
        if (count === 0) {
            alert('No claimed steps to clear.');
            this.hideDatabaseMenu();
            return;
        }

        const confirmed = confirm(`Are you sure you want to clear ${count} claimed rewards?\n\nYou'll be able to claim them again.`);
        if (confirmed) {
            localStorage.removeItem('claimedSteps');
            this.claimedSteps = new Set();
            
            // Refresh displays
            this.updateStepMarkers();
            if (this.currentView === 'list') {
                this.updateListView();
            }
            
            alert('Claimed steps cleared successfully!');
        }
        this.hideDatabaseMenu();
    }

    toggleDatabaseMenu() {
        const dbMenuBtn = document.getElementById('db-menu-btn');
        const databaseMenu = document.getElementById('database-menu');
        
        if (databaseMenu.classList.contains('hidden')) {
            databaseMenu.classList.remove('hidden');
            dbMenuBtn.classList.add('active');
        } else {
            this.hideDatabaseMenu();
        }
    }

    hideDatabaseMenu() {
        const dbMenuBtn = document.getElementById('db-menu-btn');
        const databaseMenu = document.getElementById('database-menu');
        
        databaseMenu.classList.add('hidden');
        dbMenuBtn.classList.remove('active');
    }

    // Method to load quests from JSON files (for integration with quest creator)
    loadQuestFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const questData = JSON.parse(e.target.result);
                this.addQuestToMap(questData);
            } catch (error) {
                alert('Error loading quest file: Invalid JSON format');
                console.error('Error parsing quest file:', error);
            }
        };
        reader.readAsText(file);
    }

    addQuestToMap(questData) {
        questData.steps.forEach((step, index) => {
            const stepWithId = {
                ...step,
                id: `${questData.story.name.replace(/\s+/g, '-').toLowerCase()}-${index + 1}`,
                storyName: questData.story.name,
                stepNumber: index + 1,
                reward: {
                    ...step.reward,
                    claimedCount: step.reward.claimedCount || 0
                }
            };
            
            this.allSteps.push(stepWithId);
        });
        
        // Refresh the map if user location is available
        if (this.userLocation) {
            this.findNearestSteps();
            this.updateStepMarkers();
        }
        
        // Refresh list view if currently active
        if (this.currentView === 'list') {
            this.updateListView();
        }
    }

    // List View Methods
    toggleView() {
        const viewToggleBtn = document.getElementById('view-toggle-btn');
        const mapContainer = document.getElementById('map-container');
        const listContainer = document.getElementById('list-container');
        
        if (this.currentView === 'map') {
            this.currentView = 'list';
            viewToggleBtn.textContent = '🗺️ Map View';
            viewToggleBtn.classList.add('active');
            mapContainer.classList.add('hidden');
            listContainer.classList.remove('hidden');
            this.updateListView();
        } else {
            this.currentView = 'map';
            viewToggleBtn.textContent = '📋 List View';
            viewToggleBtn.classList.remove('active');
            mapContainer.classList.remove('hidden');
            listContainer.classList.add('hidden');
            
            // Fix map display after being hidden
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    updateListView() {
        const sortSelect = document.getElementById('sort-select');
        const filterSelect = document.getElementById('filter-select');
        this.currentSort = sortSelect.value;
        this.currentFilter = filterSelect.value;

        let filteredSteps = this.filterSteps(this.allSteps);
        let sortedSteps = this.sortSteps(filteredSteps);
        
        this.renderQuestList(sortedSteps);
    }

    filterSteps(steps) {
        switch (this.currentFilter) {
            case 'available':
                return steps.filter(step => this.isStepAvailable(step) && this.isUserInClaimingRadius(step));
            case 'nearby':
                return steps.filter(step => step.distance <= 1.0); // Within 1km
            case 'claimed':
                return steps.filter(step => this.claimedSteps.has(step.id));
            case 'unclaimed':
                return steps.filter(step => !this.claimedSteps.has(step.id));
            default:
                return steps;
        }
    }

    sortSteps(steps) {
        switch (this.currentSort) {
            case 'name':
                return steps.sort((a, b) => a.name.localeCompare(b.name));
            case 'story':
                return steps.sort((a, b) => a.storyName.localeCompare(b.storyName));
            case 'availability':
                return steps.sort((a, b) => {
                    const aAvailable = this.isStepAvailable(a) && this.isUserInClaimingRadius(a);
                    const bAvailable = this.isStepAvailable(b) && this.isUserInClaimingRadius(b);
                    return bAvailable - aAvailable; // Available first
                });
            default: // distance
                return steps.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }
    }

    renderQuestList(steps) {
        const questListElement = document.getElementById('quest-list');
        
        if (steps.length === 0) {
            questListElement.innerHTML = `
                <div class="empty-state">
                    <h3>No quests found</h3>
                    <p>Try adjusting your filters or search criteria.</p>
                </div>
            `;
            return;
        }

        // Group steps by story
        const storyGroups = this.groupStepsByStory(steps);
        
        let html = '';
        for (const [storyName, storySteps] of storyGroups) {
            html += this.renderStoryGroup(storyName, storySteps);
        }
        
        questListElement.innerHTML = html;
        
        // Attach event listeners
        this.attachListEventListeners();
    }

    groupStepsByStory(steps) {
        const groups = new Map();
        
        steps.forEach(step => {
            if (!groups.has(step.storyName)) {
                groups.set(step.storyName, []);
            }
            groups.get(step.storyName).push(step);
        });
        
        return groups;
    }

    renderStoryGroup(storyName, steps) {
        const totalSteps = steps.length;
        const claimedSteps = steps.filter(step => this.claimedSteps.has(step.id)).length;
        const availableSteps = steps.filter(step => 
            this.isStepAvailable(step) && this.isUserInClaimingRadius(step)
        ).length;

        let questItemsHtml = '';
        steps.forEach(step => {
            questItemsHtml += this.renderQuestItem(step);
        });

        return `
            <div class="story-group">
                <div class="story-header">
                    <div class="story-title">${storyName}</div>
                    <div class="story-description">${steps[0].description || ''}</div>
                    <div class="story-stats">
                        <span>📍 ${totalSteps} steps</span>
                        <span>✅ ${claimedSteps} claimed</span>
                        <span>🔓 ${availableSteps} available</span>
                    </div>
                </div>
                <div class="quest-items">
                    ${questItemsHtml}
                </div>
            </div>
        `;
    }

    renderQuestItem(step) {
        const isClaimed = this.claimedSteps.has(step.id);
        const isAvailable = this.isStepAvailable(step);
        const isInRadius = this.isUserInClaimingRadius(step);
        const canClaim = isAvailable && isInRadius && !isClaimed;
        
        let statusClass = 'status-unavailable';
        let statusText = 'Unavailable';
        
        if (isClaimed) {
            statusClass = 'status-claimed';
            statusText = 'Claimed';
        } else if (canClaim) {
            statusClass = 'status-available';
            statusText = 'Available';
        } else if (isAvailable && !isInRadius) {
            statusClass = 'status-far';
            statusText = 'Too Far';
        }

        const distance = step.distance || 0;
        let distanceClass = 'distance-far';
        if (distance <= 0.1) distanceClass = 'distance-close';
        else if (distance <= 1.0) distanceClass = 'distance-medium';

        const timingInfo = this.getStepTimingInfo(step);
        const rewardInfo = this.getStepRewardInfo(step);

        return `
            <div class="quest-item ${isClaimed ? 'claimed' : ''}" data-step-id="${step.id}">
                <div class="quest-header">
                    <h3 class="quest-name">${step.name}</h3>
                    <div class="quest-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                
                <p class="quest-description">${step.description}</p>
                
                <div class="quest-meta">
                    <div class="meta-item">
                        <span class="meta-icon">📍</span>
                        <span class="${distanceClass}">${distance.toFixed(2)} km away</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">⭕</span>
                        <span>${step.claimingRadius}m radius</span>
                    </div>
                    ${timingInfo}
                    ${rewardInfo}
                </div>
                
                <div class="quest-actions">
                    <button class="btn-small btn-secondary quest-view-btn" data-step-id="${step.id}">
                        View Details
                    </button>
                    <button class="btn-small btn-secondary quest-map-btn" data-step-id="${step.id}">
                        Show on Map
                    </button>
                    ${canClaim ? `<button class="btn-small btn-primary quest-claim-btn" data-step-id="${step.id}">Claim</button>` : ''}
                </div>
            </div>
        `;
    }

    getStepTimingInfo(step) {
        if (!step.claimingWindow.enabled) return '';
        
        const now = new Date();
        const startDate = new Date(step.claimingWindow.startDate);
        const dueDate = new Date(step.claimingWindow.dueDate);
        
        let timingText = '';
        if (now < startDate) {
            timingText = `Available from ${startDate.toLocaleDateString()}`;
        } else if (now > dueDate) {
            timingText = `Expired on ${dueDate.toLocaleDateString()}`;
        } else {
            timingText = `Due ${dueDate.toLocaleDateString()}`;
        }
        
        return `
            <div class="meta-item">
                <span class="meta-icon">⏰</span>
                <span>${timingText}</span>
            </div>
        `;
    }

    getStepRewardInfo(step) {
        if (!step.reward.enabled) return '';
        
        if (step.reward.limited) {
            const remaining = step.reward.quantity - (step.reward.claimedCount || 0);
            return `
                <div class="meta-item">
                    <span class="meta-icon">🎁</span>
                    <span>${remaining}/${step.reward.quantity} rewards left</span>
                </div>
            `;
        }
        
        return `
            <div class="meta-item">
                <span class="meta-icon">🎁</span>
                <span>Unlimited rewards</span>
            </div>
        `;
    }

    attachListEventListeners() {
        // View details buttons
        document.querySelectorAll('.quest-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const stepId = btn.dataset.stepId;
                const step = this.allSteps.find(s => s.id === stepId);
                if (step) this.showStepCard(step);
            });
        });

        // Show on map buttons
        document.querySelectorAll('.quest-map-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const stepId = btn.dataset.stepId;
                const step = this.allSteps.find(s => s.id === stepId);
                if (step) {
                    this.toggleView(); // Switch to map view
                    this.map.setView([step.coordinates.x, step.coordinates.y], 16);
                    this.showStepCard(step);
                }
            });
        });

        // Claim buttons
        document.querySelectorAll('.quest-claim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const stepId = btn.dataset.stepId;
                const step = this.allSteps.find(s => s.id === stepId);
                if (step) {
                    this.selectedStep = step;
                    this.claimReward();
                }
            });
        });

        // Quest item click (for details)
        document.querySelectorAll('.quest-item').forEach(item => {
            item.addEventListener('click', () => {
                const stepId = item.dataset.stepId;
                const step = this.allSteps.find(s => s.id === stepId);
                if (step) this.showStepCard(step);
            });
        });
    }
}

// Initialize the discovery module when the page loads
let questDiscovery;
document.addEventListener('DOMContentLoaded', () => {
    questDiscovery = new QuestDiscovery();
    
    // Add file drop functionality for loading quest files
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const jsonFiles = files.filter(file => file.name.endsWith('.json'));
        
        jsonFiles.forEach(file => {
            questDiscovery.loadQuestFromFile(file);
        });
        
        if (jsonFiles.length > 0) {
            alert(`Loaded ${jsonFiles.length} quest file(s)!`);
        }
    });
});