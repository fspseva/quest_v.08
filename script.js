class QuestCreator {
    constructor() {
        this.stepCounter = 0;
        this.steps = [];
        this.initializeEventListeners();
        this.addInitialStep();
    }

    initializeEventListeners() {
        const addStepBtn = document.getElementById('add-step-btn');
        const saveQuestBtn = document.getElementById('save-quest-btn');
        const previewQuestBtn = document.getElementById('preview-quest-btn');

        addStepBtn.addEventListener('click', () => this.addStep());
        saveQuestBtn.addEventListener('click', () => this.saveQuest());
        previewQuestBtn.addEventListener('click', () => this.previewQuest());
    }

    addInitialStep() {
        this.addStep();
    }

    addStep() {
        this.stepCounter++;
        const stepId = `step-${this.stepCounter}`;
        
        const stepHtml = this.createStepHtml(stepId, this.stepCounter);
        const stepsContainer = document.getElementById('steps-container');
        
        const stepElement = document.createElement('div');
        stepElement.innerHTML = stepHtml;
        stepsContainer.appendChild(stepElement.firstElementChild);
        
        this.attachStepEventListeners(stepId);
    }

    createStepHtml(stepId, stepNumber) {
        return `
            <div class="step-card" id="${stepId}">
                <div class="step-header">
                    <h3 class="step-title">Step ${stepNumber}</h3>
                    <button type="button" class="step-remove" onclick="questCreator.removeStep('${stepId}')">Remove</button>
                </div>
                
                <div class="form-group">
                    <label for="${stepId}-name">Step Name</label>
                    <input type="text" id="${stepId}-name" name="${stepId}-name" required>
                </div>
                
                <div class="form-group">
                    <label for="${stepId}-description">Step Description</label>
                    <textarea id="${stepId}-description" name="${stepId}-description" rows="3" required></textarea>
                </div>
                
                <div class="form-group">
                    <label>GPS Coordinates</label>
                    <div class="coordinates-group">
                        <input type="number" id="${stepId}-x" placeholder="Latitude (X)" step="any" required>
                        <input type="number" id="${stepId}-y" placeholder="Longitude (Y)" step="any" required>
                        <button type="button" class="location-btn" onclick="questCreator.getCurrentLocation('${stepId}')">
                            Use Current Location
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="${stepId}-radius">Claiming Radius (meters)</label>
                    <input type="number" id="${stepId}-radius" name="${stepId}-radius" value="25" min="1" required>
                    <small class="explainer">Claiming radius is the area where the claiming becomes available.</small>
                </div>
                
                <div class="form-group">
                    <div class="checkbox-group">
                        <input type="checkbox" id="${stepId}-has-window" name="${stepId}-has-window" onchange="questCreator.toggleClaimingWindow('${stepId}')">
                        <label for="${stepId}-has-window">Enable Claiming Window</label>
                    </div>
                    <small class="explainer">Claiming window is the due date where the claiming becomes available.</small>
                    
                    <div id="${stepId}-window-options" class="nested-options" style="display: none;">
                        <div class="date-group">
                            <div>
                                <label for="${stepId}-start-date">Start Date</label>
                                <input type="datetime-local" id="${stepId}-start-date" name="${stepId}-start-date">
                            </div>
                            <div>
                                <label for="${stepId}-due-date">Due Date</label>
                                <input type="datetime-local" id="${stepId}-due-date" name="${stepId}-due-date">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="checkbox-group">
                        <input type="checkbox" id="${stepId}-has-reward" name="${stepId}-has-reward" onchange="questCreator.toggleStepReward('${stepId}')">
                        <label for="${stepId}-has-reward">Enable Step Reward</label>
                    </div>
                    <small class="explainer">Step Rewards are individual unique coupon codes revealed to the user upon claiming.</small>
                    
                    <div id="${stepId}-reward-options" class="nested-options" style="display: none;">
                        <div class="form-group">
                            <label for="${stepId}-reward-code">Reward Code</label>
                            <input type="text" id="${stepId}-reward-code" name="${stepId}-reward-code" placeholder="Enter coupon code or reward">
                        </div>
                        
                        <div class="checkbox-group">
                            <input type="checkbox" id="${stepId}-limited-reward" name="${stepId}-limited-reward" onchange="questCreator.toggleLimitedReward('${stepId}')">
                            <label for="${stepId}-limited-reward">Limited Quantity</label>
                        </div>
                        
                        <div id="${stepId}-limited-options" class="nested-options" style="display: none;">
                            <label for="${stepId}-reward-quantity">Quantity Limit</label>
                            <input type="number" id="${stepId}-reward-quantity" name="${stepId}-reward-quantity" min="1" placeholder="Enter maximum quantity">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachStepEventListeners(stepId) {
        // Event listeners are handled by inline onclick handlers for simplicity
        // In a production app, you'd want to use proper event delegation
    }

    removeStep(stepId) {
        const stepElement = document.getElementById(stepId);
        if (stepElement) {
            // Check if this is the last step
            const stepsContainer = document.getElementById('steps-container');
            const allSteps = stepsContainer.querySelectorAll('.step-card');
            
            if (allSteps.length <= 1) {
                alert('At least one step is required for a quest.');
                return;
            }
            
            stepElement.remove();
            this.renumberSteps();
        }
    }

    renumberSteps() {
        const stepsContainer = document.getElementById('steps-container');
        const allSteps = stepsContainer.querySelectorAll('.step-card');
        
        allSteps.forEach((step, index) => {
            const stepTitle = step.querySelector('.step-title');
            stepTitle.textContent = `Step ${index + 1}`;
        });
    }

    getCurrentLocation(stepId) {
        const xInput = document.getElementById(`${stepId}-x`);
        const yInput = document.getElementById(`${stepId}-y`);
        const locationBtn = document.querySelector(`#${stepId} .location-btn`);
        
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }
        
        locationBtn.disabled = true;
        locationBtn.textContent = 'Getting Location...';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                xInput.value = position.coords.latitude.toFixed(6);
                yInput.value = position.coords.longitude.toFixed(6);
                locationBtn.disabled = false;
                locationBtn.textContent = 'Use Current Location';
            },
            (error) => {
                let message = 'Unable to retrieve location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out.';
                        break;
                }
                alert(message);
                locationBtn.disabled = false;
                locationBtn.textContent = 'Use Current Location';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    toggleClaimingWindow(stepId) {
        const checkbox = document.getElementById(`${stepId}-has-window`);
        const options = document.getElementById(`${stepId}-window-options`);
        
        options.style.display = checkbox.checked ? 'block' : 'none';
        
        // Clear values if unchecked
        if (!checkbox.checked) {
            document.getElementById(`${stepId}-start-date`).value = '';
            document.getElementById(`${stepId}-due-date`).value = '';
        }
    }

    toggleStepReward(stepId) {
        const checkbox = document.getElementById(`${stepId}-has-reward`);
        const options = document.getElementById(`${stepId}-reward-options`);
        
        options.style.display = checkbox.checked ? 'block' : 'none';
        
        // Clear values if unchecked
        if (!checkbox.checked) {
            document.getElementById(`${stepId}-reward-code`).value = '';
            document.getElementById(`${stepId}-limited-reward`).checked = false;
            this.toggleLimitedReward(stepId);
        }
    }

    toggleLimitedReward(stepId) {
        const checkbox = document.getElementById(`${stepId}-limited-reward`);
        const options = document.getElementById(`${stepId}-limited-options`);
        
        options.style.display = checkbox.checked ? 'block' : 'none';
        
        // Clear values if unchecked
        if (!checkbox.checked) {
            document.getElementById(`${stepId}-reward-quantity`).value = '';
        }
    }

    collectFormData() {
        const data = {
            story: {
                name: document.getElementById('story-name').value,
                description: document.getElementById('story-description').value,
                reward: document.getElementById('story-reward').value
            },
            steps: []
        };

        const stepsContainer = document.getElementById('steps-container');
        const stepCards = stepsContainer.querySelectorAll('.step-card');

        stepCards.forEach((stepCard) => {
            const stepId = stepCard.id;
            const stepData = {
                id: stepId,
                name: document.getElementById(`${stepId}-name`).value,
                description: document.getElementById(`${stepId}-description`).value,
                coordinates: {
                    x: parseFloat(document.getElementById(`${stepId}-x`).value),
                    y: parseFloat(document.getElementById(`${stepId}-y`).value)
                },
                claimingRadius: parseInt(document.getElementById(`${stepId}-radius`).value),
                claimingWindow: {
                    enabled: document.getElementById(`${stepId}-has-window`).checked,
                    startDate: document.getElementById(`${stepId}-start-date`).value,
                    dueDate: document.getElementById(`${stepId}-due-date`).value
                },
                reward: {
                    enabled: document.getElementById(`${stepId}-has-reward`).checked,
                    code: document.getElementById(`${stepId}-reward-code`).value,
                    limited: document.getElementById(`${stepId}-limited-reward`).checked,
                    quantity: document.getElementById(`${stepId}-reward-quantity`).value ? 
                              parseInt(document.getElementById(`${stepId}-reward-quantity`).value) : null
                }
            };

            data.steps.push(stepData);
        });

        return data;
    }

    validateForm(data) {
        const errors = [];

        // Validate story
        if (!data.story.name.trim()) {
            errors.push('Story name is required');
        }
        if (!data.story.description.trim()) {
            errors.push('Story description is required');
        }

        // Validate steps
        if (data.steps.length === 0) {
            errors.push('At least one step is required');
        }

        data.steps.forEach((step, index) => {
            const stepNum = index + 1;
            
            if (!step.name.trim()) {
                errors.push(`Step ${stepNum}: Name is required`);
            }
            if (!step.description.trim()) {
                errors.push(`Step ${stepNum}: Description is required`);
            }
            if (isNaN(step.coordinates.x) || isNaN(step.coordinates.y)) {
                errors.push(`Step ${stepNum}: Valid GPS coordinates are required`);
            }
            if (step.claimingRadius < 1) {
                errors.push(`Step ${stepNum}: Claiming radius must be at least 1 meter`);
            }
            
            if (step.claimingWindow.enabled) {
                if (!step.claimingWindow.startDate || !step.claimingWindow.dueDate) {
                    errors.push(`Step ${stepNum}: Both start and due dates are required when claiming window is enabled`);
                }
                if (step.claimingWindow.startDate && step.claimingWindow.dueDate && 
                    new Date(step.claimingWindow.startDate) >= new Date(step.claimingWindow.dueDate)) {
                    errors.push(`Step ${stepNum}: Start date must be before due date`);
                }
            }
            
            if (step.reward.enabled && !step.reward.code.trim()) {
                errors.push(`Step ${stepNum}: Reward code is required when step reward is enabled`);
            }
            
            if (step.reward.limited && (!step.reward.quantity || step.reward.quantity < 1)) {
                errors.push(`Step ${stepNum}: Valid quantity limit is required when reward is limited`);
            }
        });

        return errors;
    }

    async saveQuest() {
        const data = this.collectFormData();
        const errors = this.validateForm(data);

        if (errors.length > 0) {
            alert('Please fix the following errors:\n\n' + errors.join('\n'));
            return;
        }

        // Save to database
        const saved = await this.saveToDatabase(data);
        
        if (saved) {
            alert(`Quest "${data.story.name}" saved to database!\n\nYou can now view it in Discovery Mode.`);
            
            // Optional: Still offer JSON download
            const downloadJson = confirm('Would you also like to download the quest as a JSON file?');
            if (downloadJson) {
                this.downloadQuestJson(data);
            }
        } else {
            alert('Error saving quest to database. Please try again.');
        }
    }

    async saveToDatabase(questData) {
        try {
            // Get existing database from localStorage
            let database;
            const existing = localStorage.getItem('questDatabase');
            if (existing) {
                database = JSON.parse(existing);
            } else {
                database = {
                    quests: [],
                    metadata: {
                        version: "1.0",
                        totalQuests: 0,
                        lastUpdated: new Date().toISOString()
                    }
                };
            }

            // Add unique ID to the quest
            questData.id = 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            questData.createdAt = new Date().toISOString();

            // Add the new quest
            database.quests.push(questData);
            database.metadata.totalQuests = database.quests.length;
            database.metadata.lastUpdated = new Date().toISOString();

            // Save back to localStorage
            localStorage.setItem('questDatabase', JSON.stringify(database));
            
            console.log('Quest saved to database:', questData.story.name);
            return true;
        } catch (error) {
            console.error('Error saving quest to database:', error);
            return false;
        }
    }

    downloadQuestJson(data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.story.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quest.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    previewQuest() {
        const data = this.collectFormData();
        const errors = this.validateForm(data);

        if (errors.length > 0) {
            alert('Please fix the following errors before previewing:\n\n' + errors.join('\n'));
            return;
        }

        // Create preview window
        const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        
        const previewHtml = this.generatePreviewHtml(data);
        previewWindow.document.write(previewHtml);
        previewWindow.document.close();
    }

    generatePreviewHtml(data) {
        let stepsHtml = '';
        
        data.steps.forEach((step, index) => {
            const stepNum = index + 1;
            let windowInfo = '';
            let rewardInfo = '';
            
            if (step.claimingWindow.enabled) {
                windowInfo = `
                    <p><strong>Claiming Window:</strong></p>
                    <ul>
                        <li>Start: ${new Date(step.claimingWindow.startDate).toLocaleString()}</li>
                        <li>Due: ${new Date(step.claimingWindow.dueDate).toLocaleString()}</li>
                    </ul>
                `;
            }
            
            if (step.reward.enabled) {
                rewardInfo = `
                    <p><strong>Step Reward:</strong> ${step.reward.code}</p>
                    ${step.reward.limited ? `<p><strong>Limited to:</strong> ${step.reward.quantity} uses</p>` : ''}
                `;
            }
            
            stepsHtml += `
                <div style="border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; background: #f9f9f9;">
                    <h3>Step ${stepNum}: ${step.name}</h3>
                    <p><strong>Description:</strong> ${step.description}</p>
                    <p><strong>Location:</strong> ${step.coordinates.x}, ${step.coordinates.y}</p>
                    <p><strong>Claiming Radius:</strong> ${step.claimingRadius} meters</p>
                    ${windowInfo}
                    ${rewardInfo}
                </div>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quest Preview: ${data.story.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                    .container { max-width: 800px; margin: 0 auto; }
                    .story-header { background: #3498db; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .steps-section { margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="story-header">
                        <h1>${data.story.name}</h1>
                        <p>${data.story.description}</p>
                        ${data.story.reward ? `<p><strong>Story Completion Reward:</strong> ${data.story.reward}</p>` : ''}
                    </div>
                    
                    <div class="steps-section">
                        <h2>Quest Steps (${data.steps.length} total)</h2>
                        ${stepsHtml}
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

// Initialize the quest creator when the page loads
let questCreator;
document.addEventListener('DOMContentLoaded', () => {
    questCreator = new QuestCreator();
});