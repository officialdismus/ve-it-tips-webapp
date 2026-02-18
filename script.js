/*
  JavaScript file for fetching and rendering cards
  
  This file contains the logic for:
  - Fetching IT tips data from a Google Sheet CSV export
  - Parsing CSV data into objects
  - Rendering tip cards dynamically on the page
  - Handling user interactions with search, filters, and step toggles
  - Loading states (skeleton screens, spinner, error states)
  - Recently viewed tips functionality
*/

// Configuration: Google Sheet CSV export URL (published)
// Format: https://docs.google.com/spreadsheets/d/e/{PUBLISHED_ID}/pub?output=csv
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRySrOei6t0p90wolpc8EXrJ5B27pLi2ssZDZGrltJbESEQJgokOKPVBRSb520dcixS84VG0ky7yVug/pub?output=csv';

// Global state
let allTips = [];
let filteredTips = [];

// ===== Recently Viewed Functions =====

function getRecentlyViewedStorageKey() {
    return 've-it-tips-recently-viewed:v1';
}

function loadRecentlyViewed() {
    try {
        const raw = localStorage.getItem(getRecentlyViewedStorageKey());
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function saveRecentlyViewed(tipId, issue) {
    try {
        let recent = loadRecentlyViewed();
        
        // Remove if already exists (to move to top)
        recent = recent.filter(item => item.id !== tipId);
        
        // Add to front
        recent.unshift({
            id: tipId,
            issue: issue,
            viewedAt: new Date().toISOString()
        });
        
        // Keep only last 10
        recent = recent.slice(0, 10);
        
        localStorage.setItem(getRecentlyViewedStorageKey(), JSON.stringify(recent));
    try {
        sessionStorage.setItem('ve-it-tips-has-recent', '1');
    } catch (e) {}
    } catch (e) {
        // Ignore storage errors
    }
}

function renderRecentlyViewed() {
    const recent = loadRecentlyViewed();
    const section = document.getElementById('recentlyViewedSection');
    const container = document.getElementById('recentlyViewedList');
    const clearBtn = section.querySelector('.recently-viewed-toggle');

    // Always show the section; display a friendly empty message when there are no items
    section.style.display = 'block';

    if (!recent || recent.length === 0) {
        container.innerHTML = `
            <div class="recent-empty">
                <p class="recent-empty-title">No recently viewed tips yet</p>
                <p class="recent-empty-desc">Open a tip to build your recently viewed list — we'll keep the last 10 for quick access.</p>
            </div>
        `;
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }

    // Show Clear button
    if (clearBtn) {
        clearBtn.style.display = 'inline-flex';
        clearBtn.textContent = 'Clear';
    }

    container.innerHTML = recent.map(item => `
        <a href="steps.html?id=${encodeURIComponent(item.id)}" class="recent-item">
            <span class="recent-item-icon">📋</span>
            ${escapeHtml(item.issue)}
        </a>
    `).join('');
}

function clearRecentlyViewed() {
    try {
        localStorage.removeItem(getRecentlyViewedStorageKey());
        sessionStorage.removeItem('ve-it-tips-has-recent');
    } catch (e) {}
    renderRecentlyViewed();
}

function toggleRecentlyViewed() {
    const section = document.getElementById('recentlyViewedSection');
    const toggleBtn = section.querySelector('.recently-viewed-toggle');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        toggleBtn.textContent = 'Hide';
    } else {
        section.style.display = 'none';
        toggleBtn.textContent = 'Show';
    }
}

// Make functions available globally
window.toggleRecentlyViewed = toggleRecentlyViewed;

// ===== Loading State Functions =====

function showSkeletons(count = 6) {
    const container = document.getElementById('cardsContainer');
    
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-badge"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-description"></div>
                <div class="skeleton skeleton-description short"></div>
                <div class="skeleton skeleton-button"></div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function showLoading() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = `
        <div class="loading-inline">
            <div class="spinner"></div>
            <span>Loading IT tips...</span>
        </div>
    `;
}

function showErrorState(message) {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3 class="error-title">Unable to load tips</h3>
            <p class="error-message">${escapeHtml(message)}</p>
            <button class="error-button" onclick="location.reload()">
                Try Again
            </button>
        </div>
    `;
}

function showEmptyState() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3 class="empty-title">No tips found</h3>
            <p class="empty-message">Try adjusting your search or filter criteria</p>
        </div>
    `;
}

// ===== CSV Parsing Functions =====

/**
 * Parses CSV text into an array of objects
 * Handles quoted fields, commas within quotes, and newlines within quotes
 */
function parseCSV(csvText) {
    if (!csvText || csvText.trim() === '') return [];
    
    const rows = parseCSVRows(csvText);
    if (rows.length === 0) return [];

    // Extract headers (first row)
    const headers = rows[0].map(h => h.trim());
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (values.length === headers.length) {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
            });
            data.push(obj);
        } else if (values.length > 0) {
            // Log mismatched rows for debugging
            console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
        }
    }
    
    return data;
}

/**
 * Parses CSV text into rows, handling quoted fields with newlines
 * This is a more robust parser that handles all CSV edge cases
 */
function parseCSVRows(csvText) {
    // Remove BOM (Byte Order Mark) if present
    if (csvText.length > 0 && csvText.charCodeAt(0) === 0xFEFF) {
        csvText = csvText.slice(1);
    }
    
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < csvText.length) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote (double quote) - add single quote to field
                currentField += '"';
                i += 2; // Skip both quotes
                continue;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
                continue;
            }
        }
        
        if (!inQuotes) {
            // We're outside quotes, so commas and newlines are delimiters
            if (char === ',') {
                // End of field
                currentRow.push(currentField);
                currentField = '';
                i++;
                continue;
            } else if (char === '\n') {
                // End of row
                currentRow.push(currentField);
                // Only add row if it has at least one non-empty field
                if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
                i++;
                continue;
            } else if (char === '\r') {
                // Handle Windows line endings (\r\n)
                if (nextChar === '\n') {
                    // End of row (\r\n)
                    currentRow.push(currentField);
                    if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                    i += 2; // Skip both \r and \n
                    continue;
                } else {
                    // Standalone \r (Mac line ending)
                    currentRow.push(currentField);
                    if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                    i++;
                    continue;
                }
            }
        }
        
        // Regular character - add to current field
        currentField += char;
        i++;
    }
    
    // Add last field and row (if not empty)
    if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
            rows.push(currentRow);
        }
    }
    
    console.log(`Parsed ${rows.length} rows from CSV`);
    if (rows.length > 0) {
        console.log(`First row has ${rows[0].length} columns:`, rows[0].slice(0, 3).map(f => f.substring(0, 30)));
    }
    
    return rows;
}

// ===== Data Fetching =====

/**
 * Fetches CSV data from Google Sheets
 */
async function fetchCSVData() {
    const maxRetries = 3;
    const timeoutMs = 10000; // 10s per request

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);

        try {
            console.log(`CSV fetch attempt ${attempt} to ${GOOGLE_SHEET_CSV_URL}`);
            const response = await fetch(GOOGLE_SHEET_CSV_URL, { signal: controller.signal });
            clearTimeout(id);

            console.log('Response status:', response.status, response.statusText);
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                console.warn('Non-OK response body preview:', text.substring(0, 200));
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }

            const csvText = await response.text();
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('CSV file is empty');
            }

            const parsedData = parseCSV(csvText);
            if (parsedData.length === 0) {
                console.error('No data rows found in CSV');
                console.error('CSV preview:', csvText.substring(0, 1000));
                throw new Error('CSV file appears to be empty or could not be parsed.');
            }

            return parsedData;
        } catch (err) {
            clearTimeout(id);
            console.error(`Fetch attempt ${attempt} failed:`, err && err.message ? err.message : err);
            if (attempt === maxRetries) {
                const message = err && err.name === 'AbortError' ? 'Request timed out' : (err && err.message ? err.message : 'Unknown error');
                showErrorState(`Failed to load tips data: ${message}`);
                return [];
            }
            // Exponential backoff before retrying
            const backoff = 300 * Math.pow(2, attempt - 1);
            await new Promise(res => setTimeout(res, backoff));
        }
    }
    return [];
}

// ===== Initialization =====

/**
 * Initialize the application
 */
async function init() {
    // Show skeleton cards while loading
    showSkeletons(6);
    
    try {
        allTips = await fetchCSVData();
        
        if (allTips.length === 0) {
            return; // Error already shown in fetchCSVData
        }
        
        filteredTips = [...allTips];
        populateCategoryFilter();
        renderCards();
        renderRecentlyViewed();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showErrorState('An unexpected error occurred. Please try again.');
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Ensure recently viewed is refreshed when returning via back/forward cache or tab visibility
window.addEventListener('pageshow', (event) => {
    try { renderRecentlyViewed(); } catch (e) {}
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        try { renderRecentlyViewed(); } catch (e) {}
    }
});

// ===== Category Management =====

/**
 * Populates the category filter dropdown with unique categories
 */
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [...new Set(allTips.map(tip => tip.Category).filter(Boolean))].sort();
    
    // Clear existing options except "All Categories"
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

/**
 * Gets the badge class based on category
 */
function getCategoryBadgeClass(category) {
    const categories = [...new Set(allTips.map(tip => tip.Category).filter(Boolean))];
    const index = categories.indexOf(category);
    const classes = ['primary', 'secondary', 'accent'];
    return classes[index % classes.length];
}

// ===== Filtering Functions =====

/**
 * Filters tips based on search query and category
 */
function filterTips() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedCategory = document.getElementById('categoryFilter').value;

    // Show inline loading state while filtering so users get feedback
    showLoading();

    // Defer heavy work slightly so the loading spinner can render
    setTimeout(() => {
        filteredTips = allTips.filter(tip => {
            // Search filter (Issue or Description)
            const matchesSearch = !searchQuery || 
                (tip.Issue && tip.Issue.toLowerCase().includes(searchQuery)) ||
                (tip.Description && tip.Description.toLowerCase().includes(searchQuery));
            
            // Category filter
            const matchesCategory = !selectedCategory || tip.Category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });

        renderCards();
    }, 50);
}

// ===== Rendering Functions =====

/**
 * Formats timestamp for display
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            // Try parsing as different formats
            return timestamp;
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return timestamp;
    }
}

/**
 * Parses steps string into an array
 * Handles numbered lists, bullet points, or newline-separated steps
 */
function parseSteps(stepsString) {
    if (!stepsString) return [];
    
    // Split by newlines and filter empty lines
    let steps = stepsString.split(/\n/).filter(step => step.trim() !== '');
    
    // Remove numbering/bullets if present (e.g., "1.", "1. ", "1)", "- ", "* ")
    steps = steps.map(step => {
        // Handle numbered steps: "1.", "1. ", "1)", "1) " (with or without space)
        step = step.replace(/^\d+[\.\)]\s*/, '');
        // Handle bullet points: "- ", "* ", "• " (with space)
        step = step.replace(/^[-*•]\s+/, '');
        return step.trim();
    });
    
    return steps.filter(step => step.length > 0);
}

/**
 * Renders a single tip card
 */
function renderCard(tip, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-index', index);
    
    const steps = parseSteps(tip.Steps || '');
    const hasSteps = steps.length > 0;
    const tipId = tip.ID || '';
    const stepsUrl = `steps.html?id=${encodeURIComponent(tipId)}`;
    
    // Category badge
    const categoryBadge = tip.Category ? 
        `<span class="category-badge ${getCategoryBadgeClass(tip.Category)}">${escapeHtml(tip.Category)}</span>` : 
        '';
    
    // Steps toggle button
    const stepsButtonHTML = hasSteps ? `
        <a class="steps-toggle-btn" href="${stepsUrl}" aria-label="Show steps for ${escapeHtml(tip.Issue || 'this tip')}" role="button">
            Show Steps
        </a>
    ` : '';
    
    card.innerHTML = `
        <div class="card-header">
            ${categoryBadge}
            <h2 class="card-title">${escapeHtml(tip.Issue || 'Untitled')}</h2>
        </div>
        <p class="card-description">${escapeHtml(tip.Description || 'No description available.')}</p>
        <div class="steps-container">
            ${stepsButtonHTML}
        </div>
        <div class="card-footer">
            <p><strong>Created by:</strong> ${escapeHtml(tip.CreatedBy || 'Unknown')}</p>
            <p><strong>Date:</strong> ${formatTimestamp(tip.Timestamp)}</p>
        </div>
    `;
    
    return card;
}

/**
 * Renders all filtered tip cards
 */
function renderCards() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    
    if (filteredTips.length === 0) {
        showEmptyState();
        return;
    }
    
    filteredTips.forEach((tip, index) => {
        const card = renderCard(tip, index);
        container.appendChild(card);
    });
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Modal Functions =====

/**
 * Shows the steps modal with the given title and steps
 */
function showStepsModal(title, steps) {
    const modal = document.getElementById('stepsModal');
    const modalTitle = document.getElementById('modalTitle');
    const stepsList = document.getElementById('modalStepsList');

    // Set title
    modalTitle.textContent = title;

    // Clear existing steps
    stepsList.innerHTML = '';

    // Add steps
    steps.forEach(step => {
        const li = document.createElement('li');
        li.innerHTML = `<div class="step-content">${escapeHtml(step)}</div>`;
        stepsList.appendChild(li);
    });

    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Focus management
    modal.focus();

    // Add event listeners for closing
    modal.addEventListener('click', handleModalClick);
    document.addEventListener('keydown', handleModalKeydown);
}

/**
 * Closes the steps modal
 */
function closeStepsModal() {
    const modal = document.getElementById('stepsModal');

    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling

    // Remove event listeners
    modal.removeEventListener('click', handleModalClick);
    document.removeEventListener('keydown', handleModalKeydown);
}

/**
 * Handles clicks on the modal overlay (close when clicking outside)
 */
function handleModalClick(event) {
    if (event.target.classList.contains('modal-overlay')) {
        closeStepsModal();
    }
}

/**
 * Handles keyboard events for the modal (ESC to close)
 */
function handleModalKeydown(event) {
    if (event.key === 'Escape') {
        closeStepsModal();
    }
}

// Make modal functions available globally
window.showStepsModal = showStepsModal;
window.closeStepsModal = closeStepsModal;

// ===== Error Handling =====

/**
 * Displays an error message
 */
function showError(message) {
    const container = document.getElementById('cardsContainer');
    // Convert newlines to <br> tags for better display
    const formattedMessage = escapeHtml(message).replace(/\n/g, '<br>');
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #d32f2f;">
            <p style="font-size: 1.25rem; margin-bottom: 0.5rem; font-weight: 600;">⚠️ Error</p>
            <div style="line-height: 1.6; max-width: 600px; margin: 0 auto;">${formattedMessage}</div>
            <p style="margin-top: 1.5rem; font-size: 0.9rem; color: #666;">
                Check the browser console (F12) for detailed error information.
            </p>
        </div>
    `;
}

// ===== Event Listeners =====

/**
 * Initializes event listeners for search and filter
 */
function initializeEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    
    // Search input event (debounced for performance)
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterTips();
        }, 300);
    });
    
    // Category filter change event
    categoryFilter.addEventListener('change', () => {
        filterTips();
    });
}

// ===== Initialization =====

/**
 * Initializes the application
 */
async function init() {
    try {
        // Show loading state
        const container = document.getElementById('cardsContainer');
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <p>Loading tips...</p>
            </div>
        `;
        
        // Fetch and parse data
        allTips = await fetchCSVData();
        
        // Check if fetchCSVData already showed an error (by checking if container has error message)
        const currentContent = container.innerHTML;
        if (currentContent.includes('⚠️ Error')) {
            // Error already displayed by fetchCSVData, don't overwrite it
            return;
        }
        
        if (allTips.length === 0) {
            showError('No tips data found. Please check the Google Sheet URL and ensure it is published as CSV.\n\nCheck the browser console (F12) for detailed error information.');
            return;
        }
        
        console.log('✅ Successfully loaded', allTips.length, 'tips');
        
        // Populate category filter
        populateCategoryFilter();
        
        // Initialize filtered tips (show all initially)
        filteredTips = [...allTips];
        
        // Render cards
        renderCards();
        
        // Initialize event listeners
        initializeEventListeners();
        
    } catch (error) {
        console.error('Initialization error:', error);
        console.error('Error stack:', error.stack);
        showError(`An error occurred while initializing the application: ${error.message}\n\nCheck the browser console (F12) for detailed error information.`);
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
