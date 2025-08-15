const fs = require('fs');

const files = ['eventsFBG.json', 'eventsVBG.json', 'eventsHSTD.json'];

let mergedEvents = [];

for (const file of files) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const events = JSON.parse(content);
        mergedEvents.push(...events);
        console.log(`✅ Loaded ${events.length} from ${file}`);
    } else {
        console.warn(`⚠️ File not found: ${file}`);
    }
}

fs.writeFileSync('allEvents.json', JSON.stringify(mergedEvents, null, 2), 'utf-8');
console.log(`📝 Merged total: ${mergedEvents.length} events saved to allEvents.json`);