// Configuration: reuse the same Google Sheet CSV export URL as the main page
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRySrOei6t0p90wolpc8EXrJ5B27pLi2ssZDZGrltJbESEQJgokOKPVBRSb520dcixS84VG0ky7yVug/pub?output=csv';

// ===== Utility Functions =====

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

function parseCSVRows(csvText) {
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
                currentField += '"';
                i += 2;
                continue;
            } else {
                inQuotes = !inQuotes;
                i++;
                continue;
            }
        }

        if (!inQuotes) {
            if (char === ',') {
                currentRow.push(currentField);
                currentField = '';
                i++;
                continue;
            } else if (char === '\n') {
                currentRow.push(currentField);
                if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
                i++;
                continue;
            } else if (char === '\r') {
                if (nextChar === '\n') {
                    currentRow.push(currentField);
                    if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
                        rows.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                    i += 2;
                    continue;
                } else {
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

        currentField += char;
        i++;
    }

    if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(field => field.trim() !== '')) {
            rows.push(currentRow);
        }
    }

    return rows;
}

function parseCSV(csvText) {
    if (!csvText || csvText.trim() === '') return [];

    const rows = parseCSVRows(csvText);
    if (rows.length === 0) return [];

    const headers = rows[0].map(h => h.trim());
    const data = [];

    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (values.length === headers.length) {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
            });
            data.push(obj);
        }
    }

    return data;
}

function parseSteps(stepsString) {
    if (!stepsString) return [];

    let steps = stepsString.split(/\n/).filter(step => step.trim() !== '');

    steps = steps.map(step => {
        step = step.replace(/^\d+[\.\)]\s*/, '');
        step = step.replace(/^[-*•]\s+/, '');
        return step.trim();
    });

    return steps.filter(step => step.length > 0);
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
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

async function fetchCSVData() {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
        throw new Error('CSV file is empty');
    }
    return parseCSV(csvText);
}

function showStepsError(message) {
    const errorContainer = document.getElementById('stepsErrorContainer');
    if (!errorContainer) return;

    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
    errorContainer.innerHTML = `
        <div class="steps-error-card">
            <p class="steps-error-title">Unable to load steps</p>
            <p class="steps-error-message">${safeMessage}</p>
            <a href="index.html" class="steps-back-link secondary">&larr; Back to all tips</a>
        </div>
    `;
}

async function initStepsPage() {
    const tipId = getQueryParam('id');
    const titleEl = document.getElementById('stepsIssueTitle');
    const descEl = document.getElementById('stepsIssueDescription');
    const listEl = document.getElementById('stepsDetailList');
    const categoryEl = document.getElementById('stepsDetailCategory');
    const createdByEl = document.getElementById('stepsDetailCreatedBy');
    const dateEl = document.getElementById('stepsDetailDate');

    if (!tipId) {
        showStepsError('No tip selected. Please choose a tip from the main list.');
        if (titleEl) titleEl.textContent = 'No tip selected';
        return;
    }

    if (listEl) {
        listEl.innerHTML = '';
    }
    if (titleEl) {
        titleEl.textContent = 'Loading steps...';
    }

    try {
        const data = await fetchCSVData();
        const tip = data.find(row => row.ID === tipId);

        if (!tip) {
            showStepsError('We could not find that tip. It may have been removed or the link is incorrect.');
            if (titleEl) titleEl.textContent = 'Tip not found';
            return;
        }

        const issue = tip.Issue || 'IT Tip';
        const description = tip.Description || '';
        const steps = parseSteps(tip.Steps || '');

        if (titleEl) {
            titleEl.textContent = issue;
        }

        if (descEl) {
            descEl.textContent = description;
            descEl.style.display = description ? '' : 'none';
        }

        if (categoryEl) {
            categoryEl.textContent = tip.Category ? tip.Category : '';
            categoryEl.style.display = tip.Category ? '' : 'none';
        }

        if (createdByEl) {
            createdByEl.textContent = tip.CreatedBy ? `Created by ${tip.CreatedBy}` : '';
            createdByEl.style.display = tip.CreatedBy ? '' : 'none';
        }

        if (dateEl) {
            const formatted = formatTimestamp(tip.Timestamp);
            dateEl.textContent = formatted ? `Updated ${formatted}` : '';
            dateEl.style.display = formatted ? '' : 'none';
        }

        if (listEl) {
            listEl.innerHTML = '';

            if (steps.length === 0) {
                const li = document.createElement('li');
                li.innerHTML = `<div class="step-content">No specific steps provided for this tip.</div>`;
                listEl.appendChild(li);
            } else {
                steps.forEach(step => {
                    const li = document.createElement('li');
                    li.innerHTML = `<div class="step-content">${escapeHtml(step)}</div>`;
                    listEl.appendChild(li);
                });
            }
        }
    } catch (error) {
        console.error('Error loading steps detail page:', error);
        showStepsError(`Failed to load steps: ${error.message}`);
        if (titleEl) {
            titleEl.textContent = 'Error loading steps';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStepsPage);
} else {
    initStepsPage();
}

