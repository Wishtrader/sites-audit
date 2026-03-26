import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * Get OAuth2 client
 * @returns {Promise<OAuth2Client>}
 */
async function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '..', 'credentials.json');
  const tokenPath = path.join(__dirname, '..', 'token.json');
  
  // Check if credentials file exists
  if (!fs.existsSync(credentialsPath)) {
    throw new Error('credentials.json not found. Please download it from Google Cloud Console.');
  }
  
  // Load credentials
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  
  // Check if we have a stored token
  if (fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }
  
  // If no token, we need to generate one
  throw new Error('token.json not found. Please run the OAuth flow to generate it.');
}

/**
 * Get new OAuth2 token
 * @param {OAuth2Client} oAuth2Client 
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  
  console.log('Authorize this app by visiting this url:', authUrl);
  console.log('\nAfter authorization, the token will be saved to token.json');
  
  const tokenPath = path.join(__dirname, '..', 'token.json');
  const readline = (await import('readline')).createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Enter the code from the URL here: ', (code) => {
      readline.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('Error getting token', err);
          return;
        }
        fs.writeFileSync(tokenPath, JSON.stringify(token));
        console.log('Token stored to', tokenPath);
        resolve(token);
      });
    });
  });
}

/**
 * Get or create authenticated client
 * @returns {Promise<OAuth2Client>}
 */
async function getAuthClient() {
  const credentialsPath = path.join(__dirname, '..', 'credentials.json');
  const tokenPath = path.join(__dirname, '..', 'token.json');
  
  // Check if credentials file exists
  if (!fs.existsSync(credentialsPath)) {
    throw new Error('credentials.json not found. Please download it from Google Cloud Console.');
  }
  
  // Load credentials
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  
  // Check if we have a stored token
  if (fs.existsSync(tokenPath)) {
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    oAuth2Client.setCredentials(token);
    
    // Check if token is expired and refresh if needed
    if (token.expiry_date && token.expiry_date < Date.now()) {
      try {
        const { credentials: newCredentials } = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(newCredentials);
        fs.writeFileSync(tokenPath, JSON.stringify(newCredentials));
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError.message);
        // Try to get new token
        await getNewToken(oAuth2Client);
        const newToken = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
        oAuth2Client.setCredentials(newToken);
      }
    }
    
    return oAuth2Client;
  }
  
  // If no token, generate one
  await getNewToken(oAuth2Client);
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  oAuth2Client.setCredentials(token);
  
  return oAuth2Client;
}

/**
 * Write reports to Google Sheets
 * @param {Array<Object>} reports - Array of SiteReport objects
 */
export async function writeReportsToSheet(reports) {
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.SHEETS_SHEET_NAME || 'Sheet1';
  
  if (!spreadsheetId) {
    throw new Error('SHEETS_SPREADSHEET_ID is not set in .env file');
  }
  
  console.log(`Writing ${reports.length} reports to Google Sheets...`);
  console.log(`Spreadsheet ID: ${spreadsheetId}`);
  console.log(`Sheet name: ${sheetName}`);
  
  // Get authenticated client
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Column mapping
  const columns = [
    'url',
    'technologies',
    'speedScore',
    'speedComment',
    'seoScore',
    'seoComment',
    'siteCreatedAt',
    'homepageLastUpdatedAt',
    'httpStatus',
    'httpsEnabled',
    'mobileFriendly',
    'faviconPresent',
    'metaTitle',
    'metaTitleLength',
    'metaDescription',
    'metaDescriptionLength',
    'metaDescriptionExists',
    'h1Text',
    'h1Exists',
    'contentWordCount',
    'internalLinksCount',
    'externalLinksCount',
    'robotsTxtExists',
    'sitemapExists',
    'indexable',
    'htmlSizeKb',
    'imagesTotal',
    'imagesWithoutAlt',
    'webVitalsScore'
  ];
  
  const headerRow = columns.map(col => {
    // Convert camelCase to Title Case
    return col.replace(/([A-Z])/g, ' $1').trim();
  });
  
  // Prepare data rows
  const dataRows = reports.map(report => {
    return columns.map(col => {
      const value = report[col];
      if (value === undefined || value === null) return '';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return String(value);
    });
  });
  
  // Combine header and data
  const values = [headerRow, ...dataRows];
  
  try {
    // Try to get existing spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    console.log(`Spreadsheet title: ${spreadsheet.data.properties.title}`);
    
    // Find or create the sheet
    const existingSheet = spreadsheet.data.sheets.find(
      s => s.properties.title === sheetName
    );
    
    let sheetId;
    if (existingSheet) {
      sheetId = existingSheet.properties.sheetId;
      // Clear existing data
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A:ZZ`
      });
    } else {
      // Create new sheet
      const addSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: sheetName }
            }
          }]
        }
      });
      sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
    }
    
    // Write data
  const range = `${sheetName}!A1`;

	await sheets.spreadsheets.values.update({
		spreadsheetId,
		range,
		valueInputOption: 'USER_ENTERED',
		resource: { values },
	});
	
    console.log(`Successfully wrote ${reports.length} rows to Google Sheets!`);
    console.log(`Range: ${range}`);
    
  } catch (error) {
    console.error('Error writing to Google Sheets:', error.message);
    throw error;
  }
}
