const { execSync } = require('child_process');

try {
    console.log('🚀 Running scrapers...');
    execSync('node scrapeFBG.js', { stdio: 'inherit' });
    execSync('node scrapeVBG.js', { stdio: 'inherit' });
    execSync('node scrapeHSTD.js', { stdio: 'inherit' });

    console.log('🔀 Merging...');
    execSync('node mergeEvents.js', { stdio: 'inherit' });

    console.log('📤 Uploading...');
    execSync('node uploadEvents.js', { stdio: 'inherit' });

    console.log('🎉 Done!');
} catch (e) {
    console.error('❌ Something went wrong during the scraping/uploading process.');
}