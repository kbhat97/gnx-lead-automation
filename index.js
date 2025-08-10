// puppeteer-api/index.js
// Custom API for automated lead generation and WordPress detection
// Built for GNX Automation - AI-powered business lead qualification

const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = 3001;

// Utility function for delays between operations
function delay(time) { 
    return new Promise(resolve => setTimeout(resolve, time)); 
}

/**
 * Core Google Maps scraping function
 * Extracts business information from Google Maps search results
 * @param {string} searchQuery - The search term (e.g., "plumbers in Ottawa")
 * @param {number} limit - Maximum number of results to extract
 * @returns {Array} Array of business objects with Name, Address, Contact, Website
 */
async function scrapeGoogleMaps(searchQuery, limit) {
    console.log(`🚀 Starting Google Maps scrape for: "${searchQuery}" with limit: ${limit}`);
    
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--single-process'
        ] 
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const allResults = [];
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    try {
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('div[role="feed"]', { timeout: 10000 });

        // Process each business listing sequentially
        for (let i = 0; i < limit; i++) {
            const businessLinksSelector = 'a.hfpxzc';
            const cards = await page.$$(businessLinksSelector);
            
            if (i >= cards.length) { 
                console.log(`  -> No more listings found. Total scraped: ${i}`); 
                break; 
            }

            const cardToClick = cards[i];
            const name = await cardToClick.evaluate(el => el.getAttribute('aria-label')).catch(() => null);

            if (!name) continue;
            console.log(`    -> Processing listing ${i + 1}: ${name}`);

            try {
                await cardToClick.click();
                await delay(4000); // Wait for details panel to load

                // Extract business information using data selectors
                const phone = await page.$eval('[data-tooltip*="phone number"]', el => el.textContent).catch(() => null);
                const website = await page.$eval('a[data-tooltip*="website"]', el => el.href).catch(() => null);
                const address = await page.$eval('[data-tooltip*="address"]', el => el.textContent).catch(() => null);
                
                // Structure data to match Google Sheets columns
                allResults.push({ 
                    Name: name, 
                    Addresses: address, 
                    Contact: phone, 
                    Website: website 
                });
                
            } catch (err) {
                console.log(`      Could not fully scrape ${name}. Error: ${err.message}`);
            } finally {
                // Return to search results for next iteration
                await page.goto(searchUrl, { waitUntil: 'networkidle2' });
                await delay(2000);
            }
        }
    } catch (error) {
        console.error(`❌ Scraping failed for query "${searchQuery}":`, error.message);
    } finally {
        console.log(`🏁 Scraping completed. Found ${allResults.length} businesses.`);
        await browser.close();
    }
    
    return allResults;
}

/**
 * API Endpoint: /scrape
 * Handles dynamic lead generation requests from n8n workflows
 * Query params: ?query=plumbers&location=Ottawa&limit=5
 */
app.get('/scrape', async (req, res) => {
    const { query, location, limit = 5 } = req.query;
    
    if (!query || !location) {
        return res.status(400).json({ 
            error: 'Missing required parameters', 
            required: '?query=business_type&location=city_name' 
        });
    }

    try {
        const fullQuery = `${query} in ${location}`;
        const leads = await scrapeGoogleMaps(fullQuery, parseInt(limit, 10));
        
        console.log(`✅ API request successful. Returning ${leads.length} leads for "${fullQuery}"`);
        res.json(leads);
        
    } catch (error) {
        console.error(`[API ERROR] Scraping failed:`, error.message);
        res.status(500).json({ 
            error: 'Scraping operation failed', 
            details: error.message 
        });
    }
});

/**
 * API Endpoint: /check-site  
 * Analyzes websites to detect WordPress installation
 * Query params: ?url=https://example.com
 */
app.get('/check-site', async (req, res) => {
    const { url } = req.query;
    
    if (!url) { 
        return res.status(400).json({ 
            error: 'Missing required parameter: ?url=website_to_check' 
        }); 
    }

    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'] 
        });
        
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(45000); // 45 second timeout
        
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const html = await page.content();
        
        // WordPress detection logic - looks for common WordPress indicators
        const isWordPress = html.includes('wp-content') || 
                           html.includes('wp-includes') || 
                           html.includes('wp-json');
        
        console.log(`🔍 WordPress check for ${url}: ${isWordPress ? 'YES' : 'NO'}`);
        res.json({ url, isWordPress });
        
    } catch (error) {
        console.error(`[SITE CHECK ERROR] Failed to analyze ${url}:`, error.message);
        res.status(500).json({ 
            error: 'Website analysis failed', 
            url: url,
            details: error.message 
        });
    } finally {
        if (browser) await browser.close();
    }
});

// Health check endpoint for Docker monitoring
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'puppeteer-api' 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GNX Lead Automation API running on http://0.0.0.0:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET /scrape?query=business&location=city&limit=5`);
    console.log(`   GET /check-site?url=https://example.com`);
    console.log(`   GET /health`);
});
