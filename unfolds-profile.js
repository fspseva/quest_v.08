class UnfoldsProfile {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.createdStories = [];
        this.completedStories = [];
        this.rewards = [];
        this.achievements = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUserData();
        this.loadCreatedStories();
        this.loadCompletedStories();
        this.loadRewards();
        this.loadAchievements();
        this.updateOverview();
    }

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Profile form
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileSettings();
        });

        // Export data
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportUserData();
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show corresponding section
        document.querySelectorAll('.profile-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load data for specific sections on demand
        if (tabName === 'created') {
            this.renderCreatedStories();
        } else if (tabName === 'completed') {
            this.renderCompletedStories();
        } else if (tabName === 'rewards') {
            this.renderRewards();
        } else if (tabName === 'achievements') {
            this.renderAchievements();
        }
    }

    getCurrentUser() {
        // In a real app, this would come from authentication
        const savedUser = localStorage.getItem('unfolds_current_user');
        if (savedUser) {
            return JSON.parse(savedUser);
        }

        // Create demo user
        const demoUser = {
            id: 'user_' + Date.now(),
            email: 'demo@unfolds.app',
            username: 'demo_user',
            profile: {
                display_name: 'Demo User',
                avatar_url: null,
                bio: 'Exploring the world through UNFOLDS stories'
            },
            stats: {
                stories_created: 0,
                stories_completed: 0,
                steps_completed: 0,
                total_distance_traveled: 0,
                rewards_earned: 0
            },
            preferences: {
                notifications: {
                    geofence_alerts: true,
                    due_date_reminders: true,
                    reward_confirmations: true
                }
            },
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString()
        };

        localStorage.setItem('unfolds_current_user', JSON.stringify(demoUser));
        return demoUser;
    }

    loadUserData() {
        const user = this.currentUser;
        
        // Update UI elements
        document.getElementById('userName').textContent = user.profile.display_name || user.username;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userAvatar').textContent = (user.profile.display_name || user.username).charAt(0).toUpperCase();
        
        const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
        document.getElementById('joinDate').textContent = `Joined ${joinDate}`;

        // Load form data
        document.getElementById('displayName').value = user.profile.display_name || '';
        document.getElementById('bio').value = user.profile.bio || '';
        document.getElementById('geofenceAlerts').checked = user.preferences.notifications.geofence_alerts;
        document.getElementById('dueDateReminders').checked = user.preferences.notifications.due_date_reminders;
        document.getElementById('rewardConfirmations').checked = user.preferences.notifications.reward_confirmations;
    }

    loadCreatedStories() {
        try {
            const saved = JSON.parse(localStorage.getItem('unfolds_stories') || '[]');
            this.createdStories = saved.filter(story => story.author_id === this.currentUser.id);
            
            // Also load any stories from unfolds-database.json that belong to this user
            // In a real app, this would be an API call
            this.loadStoriesFromDatabase();
        } catch (error) {
            console.error('Error loading created stories:', error);
            this.createdStories = [];
        }
    }

    async loadStoriesFromDatabase() {
        try {
            const response = await fetch('./unfolds-database.json');
            const data = await response.json();
            
            // Filter stories by current user (for demo purposes, include all)
            const dbStories = data.unfolds || [];
            this.createdStories = [...this.createdStories, ...dbStories];
            
            this.renderCreatedStories();
        } catch (error) {
            console.error('Error loading database stories:', error);
        }
    }

    loadCompletedStories() {
        try {
            const saved = JSON.parse(localStorage.getItem('unfolds_completed_stories') || '[]');
            this.completedStories = saved.filter(story => story.user_id === this.currentUser.id);
        } catch (error) {
            console.error('Error loading completed stories:', error);
            this.completedStories = [];
        }
    }

    loadRewards() {
        try {
            const saved = JSON.parse(localStorage.getItem('unfolds_rewards') || '[]');
            this.rewards = saved.filter(reward => reward.user_id === this.currentUser.id);
        } catch (error) {
            console.error('Error loading rewards:', error);
            this.rewards = [];
        }
    }

    loadAchievements() {
        // Generate achievements based on user stats
        this.achievements = this.calculateAchievements();
    }

    calculateAchievements() {
        const achievements = [];
        const stats = this.currentUser.stats;

        // Story creation achievements
        if (stats.stories_created >= 1) {
            achievements.push({ id: 'first_story', name: '🎯 First Story', description: 'Created your first story' });
        }
        if (stats.stories_created >= 5) {
            achievements.push({ id: 'story_creator', name: '📝 Story Creator', description: 'Created 5 stories' });
        }
        if (stats.stories_created >= 10) {
            achievements.push({ id: 'story_master', name: '👑 Story Master', description: 'Created 10+ stories' });
        }

        // Completion achievements
        if (stats.stories_completed >= 1) {
            achievements.push({ id: 'first_completion', name: '✅ First Completion', description: 'Completed your first story' });
        }
        if (stats.stories_completed >= 5) {
            achievements.push({ id: 'explorer', name: '🗺️ Explorer', description: 'Completed 5 stories' });
        }
        if (stats.stories_completed >= 10) {
            achievements.push({ id: 'adventurer', name: '🏃‍♂️ Adventurer', description: 'Completed 10+ stories' });
        }

        // Distance achievements
        if (stats.total_distance_traveled >= 1000) {
            achievements.push({ id: 'walker', name: '🚶‍♂️ Walker', description: 'Traveled 1km+' });
        }
        if (stats.total_distance_traveled >= 5000) {
            achievements.push({ id: 'hiker', name: '🥾 Hiker', description: 'Traveled 5km+' });
        }
        if (stats.total_distance_traveled >= 10000) {
            achievements.push({ id: 'trekker', name: '⛰️ Trekker', description: 'Traveled 10km+' });
        }

        // Steps achievements
        if (stats.steps_completed >= 10) {
            achievements.push({ id: 'step_starter', name: '📍 Step Starter', description: 'Completed 10 steps' });
        }
        if (stats.steps_completed >= 50) {
            achievements.push({ id: 'step_master', name: '🎯 Step Master', description: 'Completed 50+ steps' });
        }

        return achievements;
    }

    updateOverview() {
        const stats = this.currentUser.stats;
        
        document.getElementById('storiesCreated').textContent = this.createdStories.length;
        document.getElementById('storiesCompleted').textContent = stats.stories_completed;
        document.getElementById('stepsCompleted').textContent = stats.steps_completed;
        document.getElementById('distanceTraveled').textContent = (stats.total_distance_traveled / 1000).toFixed(1);
        document.getElementById('rewardsEarned').textContent = this.rewards.length;

        // Update recent achievements
        const recentAchievements = this.achievements.slice(-3);
        const container = document.getElementById('recentAchievements');
        container.innerHTML = recentAchievements.map(achievement => 
            `<span class="achievement-badge">${achievement.name}</span>`
        ).join('');
    }

    renderCreatedStories() {
        const container = document.getElementById('createdStoriesContainer');
        
        if (this.createdStories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📝</div>
                    <h3>No Stories Created Yet</h3>
                    <p>Start creating your first geo-located story!</p>
                    <br>
                    <a href="unfolds-creator.html" class="btn btn-primary">➕ Create Story</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.createdStories.map(story => this.renderStoryCard(story, true)).join('');
        
        // Add event listeners
        this.bindStoryActions(container);
    }

    renderCompletedStories() {
        const container = document.getElementById('completedStoriesContainer');
        
        if (this.completedStories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">✅</div>
                    <h3>No Stories Completed Yet</h3>
                    <p>Go explore some stories to see them here!</p>
                    <br>
                    <a href="unfolds-discovery.html" class="btn btn-primary">🗺️ Discover Stories</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.completedStories.map(story => this.renderCompletedStoryCard(story)).join('');
    }

    renderRewards() {
        const container = document.getElementById('rewardsContainer');
        
        if (this.rewards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🎁</div>
                    <h3>No Rewards Yet</h3>
                    <p>Complete story steps to earn rewards!</p>
                    <br>
                    <a href="unfolds-discovery.html" class="btn btn-primary">🗺️ Find Stories</a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.rewards.map(reward => this.renderRewardCard(reward)).join('');
    }

    renderAchievements() {
        const container = document.getElementById('achievementsContainer');
        
        if (this.achievements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🏆</div>
                    <h3>No Achievements Yet</h3>
                    <p>Start creating and completing stories to unlock achievements!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                ${this.achievements.map(achievement => `
                    <div style="background: linear-gradient(135deg, #FFD700, #FFA500); color: white; padding: 15px 20px; border-radius: 15px; text-align: center; min-width: 200px;">
                        <div style="font-size: 1.5rem; margin-bottom: 5px;">${achievement.name}</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">${achievement.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderStoryCard(story, isOwned = false) {
        const statusClass = `status-${story.status || 'draft'}`;
        const statusText = story.status || 'draft';
        const createdDate = new Date(story.created_at).toLocaleDateString();
        
        return `
            <div class="story-card" data-story-id="${story.id}">
                <div class="story-header">
                    <div>
                        <div class="story-title">${story.title}</div>
                        <div class="story-meta">
                            <span>📅 ${createdDate}</span>
                            ${story.aggregated_metadata ? `<span>📍 ${story.aggregated_metadata.total_steps} steps</span>` : ''}
                            ${story.aggregated_metadata ? `<span>⏱️ ${story.aggregated_metadata.estimated_duration}min</span>` : ''}
                        </div>
                    </div>
                    <div class="story-status ${statusClass}">${statusText}</div>
                </div>
                <p style="color: #666; margin-bottom: 15px;">${story.description}</p>
                
                ${isOwned ? `
                    <div class="story-actions">
                        <button class="btn btn-primary edit-story" data-story-id="${story.id}">✏️ Edit</button>
                        <button class="btn btn-secondary share-story" data-story-id="${story.id}">🔗 Share</button>
                        ${story.status === 'published' ? `<button class="btn btn-secondary archive-story" data-story-id="${story.id}">📦 Archive</button>` : ''}
                        <button class="btn btn-danger delete-story" data-story-id="${story.id}">🗑️ Delete</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderCompletedStoryCard(story) {
        const completedDate = new Date(story.completed_at).toLocaleDateString();
        
        return `
            <div class="story-card">
                <div class="story-header">
                    <div>
                        <div class="story-title">${story.title}</div>
                        <div class="story-meta">
                            <span>✅ ${completedDate}</span>
                            <span>🎁 ${story.rewards_earned || 0} rewards</span>
                        </div>
                    </div>
                </div>
                <p style="color: #666; margin-bottom: 15px;">${story.description}</p>
                <div class="story-actions">
                    <button class="btn btn-secondary" onclick="this.shareCompletion('${story.id}')">📤 Share Achievement</button>
                </div>
            </div>
        `;
    }

    renderRewardCard(reward) {
        const issuedDate = new Date(reward.issued_at).toLocaleDateString();
        const isExpired = reward.expires_at && new Date(reward.expires_at) < new Date();
        
        return `
            <div class="reward-card ${isExpired ? 'expired' : ''}">
                <div style="font-size: 2rem; margin-bottom: 10px;">🎁</div>
                <div class="reward-code">${reward.code}</div>
                <div class="reward-story">${reward.story_title || 'Story Reward'}</div>
                <div class="reward-date">Earned: ${issuedDate}</div>
                ${reward.expires_at ? `<div class="reward-date">Expires: ${new Date(reward.expires_at).toLocaleDateString()}</div>` : ''}
                ${reward.redeem_url ? `<a href="${reward.redeem_url}" class="btn btn-primary" style="margin-top: 10px;">🔗 Redeem</a>` : ''}
                ${isExpired ? '<div style="color: #f44336; margin-top: 10px;">⚠️ Expired</div>' : ''}
            </div>
        `;
    }

    bindStoryActions(container) {
        // Edit story
        container.querySelectorAll('.edit-story').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const storyId = e.target.dataset.storyId;
                window.location.href = `unfolds-creator.html?edit=${storyId}`;
            });
        });

        // Share story
        container.querySelectorAll('.share-story').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const storyId = e.target.dataset.storyId;
                this.shareStory(storyId);
            });
        });

        // Archive story
        container.querySelectorAll('.archive-story').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const storyId = e.target.dataset.storyId;
                this.archiveStory(storyId);
            });
        });

        // Delete story
        container.querySelectorAll('.delete-story').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const storyId = e.target.dataset.storyId;
                this.deleteStory(storyId);
            });
        });
    }

    shareStory(storyId) {
        const story = this.createdStories.find(s => s.id === storyId);
        if (!story) return;

        const shareUrl = `${window.location.origin}/unfolds-discovery.html?story=${storyId}`;
        
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

    archiveStory(storyId) {
        if (!confirm('Are you sure you want to archive this story?')) return;

        const storyIndex = this.createdStories.findIndex(s => s.id === storyId);
        if (storyIndex !== -1) {
            this.createdStories[storyIndex].status = 'archived';
            this.saveStories();
            this.renderCreatedStories();
        }
    }

    deleteStory(storyId) {
        if (!confirm('Are you sure you want to delete this story? This action cannot be undone.')) return;

        this.createdStories = this.createdStories.filter(s => s.id !== storyId);
        this.saveStories();
        this.renderCreatedStories();
        this.updateOverview();
    }

    saveStories() {
        const allStories = JSON.parse(localStorage.getItem('unfolds_stories') || '[]');
        const otherUserStories = allStories.filter(s => s.author_id !== this.currentUser.id);
        const updatedStories = [...otherUserStories, ...this.createdStories];
        localStorage.setItem('unfolds_stories', JSON.stringify(updatedStories));
    }

    saveProfileSettings() {
        const formData = new FormData(document.getElementById('profileForm'));
        
        // Update user profile
        this.currentUser.profile.display_name = formData.get('displayName');
        this.currentUser.profile.bio = formData.get('bio');
        this.currentUser.preferences.notifications.geofence_alerts = formData.get('geofenceAlerts') === 'on';
        this.currentUser.preferences.notifications.due_date_reminders = formData.get('dueDateReminders') === 'on';
        this.currentUser.preferences.notifications.reward_confirmations = formData.get('rewardConfirmations') === 'on';
        
        // Save to localStorage
        localStorage.setItem('unfolds_current_user', JSON.stringify(this.currentUser));
        
        // Update UI
        this.loadUserData();
        
        alert('Profile settings saved successfully!');
    }

    exportUserData() {
        const exportData = {
            user: this.currentUser,
            created_stories: this.createdStories,
            completed_stories: this.completedStories,
            rewards: this.rewards,
            achievements: this.achievements,
            exported_at: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `unfolds_data_${this.currentUser.username}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Method to add a completed story (called from other modules)
    addCompletedStory(storyData) {
        const completedStory = {
            ...storyData,
            user_id: this.currentUser.id,
            completed_at: new Date().toISOString(),
            rewards_earned: storyData.rewards_earned || 0
        };

        this.completedStories.push(completedStory);
        
        // Update user stats
        this.currentUser.stats.stories_completed++;
        this.currentUser.stats.steps_completed += storyData.steps_completed || 0;
        this.currentUser.stats.total_distance_traveled += storyData.distance_traveled || 0;
        
        // Save updates
        localStorage.setItem('unfolds_completed_stories', JSON.stringify([...JSON.parse(localStorage.getItem('unfolds_completed_stories') || '[]'), completedStory]));
        localStorage.setItem('unfolds_current_user', JSON.stringify(this.currentUser));
        
        // Refresh achievements
        this.loadAchievements();
    }

    // Method to add a reward (called when rewards are earned)
    addReward(rewardData) {
        const reward = {
            ...rewardData,
            user_id: this.currentUser.id,
            issued_at: new Date().toISOString()
        };

        this.rewards.push(reward);
        
        // Update user stats
        this.currentUser.stats.rewards_earned++;
        
        // Save updates
        localStorage.setItem('unfolds_rewards', JSON.stringify([...JSON.parse(localStorage.getItem('unfolds_rewards') || '[]'), reward]));
        localStorage.setItem('unfolds_current_user', JSON.stringify(this.currentUser));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.unfoldsProfile = new UnfoldsProfile();
});