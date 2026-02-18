// Configuration: reuse the same Google Sheet CSV export URL as the main page
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRySrOei6t0p90wolpc8EXrJ5B27pLi2ssZDZGrltJbESEQJgokOKPVBRSb520dcixS84VG0ky7yVug/pub?output=csv';

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

// ===== QR Code Function =====

function generateQRCode(tipId) {
    const qrSection = document.getElementById('qrCodeSection');
    const qrImage = document.getElementById('qrCodeImage');
    const printDate = document.getElementById('printDate');
    
    if (!qrSection || !qrImage) return;
    
    // Get full URL to this specific tip
    const tipUrl = window.location.href;
    
    // Use free QR server API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tipUrl)}`;
    
    qrImage.src = qrApiUrl;
    // Keep QR hidden on-screen; CSS will print it via @media print rules.
    
    // Set print date
    if (printDate) {
        printDate.textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

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
    const maxRetries = 3;
    const timeoutMs = 10000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(GOOGLE_SHEET_CSV_URL, { signal: controller.signal });
            clearTimeout(id);

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                console.warn('Non-OK response preview:', text.substring(0, 200));
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }

            const csvText = await response.text();
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('CSV file is empty');
            }

            return parseCSV(csvText);
        } catch (err) {
            clearTimeout(id);
            console.error(`fetchCSVData attempt ${attempt} failed:`, err && err.message ? err.message : err);
            if (attempt === maxRetries) {
                throw err;
            }
            const backoff = 300 * Math.pow(2, attempt - 1);
            await new Promise(res => setTimeout(res, backoff));
        }
    }
    return [];
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

function getChecklistStorageKey(tipId) {
    return `ve-it-tips-checklist:${tipId}:v1`;
}

function loadChecklistState(tipId, totalSteps) {
    try {
        const raw = localStorage.getItem(getChecklistStorageKey(tipId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;

        const arr = parsed.map(v => Boolean(v));
        if (typeof totalSteps === 'number' && totalSteps >= 0) {
            if (arr.length > totalSteps) return arr.slice(0, totalSteps);
            if (arr.length < totalSteps) {
                return [...arr, ...new Array(totalSteps - arr.length).fill(false)];
            }
        }
        return arr;
    } catch (e) {
        return null;
    }
}

function saveChecklistState(tipId, checkedArray) {
    try {
        localStorage.setItem(getChecklistStorageKey(tipId), JSON.stringify(checkedArray));
    } catch (e) {
        // Ignore storage errors (quota/private mode)
    }
}

function normalizeSequentialState(checkedArray) {
    if (!Array.isArray(checkedArray)) return checkedArray;
    const normalized = [...checkedArray];
    let foundFirstUnchecked = false;
    for (let i = 0; i < normalized.length; i++) {
        if (foundFirstUnchecked) {
            normalized[i] = false;
            continue;
        }
        if (!normalized[i]) {
            foundFirstUnchecked = true;
        }
    }
    return normalized;
}

function updateProgress(progressEl, completedCount, total) {
    if (!progressEl) return;
    progressEl.textContent = `${completedCount} of ${total} completed`;
}

function applyChecklistState(checkboxes, checkedArray) {
    checkboxes.forEach((checkbox, idx) => {
        checkbox.checked = Boolean(checkedArray?.[idx]);
        const li = checkbox.closest('li');
        if (li) {
            li.classList.toggle('completed', checkbox.checked);
        }
    });
}

function syncSequentialAvailability(checkboxes) {
    // Enable all checked steps; enable the first unchecked step; disable remaining unchecked steps.
    let firstUncheckedIndex = -1;
    for (let i = 0; i < checkboxes.length; i++) {
        if (!checkboxes[i].checked) {
            firstUncheckedIndex = i;
            break;
        }
    }

    for (let i = 0; i < checkboxes.length; i++) {
        const cb = checkboxes[i];
        if (cb.checked) {
            cb.disabled = false;
        } else if (firstUncheckedIndex === -1) {
            cb.disabled = false;
        } else {
            cb.disabled = i !== firstUncheckedIndex;
        }
    }
}

async function copyTextToClipboard(text) {
    // Prefer modern async clipboard API when available.
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return;
    }

    // Fallback for environments where clipboard permissions are restricted.
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand && document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!success) {
        throw new Error('Copy not supported');
    }
}

async function initStepsPage() {
    const tipId = getQueryParam('id');
    const titleEl = document.getElementById('stepsIssueTitle');
    const descEl = document.getElementById('stepsIssueDescription');
    const listEl = document.getElementById('stepsDetailList');
    const categoryEl = document.getElementById('stepsDetailCategory');
    const createdByEl = document.getElementById('stepsDetailCreatedBy');
    const dateEl = document.getElementById('stepsDetailDate');
    const progressEl = document.getElementById('stepsProgress');

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

        // Save to recently viewed and generate QR code
        saveRecentlyViewed(tipId, tip.Issue);
        generateQRCode(tipId);

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

        if (progressEl) {
            progressEl.textContent = '';
            progressEl.style.display = 'none';
        }

        if (listEl) {
            listEl.innerHTML = '';
            listEl.classList.remove('checklist-enabled');

            if (steps.length === 0) {
                const li = document.createElement('li');
                li.innerHTML = `<div class="step-content">No specific steps provided for this tip.</div>`;
                listEl.appendChild(li);
            } else {
                steps.forEach(step => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <label class="steps-check-label">
                            <input type="checkbox" class="steps-check-input" />
                            <div class="step-content">${escapeHtml(step)}</div>
                        </label>
                    `;
                    listEl.appendChild(li);
                });

                const checklistBtn = document.getElementById('checklistToggleButton');
                const checkboxes = Array.from(listEl.querySelectorAll('.steps-check-input'));

                // Checklist mode is optional; disable interactions until enabled.
                checkboxes.forEach(cb => {
                    cb.disabled = true;
                });

                const applyAndPersist = () => {
                    const checkedArray = checkboxes.map(cb => cb.checked);
                    const completedCount = checkedArray.filter(Boolean).length;
                    updateProgress(progressEl, completedCount, checkboxes.length);
                    saveChecklistState(tipId, checkedArray);
                };

                const enableChecklist = () => {
                    listEl.classList.add('checklist-enabled');
                    if (checklistBtn) checklistBtn.classList.add('active');
                    if (progressEl) progressEl.style.display = '';

                    let state = loadChecklistState(tipId, checkboxes.length) || new Array(checkboxes.length).fill(false);
                    state = normalizeSequentialState(state);
                    applyChecklistState(checkboxes, state);

                    // Enable sequentially: first unchecked (or all checked -> all enabled)
                    syncSequentialAvailability(checkboxes);
                    applyAndPersist();
                };

                const disableChecklist = () => {
                    listEl.classList.remove('checklist-enabled');
                    if (checklistBtn) checklistBtn.classList.remove('active');
                    if (progressEl) {
                        progressEl.textContent = '';
                        progressEl.style.display = 'none';
                    }

                    // Disable all checkboxes so labels can't toggle while hidden
                    checkboxes.forEach(cb => {
                        cb.disabled = true;
                    });
                };

                // Enforce sequential completion and cascade on uncheck.
                checkboxes.forEach((checkbox, idx) => {
                    checkbox.addEventListener('change', () => {
                        if (!listEl.classList.contains('checklist-enabled')) {
                            checkbox.checked = false;
                            return;
                        }

                        if (checkbox.checked) {
                            // No skipping: ensure all previous are checked
                            for (let i = 0; i < idx; i++) {
                                if (!checkboxes[i].checked) {
                                    checkbox.checked = false;
                                    if (progressEl) {
                                        progressEl.textContent = 'Complete previous steps first.';
                                    }
                                    return;
                                }
                            }
                        } else {
                            // Cascade: uncheck all later steps
                            for (let i = idx + 1; i < checkboxes.length; i++) {
                                checkboxes[i].checked = false;
                                const li = checkboxes[i].closest('li');
                                if (li) li.classList.remove('completed');
                            }
                        }

                        const li = checkbox.closest('li');
                        if (li) {
                            li.classList.toggle('completed', checkbox.checked);
                        }

                        syncSequentialAvailability(checkboxes);
                        applyAndPersist();
                    });
                });

                if (checklistBtn) {
                    checklistBtn.addEventListener('click', () => {
                        const enabled = listEl.classList.contains('checklist-enabled');
                        if (enabled) {
                            disableChecklist();
                        } else {
                            enableChecklist();
                        }
                    });
                }

                // Start with checklist disabled by default.
                disableChecklist();
            }
        }

        // Wire up actions: copy and print
        const copyBtn = document.getElementById('copyStepsButton');
        const printBtn = document.getElementById('printStepsButton');

        if (copyBtn) {
            if (!steps || steps.length === 0) {
                copyBtn.style.display = 'none';
            } else {
                copyBtn.style.display = '';
                copyBtn.addEventListener('click', () => {
                    const text = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
                    const originalText = copyBtn.textContent;
                    copyTextToClipboard(text).then(() => {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                        }, 2000);
                    }).catch(() => {
                        copyBtn.textContent = 'Copy failed';
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                        }, 2000);
                    });
                });
            }
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
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

