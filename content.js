// Indeed Job Insights - Content Script (Version 1.28)
console.log("[Indeed Insight] Content Script 1.28 Loading...");

let rawJobMap = new Map();
let blockedCompanies = new Set();

// 1. Settings Sync
function syncState() {
    chrome.storage.local.get(['blockedEmployers'], (res) => {
        blockedCompanies = new Set(res.blockedEmployers || []);
        console.log(`[Indeed Insight] Sync: Blocked=${blockedCompanies.size}`);
        processPage();
    });
}

chrome.storage.onChanged.addListener((changes) => {
    if (changes.blockedEmployers) syncState();
});

syncState();

// 2. Data Bridge from MAIN world
window.addEventListener('message', (event) => {
    if (event.source !== window || event.data.type !== 'INDEED_DATA_EXTRACTED') return;

    if (Array.isArray(event.data.data)) {
        event.data.data.forEach(job => {
            const jk = job.jobkey || job.jobKey;
            if (jk) rawJobMap.set(jk, job);
        });
        processPage();
    }
});

function getJK(card) {
    return card.getAttribute('data-jk') ||
        card.querySelector('[data-jk]')?.getAttribute('data-jk') ||
        card.querySelector('a[href*="jk="]')?.href.match(/jk=([a-z0-9]+)/)?.[1] ||
        null;
}

function parseApps(val) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const n = parseInt(val.replace(/[^0-9]/g, ''));
        return isNaN(n) ? 0 : n;
    }
    return 0;
}

// 3. UI Synchronization
function processPage() {
    const cards = document.querySelectorAll('.job_seen_beacon, [data-testid="jobCard"], .result');

    cards.forEach(card => {
        const companyEl = card.querySelector('.companyName, [data-testid="company-name"], .company_location .companyName');
        const companyName = companyEl?.textContent?.trim() || "";

        // Blocking Filter
        if (companyName && blockedCompanies.has(companyName)) {
            card.style.display = 'none';
            return;
        }

        const jk = getJK(card);
        const data = jk ? rawJobMap.get(jk) : null;

        if (card.style.display === 'none') {
            card.style.display = '';
        }

        if (data) {
            injectUI(card, data, companyName, jk);
        }
    });
}

function injectUI(card, data, companyName, jk) {
    const id = `insight-v28-${jk}`;
    if (card.querySelector(`#${id}`)) return;

    // Cleanup old versions
    card.querySelectorAll('[id^="insight-v"]').forEach(el => el.remove());
    card.querySelectorAll('.indeed-insights-container').forEach(el => el.remove());

    const container = document.createElement('div');
    container.id = id;
    container.className = 'indeed-insights-container';
    container.style.cssText = `
        display: flex; gap: 8px; margin: 10px 0; padding: 6px; 
        border: 1px dashed rgba(37, 87, 167, 0.4); border-radius: 8px; 
        background: #fff; align-items: center; width: fit-content; clear: both;
    `;

    const time = data.createDate || data.pubDate;
    const apps = parseApps(data.applyCount || data.organicApplyStartCount);
    const days = time ? Math.floor((Date.now() - time) / 86400000) : 0;

    // Traffic Light Color Coding
    let col = '#64748b'; // Default Slate
    if (days <= 2 && apps < 50) col = '#1e8e3e'; // Green (Optimal)
    else if (days > 7 || apps >= 150) col = '#d93025'; // Red (High Competition)
    else col = '#f59e0b'; // Amber (Normal)

    if (apps > 0) container.appendChild(badge(`${apps} apps`, col));
    if (time) {
        const lbl = days === 0 ? 'Today' : (days === 1 ? 'Yesterday' : `${days}d ago`);
        container.appendChild(badge(lbl, col));
    }

    const btn = document.createElement('button');
    btn.textContent = 'Block';
    btn.style.cssText = `
        font-size: 10px; background: #fee2e2; color: #dc2626; border: none; 
        padding: 2px 8px; border-radius: 4px; cursor: pointer; margin-left: 10px; font-weight: bold;
    `;
    btn.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (confirm(`Block all postings from "${companyName}"?`)) {
            blockedCompanies.add(companyName);
            chrome.storage.local.set({ blockedEmployers: Array.from(blockedCompanies) });
        }
    };
    container.appendChild(btn);

    const anchor = card.querySelector('.jobsearch-JobMetadataFooter, [data-testid="jobCard-footer"], .jobTitle, h2');
    if (anchor) anchor.parentNode.insertBefore(container, anchor.nextSibling);
    else card.prepend(container);
}

function badge(txt, col) {
    const s = document.createElement('span');
    s.textContent = txt;
    s.style.cssText = `font-size: 11px; padding: 2px 10px; border-radius: 12px; font-weight: bold; background: ${col}; color: white;`;
    return s;
}

// 4. Stable Sync Interval
setInterval(processPage, 2000);
processPage();
