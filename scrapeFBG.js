const { chromium } = require('playwright');
const fs = require('fs');
const falkenbergUrl ='https://www.falkenberg.se/evenemang';

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    await page.goto(`${falkenbergUrl}`, { waitUntil: 'domcontentloaded' });

    
    // ✅ Accept Cookiebot popup
    try {
        await page.getByRole('button', { name: 'Tillåt' }).click();
        console.log('✅ Cookie banner accepted using locator.');
    } catch (e) {
        console.log('⚠️ Cookie banner not found or already accepted.');
    }

    // Scroll to trigger lazy loading

    async function extractEvents(page){

        for(let i = 0; i < 3; i++){
            await page.mouse.wheel(0,1000);
            await page.waitForTimeout(1000);
        }

        await page.mouse.wheel(0, 1000);
        await page.waitForTimeout(2000);       
    
    // Extract events
    const events = await page.$$eval('div[class^="Teaser-module--component--MfbLW Teaser-module--event--zc0Dc"]', cards => {

    const months = {
    jan: '01', januari: '01',
    feb: '02', februari: '02',
    mar: '03', mars: '03',
    apr: '04', april: '04',
    maj: '05',
    jun: '06', juni: '06',
    jul: '07', juli: '07',
    aug: '08', augusti: '08', 'aug.': '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
};

    return cards.map(card => {
    const title = card.querySelector('h2')?.innerText.trim();
    const dateContainer = card.querySelector('div[class^="CalendarBadge-module--component"]');
    const monthText = dateContainer?.querySelector('div[class*="month"]')?.innerText.trim().toLowerCase();
    const dayText = dateContainer?.querySelector('div[class*="day"]')?.innerText.trim().padStart(2, '0');
    const link = card.querySelector('a')?.href; 
    const description = card.querySelector('p')?.innerText.trim();
    const attendanceRaw = card.querySelector('div[class^="CalendarBadge-module--occasions--I0+de"]')?.innerText.trim();
    let attendance = attendanceRaw?.replace('+', '') || null;
    if(attendance === null || attendance === undefined){
        attendance = String.empty;
    }

    let timeStart = Array.from(card.querySelectorAll('dt'))
    .find(dt => dt.textContent.trim() === 'Start date')
    ?.nextElementSibling?.textContent.trim();

    let timeEnd = Array.from(card.querySelectorAll('dt'))
    .find(dt => dt.textContent.trim() === 'End date')
    ?.nextElementSibling?.textContent.trim();

    let time = '';
    if (timeStart && timeEnd){
        time = `${timeStart}-${timeEnd}`;
    } 
    else if (timeStart)
    {
        time = timeStart;
    }

    const normalizedMonth = monthText?.replace('.', '') || '';
  const month = months[normalizedMonth] || '01';
  const day = dayText?.padStart(2, '0') || '01';
  const startDate = `2025-${month}-${day}`;



    const location = Array.from(card.querySelectorAll('dt'))
    .find(dt => dt.textContent.trim() === 'Location')
    ?.nextElementSibling?.textContent.trim();

    const img = card.querySelector('img')?.src;
    const ort = 'Falkenberg'
    return { title, dates: [{startDate,time: time}], link, description, location, time, img, attendance, ort};
    });
});

    return events;
    }



    //Categories
    const categories = ['Barn', 'Bio', 'Dans', 'Föreläsning', 'Gratis', 'Guidad tur', 'Historia', 'Höstlov', 'Humor', 'Jul', 'Konst', 'Marknad', 'Mat', 'Musik', 'Natur', 'Nöje', 'Restaurang'
        , 'Sommarlov', 'Spel', 'Sport', 'Sportlov', 'Tävling', 'Teater', 'Ungdom', 'Utomhus', 'Utställning'];

    const eventMap = new Map();

    for (const category of categories){            
    console.log(`Selecting category ${category}`)
    
    //remove previous selected category to prevent duplicates
    const removeButtons = await page.locator('[role="button"][aria-label^="Remove "]');
    const count = await removeButtons.count();

    for (let i = 0; i < count; i++) {
    const button = await removeButtons.nth(0);
    const label = await button.getAttribute('aria-label');
    await button.click();
    console.log(`❌ Removed: ${label}`);
    await page.waitForTimeout(500);
    }

    //Open dropdown menu
    await page.locator('.css-19bb58m').click();    
    await page.getByRole('option', { name: category, exact: true }).click();
    //Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    //Loop Through all pages to get all event data 
    let currentPage = 1; 

    while(true){
        console.log(`Scraping page ${currentPage}`);
        const events = await extractEvents(page);     

        //Add category to each event
        const categorizedEvents = events.map(e => ({ ...e }));
        const eventKey = (event) => `${event.title}-${event.date}-${event.time}-${event.location}`;

        // Use a Set to track unique keys      
        for (const event of categorizedEvents) {
        const key = eventKey(event);
        if (eventMap.has(key)) {
            // Already exists: push this category if not already present
            const existing = eventMap.get(key);
            if (!existing.categories.includes(category)) {
                existing.categories.push(category);
            }
        } else {
            // New event: add with category as array
            eventMap.set(key, {
                ...event,
                categories: [category]
            });
        }
    }

        const nextPage = await page.locator('span', {hasText: 'Nästa sida'});

        if(await nextPage.count() === 0){
            console.log('No more pages found');
            break;
        }          
                
        const nextPageLink = await nextPage.first().evaluateHandle(span => span.closest('a'));
        const nextPageElement = nextPageLink.asElement();

        if (!nextPageElement) {
        console.log('🚫 Next page link not found.');
        break;
        }
        
        await nextPageElement.click();
        await page.waitForLoadState('domcontentloaded');
        currentPage++;
        }
    }

    const allEvents = Array.from(eventMap.values());
    console.log(allEvents);

    fs.writeFileSync('eventsFBG.json', JSON.stringify(allEvents, null, 2), 'utf-8');
    console.log('📝 Events saved to eventsFBG.json');

    await browser.close();
})();