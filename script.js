// UI Elements
const ui = {
    // Views
    views: {
        home: document.getElementById('view-home'),
        demo: document.getElementById('view-demo'),
        donations: document.getElementById('view-donations'),
        guide: document.getElementById('view-guide'),
    },
    uploadView: document.getElementById('upload-view'),
    resultsView: document.getElementById('results-view'),
    
    // Core Functionality (Image/AI)
    imageInput: document.getElementById('food-image-input'),
    imagePreview: document.getElementById('image-preview'),
    previewText: document.getElementById('preview-text'),
    previewContainer: document.getElementById('image-preview-container'),
    processBtn: document.getElementById('process-image-btn'),
    
    // Manual Input
    manualInput: document.getElementById('manual-ingredients-input'),
    processManualBtn: document.getElementById('process-manual-btn'),

    // Results/Actions
    detectedList: document.getElementById('detected-ingredients-list'),
    generateRecipeBtn: document.getElementById('generate-recipe-btn'),
    donateFoodBtn: document.getElementById('donate-food-btn'),
    resetBtn: document.getElementById('reset-btn'),
    recipeDisplay: document.getElementById('recipe-display'),
    donationList: document.getElementById('donation-list'),
    
    // Global/Modal
    statusMessage: document.getElementById('status-message'),
    donationModal: document.getElementById('donation-modal'), // AI Flow Modal
    modalFoodItems: document.getElementById('modal-food-items'),
    donationForm: document.getElementById('donation-form'),
    cancelDonationBtn: document.getElementById('cancel-donation-btn'),
    authStatus: document.getElementById('auth-status'),
    themeToggle: document.getElementById('theme-toggle'),

    // Manual Donation
    manualDonateTriggerBtn: document.getElementById('manual-donate-trigger-btn'),
    manualDonationModal: document.getElementById('manual-donation-modal'), // Manual Flow Modal
    manualDonationForm: document.getElementById('manual-donation-form'),
    cancelManualDonationBtn: document.getElementById('cancel-manual-donation-btn'),
    manualItemsInput: document.getElementById('manual-items-input'),
    manualQuantityInput: document.getElementById('manual-quantity-input'),
    manualLocationInput: document.getElementById('manual-location-input'),
};

// Global variables
const apiKey = "AIzaSyAtfKgbb7PrxEKrtC3adJphBI10pdDzpXw"; // Your original placeholder key
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL = "gemini-2.5-flash"; 
let detectedIngredients = []; // Used to store the result from image/manual process

// --- Routing Logic ---
const routes = ['home', 'demo', 'donations', 'guide'];

/**
 * Switches the active view based on the URL hash.
 */
const renderView = () => {
    const hash = window.location.hash.replace('#', '');
    const currentView = routes.includes(hash) ? hash : 'home';

    // Hide all views
    Object.values(ui.views).forEach(view => view.classList.add('hidden'));

    // Show the active view
    const activeViewElement = ui.views[currentView];
    if (activeViewElement) {
        activeViewElement.classList.remove('hidden');
        activeViewElement.classList.add('page-content'); // Apply fade-in animation
    }
    
    // Update active navigation link styling (simple version)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('text-revia-green', 'font-bold', 'border-b-2', 'border-revia-green');
        if (link.getAttribute('href').replace('#', '') === currentView) {
            link.classList.add('text-revia-green', 'font-bold', 'border-b-2', 'border-revia-green');
        }
    });
};

// --- Utility Functions ---

const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // Update icon: Sun for light mode, Moon for dark mode
    ui.themeToggle.innerHTML = isDark 
        ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>'
        : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>';
};

const setStatus = (message, type) => {
    ui.statusMessage.className = 'fixed top-20 right-4 p-4 rounded-xl max-w-xs w-full text-white font-medium shadow-xl z-30 transition-all duration-300';
    ui.statusMessage.classList.remove('hidden');

    if (type === 'loading') {
        ui.statusMessage.innerHTML = '<div class="loading-spinner mb-2"></div>' + message;
    } else {
        ui.statusMessage.innerHTML = message;
    }

    ui.statusMessage.classList.remove('bg-blue-500', 'bg-revia-green', 'bg-red-500', 'bg-gray-500');

    switch (type) {
        case 'loading':
            ui.statusMessage.classList.add('bg-blue-500');
            break;
        case 'success':
            ui.statusMessage.classList.add('bg-revia-green');
            break;
        case 'error':
            ui.statusMessage.classList.add('bg-red-500');
            break;
        default:
            ui.statusMessage.classList.add('bg-gray-500');
    }
    
    if (type !== 'loading') {
        setTimeout(() => {
            ui.statusMessage.classList.add('hidden');
        }, 4000);
    }
};

const hideStatus = () => {
    ui.statusMessage.classList.add('hidden');
};

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // Resolve with the base64 data part (remove the 'data:mime/type;base64,' prefix)
        reader.onload = () => resolve(reader.result.split(',')[1]); 
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

// --- UI State Management for Demo View ---

const showDemoStage = (stage) => {
    ui.uploadView.classList.add('hidden');
    ui.resultsView.classList.add('hidden');
    ui.recipeDisplay.classList.add('hidden');
    
    if (stage === 'upload') {
        ui.uploadView.classList.remove('hidden');
        ui.uploadView.classList.add('fade-in', 'flex');
    } else if (stage === 'results') {
        ui.resultsView.classList.remove('hidden');
        ui.resultsView.classList.add('fade-in', 'flex');
    }
};

const previewImage = () => {
    const file = ui.imageInput.files[0];
    
    if (file) {
        const mimeType = file.type;
        if (!mimeType.startsWith('image/')) {
            setStatus("Please select a valid image file (jpeg, png, webp).", 'error');
            ui.imageInput.value = '';
            return;
        }
        
        if (file.size > 4 * 1024 * 1024) {
            setStatus("Image size should be less than 4MB for optimal API performance.", 'error');
            ui.imageInput.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            ui.imagePreview.src = e.target.result;
            ui.imagePreview.classList.remove('hidden');
            ui.previewText.classList.add('hidden');
            ui.previewContainer.classList.add('has-image');
            ui.processBtn.classList.remove('hidden');
            setStatus("Image uploaded successfully! Click 'Analyze Ingredients from Image'.", 'success');
        };
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            setStatus("Error reading the image file. Please try another image.", 'error');
        };
        reader.readAsDataURL(file);
    } else {
        ui.imagePreview.classList.add('hidden');
        ui.previewText.classList.remove('hidden');
        ui.previewContainer.classList.remove('has-image');
        ui.processBtn.classList.add('hidden');
        hideStatus();
    }
};

const updateRecipeButtonState = () => {
    const checkedBoxes = ui.detectedList.querySelectorAll('input[type="checkbox"]:checked');
    const isDisabled = checkedBoxes.length === 0;

    ui.generateRecipeBtn.disabled = isDisabled;
    ui.generateRecipeBtn.classList.toggle('cursor-not-allowed', isDisabled);
    ui.generateRecipeBtn.classList.toggle('bg-blue-500/70', isDisabled);
    ui.generateRecipeBtn.classList.toggle('dark:bg-blue-600/70', isDisabled);

    ui.generateRecipeBtn.classList.toggle('hover:bg-blue-600', !isDisabled);
    ui.generateRecipeBtn.classList.toggle('bg-blue-500', !isDisabled);
    ui.generateRecipeBtn.classList.toggle('dark:bg-blue-600', !isDisabled);
};

const displayIngredientChecklist = (items) => {
    ui.detectedList.innerHTML = items.map((item, index) => `
        <div class="flex items-center space-x-2 text-sm">
            <input id="ing-${index}" type="checkbox" value="${item}" checked class="rounded text-revia-green focus:ring-revia-green dark:bg-gray-800 dark:border-gray-600 border-gray-400">
            <label for="ing-${index}" class="cursor-pointer dark:text-gray-300">${item.charAt(0).toUpperCase() + item.slice(1)}</label>
        </div>
    `).join('');

    // Re-bind listener to the parent element for efficiency
    const checklistListener = () => updateRecipeButtonState();
    ui.detectedList.removeEventListener('change', checklistListener); 
    ui.detectedList.addEventListener('change', checklistListener);
};

// --- Core AI Logic (Detection and Recipe Generation) ---

const callGeminiAPI = async (promptText, base64Image = null, isJson = false) => {
    if (!apiKey || apiKey.length < 10) {
        throw new Error("API Key is missing or invalid. AI features are disabled.");
    }

    const url = `${API_BASE_URL}${MODEL}:generateContent?key=${apiKey}`;
    const contents = [];

    if (base64Image) {
        const file = ui.imageInput.files[0];
        const mimeType = file ? file.type : 'image/jpeg';
        
        contents.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Image
            }
        });
    }
    
    contents.push({ text: promptText });

    // Initialize payload with the 'contents' property
    const payload = {
        contents: [{ parts: contents }]
    };
    
    if (isJson) {
        // FIX: The generation configuration must be set under the 'generationConfig' key
        // at the top level of the payload object for the REST API.
        payload.generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    recipes: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                recipeName: { type: "STRING" },
                                description: { type: "STRING" },
                                ingredientsRequired: { type: "ARRAY", items: { type: "STRING" } },
                                steps: { type: "ARRAY", items: { type: "STRING" } }
                            },
                            propertyOrdering: ["recipeName", "description", "ingredientsRequired", "steps"]
                        }
                    }
                }
            }
        };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("API Error:", errorBody);
        throw new Error(`API call failed with status ${response.status}: ${errorBody.error?.message || 'Unknown server error'}`);
    }

    const data = await response.json();
    const part = data.candidates?.[0]?.content?.parts?.[0];

    if (isJson) {
        const jsonText = part?.text;
        if (!jsonText) throw new Error("AI did not return a valid JSON response.");
        try {
            // Remove Markdown code block backticks if present (a defensive measure)
            const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            return JSON.parse(cleanedJsonText);
        } catch (e) {
            console.error("JSON Parsing failed from AI response:", e, jsonText);
            throw new Error("AI returned unparsable data. Try again with a clearer prompt.");
        }
    }
    
    return part?.text;
};

/**
 * Step 1A: Process ingredients from uploaded image.
 */
const handleProcessImage = async () => {
    const file = ui.imageInput.files[0];
    if (!file) {
        setStatus("Please select an image first.", 'error');
        return;
    }

    // Reset state
    detectedIngredients = [];
    ui.recipeDisplay.innerHTML = '';
    ui.recipeDisplay.classList.add('hidden');
    ui.detectedList.innerHTML = '<p class="text-sm italic col-span-2 text-gray-400">Analyzing image...</p>';

    try {
        setStatus("AI is analyzing your food items and detecting ingredients...", 'loading');
        const base64Image = await fileToBase64(file);

        const detectionPrompt = `Analyze the provided image and list ALL detectable raw food items, ingredients, or produce you see. 
                                 Format your entire response as a single, comma-separated list with no numbering, headings, or extra text. 
                                 Example: apples, bananas, whole wheat bread, eggs, lettuce.`; 

        const rawResponse = await callGeminiAPI(detectionPrompt, base64Image);
        
        const items = rawResponse.split(',')
            .map(item => item.trim().toLowerCase())
            .filter(item => item.length > 0);

        if (items.length === 0) {
            throw new Error("No food items were clearly detected. Try a clearer photo.");
        }
        
        detectedIngredients = items;
        displayIngredientChecklist(items);
        showDemoStage('results');
        hideStatus();
        setStatus(`Successfully detected ${items.length} ingredients! Select which ones to use and choose an action.`, 'success');
        updateRecipeButtonState(); 
        
    } catch (error) {
        console.error("Process Image Error:", error);
        setStatus(error.message || "An unexpected error occurred during detection. Check your API Key and console for details.", 'error');
        showDemoStage('upload');
    }
};

/**
 * Step 1B: Process ingredients from manual text input.
 */
const handleProcessManual = () => {
    const manualText = ui.manualInput.value.trim();
    ui.manualInput.value = manualText; // Clean input

    if (manualText.length < 3) {
        setStatus("Please enter a list of ingredients (e.g., chicken, rice, eggs).", 'error');
        return;
    }
    
    // Convert manual text to the format expected by results view
    const items = manualText.split(',')
        .map(item => item.trim().toLowerCase())
        .filter(item => item.length > 0);

    if (items.length === 0) {
        setStatus("The manual list seems empty or incorrectly formatted.", 'error');
        return;
    }
    
    detectedIngredients = items;
    displayIngredientChecklist(items); 
    showDemoStage('results');
    hideStatus();
    setStatus(`Successfully processed ${items.length} manual ingredients! Select which ones to use and choose an action.`, 'success');
    updateRecipeButtonState();
};

/**
 * Step 2: Generate recipes based on SELECTED ingredients.
 */
const handleGenerateRecipe = async () => {
    const selectedIngredients = Array.from(ui.detectedList.querySelectorAll('input[type="checkbox"]:checked'))
                                         .map(input => input.value);

    if (selectedIngredients.length === 0) {
        setStatus("Please select at least one ingredient to generate a recipe.", 'error');
        return;
    }

    ui.recipeDisplay.innerHTML = '';
    ui.recipeDisplay.classList.remove('hidden');

    try {
        setStatus(`Generating top 5 recipes for ${selectedIngredients.length} ingredients...`, 'loading');
        
        const ingredientsList = selectedIngredients.join(', ');
        const recipePrompt = `Based *only* on the following ingredients: ${ingredientsList}. 
                              Generate five distinct, easy-to-follow recipes. 
                              Ensure the response is a clean, single JSON object.`;

        const recipeData = await callGeminiAPI(recipePrompt, null, true);
        
        const recipes = recipeData.recipes || [];

        if (recipes.length > 0) {
            const recipeHtml = recipes.map((recipe, index) => {
                return `
                <div class="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg border-t-4 border-blue-500 transition-all duration-300 hover:shadow-2xl hover:translate-y-[-2px]">
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-dark-text mb-2">${index + 1}. ${recipe.recipeName}</h3>
                    <p class="text-gray-600 dark:text-gray-400 italic mb-4">${recipe.description || 'A delicious dish tailored to your ingredients.'}</p>
                    
                    <div class="space-y-4">
                        <div>
                            <p class="font-bold text-gray-700 dark:text-dark-text mb-1">Ingredients:</p>
                            <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 pl-4">
                                ${(recipe.ingredientsRequired || []).map(ing => '<li>' + ing + '</li>').join('')}
                            </ul>
                        </div>
                        
                        <div>
                            <p class="font-bold text-gray-700 dark:text-dark-text mb-1">Preparation Steps:</p>
                            <ol class="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 pl-4 space-y-1">
                                ${(recipe.steps || []).map(step => '<li>' + step + '</li>').join('')}
                            </ol>
                        </div>
                    </div>
                </div>
                `;
            }).join('');

            ui.recipeDisplay.innerHTML = `<h2 class="text-3xl font-bold text-gray-800 dark:text-dark-text border-b dark:border-gray-700 pb-3 mb-6">✨ Top ${recipes.length} Recipe Suggestions</h2><div class="space-y-6">${recipeHtml}</div>`;
            setStatus("Recipes generated successfully!", 'success');
        } else {
            setStatus("The AI couldn't generate recipes for these items.", 'error');
        }

    } catch (error) {
        console.error("Generate Recipe Error:", error);
        setStatus(error.message || "An unexpected error occurred during recipe generation.", 'error');
    }
};

const handleDonateFood = () => {
     // Get ALL detected items for the donation record, not just selected ones.
     const itemsToDonate = Array.from(ui.detectedList.querySelectorAll('input[type="checkbox"]'))
                                     .map(input => input.value);

    if (itemsToDonate.length === 0) {
        setStatus("No ingredients were detected to donate. Please analyze an image or enter ingredients manually first.", 'error');
        return;
    }
    ui.modalFoodItems.textContent = itemsToDonate.join(', ');
    ui.donationModal.classList.remove('hidden');
};

const handleReset = () => {
    detectedIngredients = [];
    ui.imageInput.value = '';
    ui.manualInput.value = '';
    ui.imagePreview.src = '';
    ui.imagePreview.classList.add('hidden');
    ui.previewText.classList.remove('hidden');
    ui.previewContainer.classList.remove('has-image');
    ui.processBtn.classList.add('hidden');
    ui.detectedList.innerHTML = '<p class="text-sm italic col-span-2 text-gray-400">Ingredients will appear here after analysis.</p>';
    ui.recipeDisplay.innerHTML = '';
    ui.donationModal.classList.add('hidden');
    hideStatus();
    showDemoStage('upload');
    // Reset button state
    ui.generateRecipeBtn.disabled = true;
    ui.generateRecipeBtn.classList.add('cursor-not-allowed', 'bg-blue-500/70', 'dark:bg-blue-600/70');
    ui.generateRecipeBtn.classList.remove('hover:bg-blue-600', 'bg-blue-500', 'dark:bg-blue-600');
};

/**
 * Helper function to add a donation row to the table.
 */
const addDonationToTable = (items, quantity, location) => {
    const newRow = document.createElement('tr');
    newRow.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 fade-in';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    newRow.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text">user_${Math.floor(Math.random() * 10000)}</td>
        <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${items} <span class="font-semibold text-revia-green">(${quantity})</span></td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${location}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                New Request
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${timestamp}</td>
    `;
    const tbody = ui.donationList;
    
    // Remove initial loading row if present
    const loadingRow = tbody.querySelector('td[colspan="5"]');
    if (loadingRow) {
        loadingRow.parentNode.remove();
    }
    tbody.prepend(newRow);
    setStatus("Donation request confirmed! Thank you for reducing waste.", 'success');
}

// --- Donation Form Submission (AI Flow) ---
const handleDonationSubmit = (e) => {
    e.preventDefault();
    
    const quantity = document.getElementById('quantity-input').value;
    const location = document.getElementById('location-input').value;
    
    // Get ALL detected items for the donation record
    const items = Array.from(ui.detectedList.querySelectorAll('input[type="checkbox"]'))
                            .map(input => input.value)
                            .join(', ');

    ui.donationModal.classList.add('hidden');
    addDonationToTable(items, quantity, location);
    handleReset(); 
    window.location.hash = '#donations';
};

// --- Manual Donation Form Submission (Donations Page Flow) ---
const handleManualDonationSubmit = (e) => {
    e.preventDefault();
    
    const items = ui.manualItemsInput.value;
    const quantity = ui.manualQuantityInput.value;
    const location = ui.manualLocationInput.value;
    
    ui.manualDonationModal.classList.add('hidden');
    addDonationToTable(items, quantity, location);
    // We don't call handleReset() here as it would clear the Demo page's state.
}

const loadMockDonations = () => {
    const donations = [
        { id: 'user_1234abcd', items: 'apples (1 doz), bananas (1 bunch), whole wheat bread (1 loaf)', location: 'San Francisco, CA', status: 'Pending Pickup', time: '10:30 AM', statusColor: 'yellow' },
        { id: 'user_5678efgh', items: 'canned beans (4 cans), rice (10 lbs), pasta (3 boxes)', location: 'Oakland, CA', status: 'Scheduled', time: '9:15 AM', statusColor: 'green' },
        { id: 'user_9012ijkl', items: 'broccoli (2 heads), carrots (1 lb), potato (5 lbs)', location: 'San Jose, CA', status: 'Completed', time: 'Yesterday', statusColor: 'gray' }
    ];

    const colorClasses = {
        'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
        'green': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
        'gray': 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100',
        'red': 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' // Added red for "New Request" in addDonationToTable
    };

    const donationHtml = donations.map(d => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 fade-in">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text">${d.id}</td>
            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${d.items}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${d.location}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[d.statusColor]}">
                    ${d.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${d.time}</td>
        </tr>
    `).join('');

    ui.donationList.innerHTML = donationHtml;
};


// --- Initial Setup and Listeners ---
window.onload = () => {
    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        toggleTheme(); 
    }

    // Routing setup
    window.addEventListener('hashchange', renderView);
    renderView();
    
    // Set up main event listeners
    ui.themeToggle.addEventListener('click', toggleTheme);

    // Demo Page Listeners
    ui.imageInput.addEventListener('change', previewImage);
    ui.processBtn.addEventListener('click', handleProcessImage);
    ui.processManualBtn.addEventListener('click', handleProcessManual); 
    ui.generateRecipeBtn.addEventListener('click', handleGenerateRecipe);
    ui.donateFoodBtn.addEventListener('click', handleDonateFood);
    ui.resetBtn.addEventListener('click', handleReset);
    
    // AI Donation Modal Listeners
    ui.cancelDonationBtn.addEventListener('click', () => {
        ui.donationModal.classList.add('hidden');
    });
    ui.donationForm.addEventListener('submit', handleDonationSubmit);

    // Manual Donation Listeners
    ui.manualDonateTriggerBtn.addEventListener('click', () => {
        ui.manualDonationModal.classList.remove('hidden');
        ui.manualItemsInput.focus();
    });
    ui.cancelManualDonationBtn.addEventListener('click', () => {
        ui.manualDonationModal.classList.add('hidden');
    });
    ui.manualDonationForm.addEventListener('submit', handleManualDonationSubmit);

    // Set AI Status
    if (apiKey.length > 10) { 
        ui.authStatus.textContent = "AI Active";
        ui.authStatus.classList.replace('text-gray-500', 'text-revia-dark');
        ui.authStatus.classList.replace('bg-gray-100', 'bg-revia-light');
        hideStatus(); 
    } else {
        ui.authStatus.textContent = "AI Key MISSING";
        ui.authStatus.classList.replace('text-gray-500', 'text-red-600');
        ui.authStatus.classList.replace('bg-gray-100', 'bg-red-100');
        setStatus("🚨 Warning: API Key is empty or invalid. AI features are disabled.", 'error');
    }

    // Load mock data
    loadMockDonations();
    showDemoStage('upload'); 
    console.log("Application initialized successfully with client-side routing.");
};