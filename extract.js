(function () {
    const VERSION = "1.27-WIRE";
    console.log(`[Indeed Insight] Extractor ${VERSION} initialized`);

    let knownJobs = new Map();

    // 1. Unified Deep Search
    function deepSearch(obj, results = [], depth = 0, seen = new Set()) {
        if (!obj || depth > 8 || seen.has(obj)) return results;
        seen.add(obj);

        if (Array.isArray(obj)) {
            for (let item of obj) {
                if (item && (item.jobkey || item.jobKey)) {
                    results.push(item);
                } else {
                    deepSearch(item, results, depth + 1, seen);
                }
            }
        } else if (typeof obj === 'object') {
            if (obj.results && Array.isArray(obj.results)) {
                deepSearch(obj.results, results, depth + 1, seen);
            }
            for (let key in obj) {
                if (key === 'window' || key === 'parent' || key === 'top') continue;
                try { deepSearch(obj[key], results, depth + 1, seen); } catch (e) { }
            }
        }
        return results;
    }

    function processBatch(batch) {
        if (!Array.isArray(batch)) return;
        const newBatch = [];
        batch.forEach(job => {
            const jk = job.jobkey || job.jobKey;
            if (jk && !knownJobs.has(jk)) {
                knownJobs.set(jk, job);
                newBatch.push(job);
            }
        });

        if (newBatch.length > 0) {
            console.log(`[Indeed Insight] WIRE Caught ${newBatch.length} new jobs. Total: ${knownJobs.size}`);
            window.postMessage({
                type: 'INDEED_DATA_EXTRACTED',
                data: newBatch,
                totalCount: knownJobs.size
            }, '*');
        }
    }

    // 2. Monkey-patch FETCH to intercept infinite scroll
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        // Clone response to avoid interfering with Indeed's own read
        const clone = response.clone();

        try {
            const contentType = clone.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await clone.json();
                const found = deepSearch(data);
                if (found.length > 0) {
                    processBatch(found);
                }
            }
        } catch (e) {
            // Silently fail if not JSON or other error
        }

        return response;
    };

    // 3. Keep the periodic scan as a fallback for initial load
    function scanMemory() {
        const found = [];
        if (window.mosaic) deepSearch(window.mosaic, found);
        if (window.__NEXT_DATA__) deepSearch(window.__NEXT_DATA__, found);
        processBatch(found);
    }

    setInterval(scanMemory, 3000);
    scanMemory();
})();
