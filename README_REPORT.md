# Site Audit Tool

Automated site audit tool that collects SEO and performance metrics and writes results to Google Sheets.

## Features

- **Speed Analysis**: Response time measurement with scoring
- **SEO Audit**: Title, description, H1, meta tags analysis
- **Technical Checks**: HTTPS, robots.txt, sitemap, favicon detection
- **Technology Detection**: Identifies CMS and frameworks (WordPress, Bitrix, etc.)
- **Link Analysis**: Internal and external link counting
- **Image Audit**: Checks for alt text on images
- **Domain Info**: Whois lookup for registration date

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Sheets API

#### Step 2.1: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Sheets API" and enable it
5. Navigate to **APIs & Services** > **Credentials**
6. Click **Create Credentials** > **OAuth client ID**
7. Configure consent screen (if prompted)
8. Select **Desktop app** as application type
9. Download the JSON file and save it as `credentials.json` in the project root

#### Step 2.2: Configure Environment Variables

Copy `.env.example` to `.env` and fill in your data:

```bash
cp .env.example .env
```

Edit `.env`:

```env
SHEETS_SPREADSHEET_ID=your_google_sheets_id
SHEETS_SHEET_NAME=Sheet1
```

To get `SHEETS_SPREADSHEET_ID`:
- Open your Google Sheet
- The ID is the long string in the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### 3. First Run (OAuth Authentication)

On first run, the tool will:
1. Generate an authentication URL
2. You need to open it and authorize the app
3. Copy the authorization code and paste it in the terminal
4. Token will be saved to `token.json`

```bash
npm run analyze:sites
```

## Usage

### Add Sites to Audit

Edit `sites.txt` and add one URL per line:

```
https://example.com
https://another-site.com
# Lines starting with # are comments
```

### Run Analysis

```bash
npm run analyze:sites
```

The tool will:
1. Read URLs from `sites.txt`
2. Analyze each site (speed, SEO, technologies, etc.)
3. Write results to Google Sheets

## Output Columns

The following metrics are collected for each site:

| Column | Description |
|--------|-------------|
| URL | Analyzed website URL |
| Technologies | Detected CMS/frameworks |
| SpeedScore | Speed score (0-100) |
| SpeedComment | Speed comment with response time |
| SEOScore | SEO score (0-100) |
| SEOComment | SEO issues and positives |
| SiteCreatedAt | Domain registration date |
| HomepageLastUpdatedAt | Last modified from headers |
| HttpStatus | HTTP response code |
| HttpsEnabled | HTTPS enabled (Yes/No) |
| MobileFriendly | Has viewport meta tag |
| FaviconPresent | Favicon detected |
| MetaTitle | Page title |
| MetaTitleLength | Title length |
| MetaDescription | Meta description |
| MetaDescriptionLength | Description length |
| MetaDescriptionExists | Description present |
| H1Text | First H1 tag |
| H1Exists | H1 tag present |
| ContentWordCount | Words in body |
| InternalLinksCount | Number of internal links |
| ExternalLinksCount | Number of external links |
| RobotsTxtExists | robots.txt found |
| SitemapExists | sitemap.xml found |
| Indexable | Not blocked by robots |
| HtmlSizeKb | HTML size in KB |
| ImagesTotal | Total images |
| ImagesWithoutAlt | Images missing alt text |
| WebVitalsScore | Simplified Web Vitals score |

## Project Structure

```
sites-audit/
├── sites.txt              # List of URLs to analyze
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore rules
├── credentials.json       # Google API credentials (not in git)
├── token.json             # OAuth token (not in git)
├── README_REPORT.md       # This file
└── scripts/
    ├── read-sites.mjs     # Read URLs from sites.txt
    ├── types.mjs         # Type definitions
    ├── analyze-site.mjs  # Single site analysis
    ├── google-sheets.mjs # Google Sheets API integration
    └── analyze-sites.mjs # Main entry point
```

## Troubleshooting

### "credentials.json not found"
You need to download OAuth credentials from Google Cloud Console. See Step 2.1 above.

### "token.json not found"
On first run, the tool will guide you through OAuth authentication. Follow the instructions in the terminal.

### Analysis fails for some sites
Some sites may block automated requests. Check the error messages in the console output.

## License

ISC
