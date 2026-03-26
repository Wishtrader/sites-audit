import { readSites } from './read-sites.mjs';
import { analyzeSite } from './analyze-site.mjs';
import { writeReportsToSheet } from './google-sheets.mjs';

/**
 * Main function to analyze all sites
 */
async function main() {
  console.log('='.repeat(50));
  console.log('Site Audit Tool - Starting Analysis');
  console.log('='.repeat(50));
  
  // Read sites from file
  const urls = readSites();
  
  if (urls.length === 0) {
    console.log('No sites to analyze. Please add URLs to sites.txt');
    return;
  }
  
  console.log(`Found ${urls.length} sites to analyze:`, urls);
  console.log('');
  
  // Analyze each site
  const reports = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Analyzing: ${url}`);
    
    try {
      const report = await analyzeSite(url);
      reports.push(report);
      successCount++;
      console.log(`  - Speed: ${report.speedScore || 'N/A'}, SEO: ${report.seoScore || 'N/A'}`);
    } catch (error) {
      errorCount++;
      console.error(`  - Error: ${error.message}`);
    }
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log(`Analysis complete: ${successCount} successful, ${errorCount} errors`);
  console.log('='.repeat(50));
  console.log('');
  
  // Write to Google Sheets
  if (reports.length > 0) {
    try {
      await writeReportsToSheet(reports);
      console.log('');
      console.log('='.repeat(50));
      console.log('Results written to Google Sheets!');
      console.log('='.repeat(50));
    } catch (error) {
      console.error('Failed to write to Google Sheets:', error.message);
      console.log('\nReports data (in case you want to export manually):');
      console.log(JSON.stringify(reports, null, 2));
    }
  }
}

// Run the main function
main().catch(console.error);
