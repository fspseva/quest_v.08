class UnfoldsModeration {
    constructor() {
        this.stories = [];
        this.currentFilter = 'pending';
        this.currentStory = null;
        this.currentAction = null;
        this.maps = {};
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStories();
        this.updateStats();
    }

    bindEvents() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderStories();
            });
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('reviewModal').addEventListener('click', (e) => {
            if (e.target.id === 'reviewModal') {
                this.closeModal();
            }
        });

        document.getElementById('cancelAction').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('confirmAction').addEventListener('click', () => {
            this.executeAction();
        });
    }

    async loadStories() {
        try {
            const sources = [
                this.loadFromLocalStorage(),
                this.loadFromDatabase()
            ];

            const results = await Promise.all(sources);
            this.stories = results.flat().filter(story => story !== null);

            // Add moderation metadata to stories that don't have it
            this.stories = this.stories.map(story => this.enrichStoryForModeration(story));

            this.renderStories();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading stories:', error);
            this.showErrorState();
        }
    }

    loadFromLocalStorage() {
        try {
            const saved = JSON.parse(localStorage.getItem('unfolds_stories') || '[]');
            return saved;
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

    enrichStoryForModeration(story) {
        // Add moderation metadata if missing
        if (!story.moderation) {
            story.moderation = {
                submitted_at: story.created_at || new Date().toISOString(),
                priority: this.calculatePriority(story),
                flags: [],
                review_history: []
            };
        }

        // Ensure status is set
        if (!story.status) {
            story.status = 'draft';
        }

        return story;
    }

    calculatePriority(story) {
        // Calculate priority based on various factors
        let score = 0;
        
        // Public stories get higher priority
        if (story.availability === 'public') score += 3;
        
        // Stories with more steps get higher priority
        const stepCount = story.steps ? story.steps.length : 0;
        if (stepCount > 5) score += 2;
        else if (stepCount > 2) score += 1;
        
        // Recent submissions get higher priority
        const submittedDate = new Date(story.moderation?.submitted_at || story.created_at);
        const hoursSinceSubmission = (new Date() - submittedDate) / (1000 * 60 * 60);
        if (hoursSinceSubmission < 24) score += 2;
        else if (hoursSinceSubmission < 72) score += 1;

        // Determine priority level
        if (score >= 5) return 'high';
        if (score >= 3) return 'medium';
        return 'low';
    }

    getFilteredStories() {
        switch (this.currentFilter) {
            case 'pending':
                return this.stories.filter(story => story.status === 'pending');
            case 'approved':
                return this.stories.filter(story => story.status === 'published' || story.status === 'approved');
            case 'rejected':
                return this.stories.filter(story => story.status === 'rejected');
            default:
                return this.stories;
        }
    }

    renderStories() {
        const container = document.getElementById('storiesContainer');
        const filteredStories = this.getFilteredStories();
        
        if (filteredStories.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = filteredStories.map(story => this.renderStoryCard(story)).join('');
        
        // Bind action events
        this.bindStoryActions();
        
        // Initialize maps after a short delay
        setTimeout(() => {
            this.initializeMaps();
        }, 100);
    }

    renderStoryCard(story) {
        const submittedDate = new Date(story.moderation?.submitted_at || story.created_at).toLocaleDateString();
        const authorName = story.author_name || `User ${story.author_id?.substring(0, 8) || 'Unknown'}`;
        const priority = story.moderation?.priority || 'low';
        const stepCount = story.steps ? story.steps.length : 0;
        const difficulty = story.aggregated_metadata?.difficulty || 'easy';
        
        return `
            <div class="story-review-card" data-story-id="${story.id}">
                <div class="story-header">
                    <div class="story-info">
                        <h3>${story.title}</h3>
                        <div class="story-meta">
                            <span>👤 ${authorName}</span>
                            <span>📅 ${submittedDate}</span>
                            <span>📍 ${stepCount} steps</span>
                            <span>⚡ ${difficulty}</span>
                            <span>🌍 ${story.availability}</span>
                        </div>
                    </div>
                    <div class="priority-badge priority-${priority}">
                        ${priority} priority
                    </div>
                </div>

                <div class="story-content">
                    <div class="story-description">
                        ${story.description}
                    </div>

                    ${stepCount > 0 ? `
                        <div class="steps-preview">
                            <h4>Steps Preview:</h4>
                            ${story.steps.slice(0, 3).map((step, index) => `
                                <div class="step-item">
                                    <div class="step-number">${index + 1}</div>
                                    <div class="step-details">
                                        <div class="step-name">${step.name}</div>
                                        <div class="step-location">${step.geo.lat.toFixed(6)}, ${step.geo.lng.toFixed(6)} • ${step.claim_radius}m radius</div>
                                    </div>
                                </div>
                            `).join('')}
                            ${stepCount > 3 ? `<div style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 10px;">... and ${stepCount - 3} more steps</div>` : ''}
                        </div>
                        
                        <div class="map-preview" data-story-id="${story.id}"></div>
                    ` : ''}
                </div>

                ${this.currentFilter === 'pending' ? `
                    <div class="moderation-actions">
                        <button class="btn btn-preview" onclick="moderation.previewStory('${story.id}')">
                            👁️ Preview
                        </button>
                        <button class="btn btn-approve" onclick="moderation.reviewStory('${story.id}', 'approve')">
                            ✅ Approve
                        </button>
                        <button class="btn btn-adjust" onclick="moderation.reviewStory('${story.id}', 'adjust')">
                            ✏️ Request Changes
                        </button>
                        <button class="btn btn-reject" onclick="moderation.reviewStory('${story.id}', 'reject')">
                            ❌ Reject
                        </button>
                    </div>
                ` : `
                    <div class="moderation-actions">
                        <button class="btn btn-preview" onclick="moderation.previewStory('${story.id}')">
                            👁️ View Details
                        </button>
                        ${story.status !== 'published' ? `
                            <button class="btn btn-approve" onclick="moderation.reviewStory('${story.id}', 'approve')">
                                🔄 Reapprove
                            </button>
                        ` : ''}
                    </div>
                `}
            </div>
        `;
    }

    renderEmptyState() {
        const messages = {
            pending: {
                icon: '📋',
                title: 'No Stories Pending Review',
                subtitle: 'All caught up! Check back later for new submissions.'
            },
            approved: {
                icon: '✅',
                title: 'No Recently Approved Stories',
                subtitle: 'Stories you approve will appear here.'
            },
            rejected: {
                icon: '❌',
                title: 'No Recently Rejected Stories',
                subtitle: 'Stories you reject will appear here.'
            },
            all: {
                icon: '📊',
                title: 'No Stories Found',
                subtitle: 'No stories available for moderation.'
            }
        };

        const msg = messages[this.currentFilter] || messages.all;
        
        return `
            <div class="empty-state">
                <div class="icon">${msg.icon}</div>
                <h3>${msg.title}</h3>
                <p>${msg.subtitle}</p>
            </div>
        `;
    }

    bindStoryActions() {
        // Actions are bound via onclick in the template for simplicity
        // In a production app, you'd use proper event delegation
    }

    initializeMaps() {
        document.querySelectorAll('.map-preview').forEach(mapContainer => {
            const storyId = mapContainer.dataset.storyId;
            const story = this.stories.find(s => s.id === storyId);
            
            if (story && story.steps && story.steps.length > 0 && !this.maps[storyId]) {
                this.initializeStoryMap(mapContainer, story);
            }
        });
    }

    initializeStoryMap(container, story) {
        const firstStep = story.steps[0];
        const map = L.map(container, {
            scrollWheelZoom: false,
            dragging: false,
            touchZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            zoomControl: false
        }).setView([firstStep.geo.lat, firstStep.geo.lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add markers for all steps
        story.steps.forEach((step, index) => {
            const marker = L.marker([step.geo.lat, step.geo.lng]).addTo(map);
            marker.bindPopup(`
                <strong>Step ${index + 1}: ${step.name}</strong><br>
                ${step.description}<br>
                <small>Radius: ${step.claim_radius}m</small>
            `);

            // Add claiming radius circle
            L.circle([step.geo.lat, step.geo.lng], {
                color: '#FFD700',
                fillColor: '#FFD700',
                fillOpacity: 0.1,
                radius: step.claim_radius
            }).addTo(map);
        });

        // Fit map to show all steps
        if (story.steps.length > 1) {
            const group = new L.featureGroup(story.steps.map(step => 
                L.marker([step.geo.lat, step.geo.lng])
            ));
            map.fitBounds(group.getBounds().pad(0.1));
        }

        this.maps[story.id] = map;
    }

    previewStory(storyId) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        // Open preview in new window/tab
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <html>
                <head>
                    <title>Preview: ${story.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                        .story-header { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                        .step { background: #fff; border: 2px solid #e9ecef; padding: 15px; margin: 10px 0; border-radius: 8px; }
                        .meta { color: #666; font-size: 0.9rem; margin-bottom: 10px; }
                        .coordinates { font-family: monospace; background: #f8f9fa; padding: 5px; border-radius: 3px; }
                    </style>
                </head>
                <body>
                    <div class="story-header">
                        <h1>${story.title}</h1>
                        <div class="meta">
                            <strong>Author:</strong> ${story.author_name || 'Unknown'} | 
                            <strong>Submitted:</strong> ${new Date(story.moderation?.submitted_at || story.created_at).toLocaleDateString()} |
                            <strong>Availability:</strong> ${story.availability} |
                            <strong>Status:</strong> ${story.status}
                        </div>
                        <p><strong>Description:</strong> ${story.description}</p>
                    </div>
                    
                    <h2>Steps (${story.steps ? story.steps.length : 0})</h2>
                    ${story.steps ? story.steps.map((step, index) => `
                        <div class="step">
                            <h3>Step ${index + 1}: ${step.name}</h3>
                            <p>${step.description}</p>
                            <div class="coordinates">
                                📍 ${step.geo.lat.toFixed(6)}, ${step.geo.lng.toFixed(6)} 
                                (${step.claim_radius}m radius)
                            </div>
                            ${step.step_reward?.enabled ? `
                                <p><strong>Reward:</strong> ${step.step_reward.coupon_prefix || 'Enabled'}</p>
                            ` : ''}
                            ${step.time_window?.start_at || step.time_window?.due_at ? `
                                <p><strong>Time Window:</strong> 
                                ${step.time_window.start_at ? new Date(step.time_window.start_at).toLocaleDateString() : 'No start'} - 
                                ${step.time_window.due_at ? new Date(step.time_window.due_at).toLocaleDateString() : 'No end'}
                                </p>
                            ` : ''}
                        </div>
                    `).join('') : '<p>No steps defined</p>'}
                    
                    ${story.story_reward?.enabled ? `
                        <div class="story-header">
                            <h3>Story Completion Reward</h3>
                            <p>Reward Type: ${story.story_reward.reward_type || 'coupon'}</p>
                            <p>Coupon Prefix: ${story.story_reward.coupon_prefix || 'Generated'}</p>
                        </div>
                    ` : ''}
                </body>
            </html>
        `);
    }

    reviewStory(storyId, action) {
        const story = this.stories.find(s => s.id === storyId);
        if (!story) return;

        this.currentStory = story;
        this.currentAction = action;

        const modal = document.getElementById('reviewModal');
        const modalTitle = document.getElementById('modalTitle');
        const adjustmentOptions = document.getElementById('adjustmentOptions');
        const confirmBtn = document.getElementById('confirmAction');

        // Configure modal based on action
        switch (action) {
            case 'approve':
                modalTitle.textContent = `Approve: ${story.title}`;
                adjustmentOptions.style.display = 'none';
                confirmBtn.textContent = '✅ Approve Story';
                confirmBtn.className = 'btn btn-approve';
                break;
            case 'reject':
                modalTitle.textContent = `Reject: ${story.title}`;
                adjustmentOptions.style.display = 'none';
                confirmBtn.textContent = '❌ Reject Story';
                confirmBtn.className = 'btn btn-reject';
                break;
            case 'adjust':
                modalTitle.textContent = `Request Changes: ${story.title}`;
                adjustmentOptions.style.display = 'block';
                confirmBtn.textContent = '✏️ Request Changes';
                confirmBtn.className = 'btn btn-adjust';
                break;
        }

        // Clear previous notes
        document.getElementById('reviewNotes').value = '';
        
        // Clear checkboxes
        document.querySelectorAll('#adjustmentOptions input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('reviewModal').classList.remove('show');
        this.currentStory = null;
        this.currentAction = null;
    }

    executeAction() {
        if (!this.currentStory || !this.currentAction) return;

        const reviewNotes = document.getElementById('reviewNotes').value.trim();
        const adjustments = this.currentAction === 'adjust' ? this.getSelectedAdjustments() : [];

        // Create review record
        const review = {
            id: 'review_' + Date.now(),
            story_id: this.currentStory.id,
            action: this.currentAction,
            notes: reviewNotes,
            adjustments: adjustments,
            reviewer_id: 'current_moderator', // In real app, would be from auth
            reviewed_at: new Date().toISOString()
        };

        // Update story status
        switch (this.currentAction) {
            case 'approve':
                this.currentStory.status = 'published';
                break;
            case 'reject':
                this.currentStory.status = 'rejected';
                break;
            case 'adjust':
                this.currentStory.status = 'pending'; // Remains pending until author addresses
                break;
        }

        // Add review to story's moderation history
        if (!this.currentStory.moderation.review_history) {
            this.currentStory.moderation.review_history = [];
        }
        this.currentStory.moderation.review_history.push(review);

        // Save changes
        this.saveStories();
        
        // Show notification
        this.showNotification(`Story "${this.currentStory.title}" has been ${this.currentAction}d successfully!`);
        
        // Close modal and refresh
        this.closeModal();
        this.renderStories();
        this.updateStats();
    }

    getSelectedAdjustments() {
        const checkboxes = document.querySelectorAll('#adjustmentOptions input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    saveStories() {
        // In a real app, this would send to server
        // For demo, update localStorage
        const localStories = JSON.parse(localStorage.getItem('unfolds_stories') || '[]');
        const otherStories = localStories.filter(s => s.id !== this.currentStory.id);
        const updatedStories = [...otherStories, this.currentStory];
        localStorage.setItem('unfolds_stories', JSON.stringify(updatedStories));
    }

    updateStats() {
        const today = new Date().toDateString();
        const pendingCount = this.stories.filter(s => s.status === 'pending').length;
        
        const approvedToday = this.stories.filter(s => {
            const lastReview = s.moderation?.review_history?.slice(-1)[0];
            return lastReview && 
                   lastReview.action === 'approve' && 
                   new Date(lastReview.reviewed_at).toDateString() === today;
        }).length;

        const rejectedToday = this.stories.filter(s => {
            const lastReview = s.moderation?.review_history?.slice(-1)[0];
            return lastReview && 
                   lastReview.action === 'reject' && 
                   new Date(lastReview.reviewed_at).toDateString() === today;
        }).length;

        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('approvedToday').textContent = approvedToday;
        document.getElementById('rejectedToday').textContent = rejectedToday;
        document.getElementById('avgReviewTime').textContent = '5'; // Mock data
    }

    showNotification(message) {
        const banner = document.getElementById('notificationBanner');
        const text = document.getElementById('notificationText');
        
        text.textContent = message;
        banner.classList.add('show');
        
        setTimeout(() => {
            banner.classList.remove('show');
        }, 5000);
    }

    showErrorState() {
        const container = document.getElementById('storiesContainer');
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">❌</div>
                <h3>Error Loading Stories</h3>
                <p>Unable to load stories for moderation. Please refresh the page.</p>
            </div>
        `;
    }

    // Method to simulate adding a story for review (for testing)
    addTestStory() {
        const testStory = {
            id: 'test_' + Date.now(),
            title: 'Test Story for Review',
            description: 'This is a test story submitted for moderation review.',
            availability: 'public',
            status: 'pending',
            author_id: 'test_user',
            author_name: 'Test User',
            steps: [
                {
                    id: 'step1',
                    name: 'Test Step',
                    description: 'A test step description',
                    geo: { lat: 38.7223, lng: -9.1393 },
                    claim_radius: 25,
                    step_reward: { enabled: true, coupon_prefix: 'TESTREWARD' }
                }
            ],
            story_reward: {
                enabled: true,
                reward_type: 'coupon',
                coupon_prefix: 'TESTSTORY'
            },
            created_at: new Date().toISOString(),
            moderation: {
                submitted_at: new Date().toISOString(),
                priority: 'high',
                flags: [],
                review_history: []
            }
        };

        this.stories.unshift(testStory);
        this.renderStories();
        this.updateStats();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.moderation = new UnfoldsModeration();
    
    // Add test button for demo purposes (remove in production)
    const header = document.querySelector('.header');
    const testBtn = document.createElement('button');
    testBtn.textContent = '➕ Add Test Story';
    testBtn.className = 'btn btn-primary';
    testBtn.style.marginTop = '20px';
    testBtn.onclick = () => window.moderation.addTestStory();
    header.appendChild(testBtn);
});