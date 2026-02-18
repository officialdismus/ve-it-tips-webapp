/*
  JavaScript file for fetching and rendering cards
  
  This file contains the logic for:
  - Fetching IT tips data from a Google Sheet CSV export
  - Parsing CSV data into objects
  - Rendering tip cards dynamically on the page
  - Handling user interactions with search, filters, and step toggles
*/

// Configuration: Google Sheet CSV export URL (published)
// Format: https://docs.google.com/spreadsheets/d/e/{PUBLISHED_ID}/pub?output=csv
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRySrOei6t0p90wolpc8EXrJ5B27pLi2ssZDZGrltJbESEQJgokOKPVBRSb520dcixS84VG0ky7yVug/pub?output=csv';

// Global state
let allTips = [];
let filteredTips = [];

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
    try {
        console.log('=== Starting CSV Fetch ===');
        console.log('URL:', GOOGLE_SHEET_CSV_URL);
        
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        console.log('Response status:', response.status, response.statusText);
        console.log('Response headers:', {
            'content-type': response.headers.get('content-type'),
            'content-length': response.headers.get('content-length')
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('CSV fetched successfully');
        console.log('CSV length:', csvText.length, 'characters');
        console.log('First 200 characters:', csvText.substring(0, 200));
        console.log('Last 100 characters:', csvText.substring(csvText.length - 100));
        
        if (!csvText || csvText.trim().length === 0) {
            throw new Error('CSV file is empty');
        }
        
        const parsedData = parseCSV(csvText);
        console.log('=== Parsing Results ===');
        console.log('Total rows parsed:', parsedData.length);
        
        if (parsedData.length === 0) {
            console.error('No data rows found in CSV');
            console.error('CSV preview:', csvText.substring(0, 1000));
            throw new Error('CSV file appears to be empty or could not be parsed. Check console for details.');
        }
        
        // Validate structure - check if we have expected columns
        const expectedColumns = ['ID', 'Category', 'Issue', 'Description', 'Steps', 'CreatedBy', 'Timestamp'];
        const firstRow = parsedData[0];
        const foundColumns = Object.keys(firstRow);
        
        console.log('Expected columns:', expectedColumns);
        console.log('Found columns:', foundColumns);
        
        const hasRequiredFields = expectedColumns.every(col => firstRow.hasOwnProperty(col));
        
        if (!hasRequiredFields) {
            console.warn('⚠️ CSV structure mismatch!');
            console.warn('Missing columns:', expectedColumns.filter(col => !firstRow.hasOwnProperty(col)));
            console.warn('Unexpected columns:', foundColumns.filter(col => !expectedColumns.includes(col)));
        } else {
            console.log('✅ CSV structure validated successfully');
        }
        
        if (parsedData.length > 0) {
            console.log('First row sample:', {
                ID: firstRow.ID,
                Category: firstRow.Category,
                Issue: firstRow.Issue?.substring(0, 50),
                StepsLength: firstRow.Steps ? firstRow.Steps.length : 0,
                CreatedBy: firstRow.CreatedBy
            });
        }
        
        console.log('=== CSV Fetch Complete ===');
        return parsedData;
    } catch (error) {
        console.error('=== Error Fetching CSV ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        let errorMessage = `Failed to load tips data: ${error.message}`;
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += '\n\nPossible causes:\n- CORS issue (check if sheet is published)\n- Network connection problem\n- Google Sheets access restrictions';
        } else if (error.message.includes('empty')) {
            errorMessage += '\n\nThe CSV file appears to be empty. Please check:\n- Google Sheet has data\n- Sheet is published to web\n- CSV export is enabled';
        }
        
        showError(errorMessage);
        return [];
    }
}

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
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <p style="font-size: 1.25rem; margin-bottom: 0.5rem;">No tips found</p>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        `;
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
