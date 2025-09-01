class UnfoldsCreator {
    constructor() {
        this.steps = [];
        this.maps = [];
        this.currentAvailability = 'public';
        this.currentPrivacyType = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.addInitialStep();
    }

    bindEvents() {
        // Availability selection
        document.querySelectorAll('.availability-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectAvailability(e));
        });

        // Privacy type selection
        document.querySelectorAll('.privacy-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectPrivacyType(e));
        });

        // Group access method
        document.getElementById('groupAccessMethod').addEventListener('change', (e) => {
            this.toggleWhitelistUpload(e.target.value);
        });

        // Upload area
        const uploadArea = document.getElementById('whitelistUpload');
        const fileInput = document.getElementById('csvFile');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Add step button
        document.getElementById('addStepBtn').addEventListener('click', () => this.addStep());

        // Form actions
        document.getElementById('previewBtn').addEventListener('click', () => this.previewStory());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveStory('draft'));
        document.getElementById('publishBtn').addEventListener('click', () => this.publishStory());
    }

    selectAvailability(e) {
        document.querySelectorAll('.availability-card').forEach(card => {
            card.classList.remove('selected');
        });
        e.currentTarget.classList.add('selected');
        
        this.currentAvailability = e.currentTarget.dataset.value;
        
        const privateOptions = document.getElementById('privateOptions');
        if (this.currentAvailability === 'private') {
            privateOptions.classList.add('show');
        } else {
            privateOptions.classList.remove('show');
        }
    }

    selectPrivacyType(e) {
        document.querySelectorAll('.privacy-card').forEach(card => {
            card.classList.remove('selected');
        });
        e.currentTarget.classList.add('selected');
        
        this.currentPrivacyType = e.currentTarget.dataset.value;
        
        const groupAccess = document.getElementById('groupAccess');
        if (this.currentPrivacyType === 'restricted_group') {
            groupAccess.classList.add('show');
        } else {
            groupAccess.classList.remove('show');
        }
    }

    toggleWhitelistUpload(method) {
        const uploadDiv = document.getElementById('whitelistUpload');
        if (method === 'whitelist') {
            uploadDiv.style.display = 'block';
        } else {
            uploadDiv.style.display = 'none';
        }
    }

    handleFileUpload(file) {
        if (file && file.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const csv = e.target.result;
                const emails = csv.split('\\n').filter(email => email.trim()).map(email => email.trim());
                console.log('Uploaded emails:', emails);
                // Store emails for later use
                this.whitelistEmails = emails;
            };
            reader.readAsText(file);
        }
    }

    addInitialStep() {
        this.addStep();
    }

    addStep() {
        const stepCount = this.steps.length + 1;
        const template = document.getElementById('stepTemplate');
        const stepElement = template.content.cloneNode(true);
        
        // Update step numbers
        stepElement.querySelector('.step-number').textContent = stepCount;
        stepElement.querySelector('.step-num').textContent = stepCount;
        
        // Add unique IDs
        const stepId = `step-${stepCount}`;
        stepElement.querySelector('.step-card').dataset.stepId = stepId;
        
        // Bind step-specific events
        this.bindStepEvents(stepElement, stepId);
        
        // Add to container
        document.getElementById('stepsContainer').appendChild(stepElement);
        
        // Initialize map
        setTimeout(() => {
            this.initStepMap(stepId);
        }, 100);
        
        this.steps.push(stepId);
    }

    bindStepEvents(stepElement, stepId) {
        // Remove step button
        stepElement.querySelector('.remove-step').addEventListener('click', () => {
            if (this.steps.length > 1) {
                this.removeStep(stepId);
            } else {
                alert('At least one step is required');
            }
        });

        // Use current location
        stepElement.querySelector('.use-current-location').addEventListener('click', () => {
            this.useCurrentLocation(stepId);
        });

        // Claiming window toggle
        stepElement.querySelector('.claiming-window-enabled').addEventListener('change', (e) => {
            const section = stepElement.querySelector('.claiming-window-section');
            section.style.display = e.target.checked ? 'block' : 'none';
        });

        // Step reward toggle
        stepElement.querySelector('.step-reward-enabled').addEventListener('change', (e) => {
            const section = stepElement.querySelector('.step-reward-section');
            section.style.display = e.target.checked ? 'block' : 'none';
        });

        // Limited rewards toggle
        stepElement.querySelector('.step-reward-limited').addEventListener('change', (e) => {
            const section = stepElement.querySelector('.limited-section');
            section.style.display = e.target.checked ? 'block' : 'none';
        });

        // Coordinate changes update map
        const latInput = stepElement.querySelector('.step-lat');
        const lngInput = stepElement.querySelector('.step-lng');
        
        latInput.addEventListener('input', () => this.updateStepMap(stepId));
        lngInput.addEventListener('input', () => this.updateStepMap(stepId));
    }

    removeStep(stepId) {
        const stepCard = document.querySelector(`[data-step-id="${stepId}"]`);
        if (stepCard) {
            stepCard.remove();
        }
        
        this.steps = this.steps.filter(id => id !== stepId);
        
        // Update step numbers
        this.updateStepNumbers();
    }

    updateStepNumbers() {
        const stepCards = document.querySelectorAll('.step-card');
        stepCards.forEach((card, index) => {
            const stepNum = index + 1;
            card.querySelector('.step-number').textContent = stepNum;
            card.querySelector('.step-num').textContent = stepNum;
        });
    }

    initStepMap(stepId) {
        const stepCard = document.querySelector(`[data-step-id="${stepId}"]`);
        const mapContainer = stepCard.querySelector('.map-container');
        
        const map = L.map(mapContainer).setView([38.7223, -9.1393], 13); // Default to Lisbon
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        const marker = L.marker([38.7223, -9.1393]).addTo(map);
        
        this.maps[stepId] = { map, marker };
        
        // Add click handler to update coordinates
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            stepCard.querySelector('.step-lat').value = lat.toFixed(6);
            stepCard.querySelector('.step-lng').value = lng.toFixed(6);
            marker.setLatLng([lat, lng]);
        });
    }

    updateStepMap(stepId) {
        const stepCard = document.querySelector(`[data-step-id="${stepId}"]`);
        const lat = parseFloat(stepCard.querySelector('.step-lat').value);
        const lng = parseFloat(stepCard.querySelector('.step-lng').value);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        const mapData = this.maps[stepId];
        if (mapData) {
            mapData.map.setView([lat, lng], 15);
            mapData.marker.setLatLng([lat, lng]);
        }
    }

    useCurrentLocation(stepId) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                const stepCard = document.querySelector(`[data-step-id="${stepId}"]`);
                stepCard.querySelector('.step-lat').value = lat.toFixed(6);
                stepCard.querySelector('.step-lng').value = lng.toFixed(6);
                
                this.updateStepMap(stepId);
            }, (error) => {
                alert('Unable to get your location. Please enter coordinates manually.');
            });
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    validateForm() {
        let isValid = true;
        
        // Clear previous errors
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error');
        });
        
        // Validate story name
        const storyName = document.getElementById('storyName').value.trim();
        if (!storyName) {
            document.getElementById('storyName').closest('.form-group').classList.add('error');
            isValid = false;
        }
        
        // Validate story description
        const storyDescription = document.getElementById('storyDescription').value.trim();
        if (!storyDescription) {
            document.getElementById('storyDescription').closest('.form-group').classList.add('error');
            isValid = false;
        }
        
        // Validate availability selection
        if (!this.currentAvailability) {
            alert('Please select an availability option');
            isValid = false;
        }
        
        // Validate steps
        const stepCards = document.querySelectorAll('.step-card');
        stepCards.forEach(card => {
            const stepName = card.querySelector('.step-name').value.trim();
            const stepDescription = card.querySelector('.step-description').value.trim();
            const stepLat = card.querySelector('.step-lat').value;
            const stepLng = card.querySelector('.step-lng').value;
            
            if (!stepName) {
                card.querySelector('.step-name').closest('.form-group').classList.add('error');
                isValid = false;
            }
            
            if (!stepDescription) {
                card.querySelector('.step-description').closest('.form-group').classList.add('error');
                isValid = false;
            }
            
            if (!stepLat || !stepLng) {
                card.querySelector('.step-lat').closest('.form-group').classList.add('error');
                isValid = false;
            }
        });
        
        return isValid;
    }

    collectFormData() {
        const formData = {
            id: this.generateId('uf'),
            title: document.getElementById('storyName').value.trim(),
            description: document.getElementById('storyDescription').value.trim(),
            availability: this.currentAvailability,
            status: 'draft',
            author_id: 'current_user', // This would come from authentication
            access_policy: this.buildAccessPolicy(),
            story_reward: {
                enabled: document.getElementById('storyReward').checked,
                reward_type: 'coupon',
                coupon_prefix: this.generateCouponPrefix(document.getElementById('storyName').value.trim()),
                expiration_hours: null
            },
            steps: this.collectStepsData(),
            created_at: new Date().toISOString()
        };
        
        // Calculate aggregated metadata
        formData.aggregated_metadata = this.calculateMetadata(formData.steps);
        
        return formData;
    }

    buildAccessPolicy() {
        if (this.currentAvailability === 'public') {
            return {
                id: 'ap_public_default',
                type: 'public',
                configuration: {}
            };
        } else if (this.currentPrivacyType === 'link_qr') {
            return {
                id: this.generateId('ap'),
                type: 'link_qr_unlisted',
                configuration: {}
            };
        } else if (this.currentPrivacyType === 'restricted_group') {
            const method = document.getElementById('groupAccessMethod').value;
            return {
                id: this.generateId('ap'),
                type: 'restricted_group',
                configuration: {
                    method: method,
                    whitelist: method === 'whitelist' ? this.whitelistEmails : null,
                    credential_type: method !== 'whitelist' ? method : null
                }
            };
        }
    }

    collectStepsData() {
        const steps = [];
        const stepCards = document.querySelectorAll('.step-card');
        
        stepCards.forEach((card, index) => {
            const claimingWindowEnabled = card.querySelector('.claiming-window-enabled').checked;
            const stepRewardEnabled = card.querySelector('.step-reward-enabled').checked;
            const stepRewardLimited = card.querySelector('.step-reward-limited').checked;
            
            const stepData = {
                id: this.generateId('st'),
                unfold_id: '', // Will be set when saving
                step_order: index + 1,
                name: card.querySelector('.step-name').value.trim(),
                description: card.querySelector('.step-description').value.trim(),
                geo: {
                    lat: parseFloat(card.querySelector('.step-lat').value),
                    lng: parseFloat(card.querySelector('.step-lng').value)
                },
                claim_radius: parseInt(card.querySelector('.step-radius').value),
                time_window: {
                    start_at: claimingWindowEnabled ? card.querySelector('.step-start-date').value || null : null,
                    due_at: claimingWindowEnabled ? card.querySelector('.step-due-date').value || null : null
                },
                step_reward: {
                    enabled: stepRewardEnabled,
                    limited: stepRewardLimited,
                    quantity: stepRewardLimited ? parseInt(card.querySelector('.step-reward-quantity').value) : null,
                    remaining: stepRewardLimited ? parseInt(card.querySelector('.step-reward-quantity').value) : null,
                    coupon_prefix: stepRewardEnabled ? this.generateCouponPrefix(card.querySelector('.step-name').value.trim()) : null,
                    expiration_hours: null
                },
                created_at: new Date().toISOString()
            };
            
            steps.push(stepData);
        });
        
        return steps;
    }

    calculateMetadata(steps) {
        // Calculate total distance between consecutive steps
        let totalDistance = 0;
        for (let i = 1; i < steps.length; i++) {
            const prev = steps[i-1];
            const curr = steps[i];
            totalDistance += this.calculateDistance(
                prev.geo.lat, prev.geo.lng,
                curr.geo.lat, curr.geo.lng
            );
        }
        
        // Estimate duration (5 minutes per step + walking time)
        const estimatedDuration = steps.length * 5 + Math.floor(totalDistance / 80); // ~5km/h walking speed
        
        // Determine difficulty based on distance and steps
        let difficulty = 'easy';
        if (steps.length > 5 || totalDistance > 2000) difficulty = 'medium';
        if (steps.length > 10 || totalDistance > 5000) difficulty = 'hard';
        if (steps.length > 15 || totalDistance > 10000) difficulty = 'epic';
        
        return {
            estimated_duration: estimatedDuration,
            difficulty: difficulty,
            total_steps: steps.length,
            completion_count: 0,
            rating: 0,
            total_distance: Math.round(totalDistance)
        };
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

    generateId(prefix) {
        return prefix + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateCouponPrefix(name) {
        return name.toUpperCase().replace(/[^A-Z0-9]/g, '').substr(0, 10);
    }

    previewStory() {
        if (!this.validateForm()) {
            alert('Please fix the validation errors before previewing.');
            return;
        }
        
        const data = this.collectFormData();
        console.log('Preview data:', data);
        
        // Open preview in new window/tab
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <html>
                <head>
                    <title>Preview: ${data.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .preview-container { max-width: 800px; margin: 0 auto; }
                        .step { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <div class="preview-container">
                        <h1>${data.title}</h1>
                        <p><strong>Description:</strong> ${data.description}</p>
                        <p><strong>Availability:</strong> ${data.availability}</p>
                        <p><strong>Difficulty:</strong> ${data.aggregated_metadata.difficulty}</p>
                        <p><strong>Estimated Duration:</strong> ${data.aggregated_metadata.estimated_duration} minutes</p>
                        <p><strong>Total Distance:</strong> ${data.aggregated_metadata.total_distance}m</p>
                        
                        <h2>Steps (${data.steps.length})</h2>
                        ${data.steps.map(step => `
                            <div class="step">
                                <h3>${step.name}</h3>
                                <p>${step.description}</p>
                                <p><strong>Location:</strong> ${step.geo.lat.toFixed(6)}, ${step.geo.lng.toFixed(6)}</p>
                                <p><strong>Claiming Radius:</strong> ${step.claim_radius}m</p>
                                ${step.step_reward.enabled ? `<p><strong>Reward:</strong> ${step.step_reward.coupon_prefix}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </body>
            </html>
        `);
    }

    saveStory(status = 'draft') {
        if (!this.validateForm()) {
            alert('Please fix the validation errors before saving.');
            return;
        }
        
        const data = this.collectFormData();
        data.status = status;
        
        // Update steps with unfold_id
        data.steps.forEach(step => {
            step.unfold_id = data.id;
        });
        
        // Save to localStorage for now (in real app, would send to server)
        const saved = JSON.parse(localStorage.getItem('unfolds_stories') || '[]');
        saved.push(data);
        localStorage.setItem('unfolds_stories', JSON.stringify(saved));
        
        alert(`Story "${data.title}" saved as ${status}!`);
        console.log('Saved story:', data);
    }

    publishStory() {
        if (!this.validateForm()) {
            alert('Please fix the validation errors before publishing.');
            return;
        }
        
        const data = this.collectFormData();
        
        if (data.availability === 'public') {
            data.status = 'pending'; // Needs moderation
            this.saveStory('pending');
            alert('Story submitted for moderation review. It will appear on the public map after approval.');
        } else {
            data.status = 'published'; // Private stories can be published directly
            this.saveStory('published');
            alert('Private story published! Share the link with your intended audience.');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UnfoldsCreator();
});