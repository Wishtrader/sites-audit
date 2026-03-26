/**
 * @typedef {Object} SiteReport
 * @property {string} url - The URL of the analyzed site
 * @property {string} technologies - Detected technologies (comma-separated)
 * @property {number|null} speedScore - Speed score 0-100
 * @property {string} speedComment - Speed comment with time info
 * @property {number|null} seoScore - SEO score 0-100
 * @property {string} seoComment - SEO issues and positives
 * @property {string} siteCreatedAt - Domain registration date (YYYY-MM-DD or text)
 * @property {string} homepageLastUpdatedAt - Last modified date from headers
 * @property {number} httpStatus - HTTP status code
 * @property {boolean} httpsEnabled - Whether HTTPS is enabled
 * @property {boolean} mobileFriendly - Whether page is mobile friendly
 * @property {boolean} faviconPresent - Whether favicon is present
 * @property {string} metaTitle - Page title
 * @property {number} metaTitleLength - Title length in characters
 * @property {string} metaDescription - Meta description
 * @property {number} metaDescriptionLength - Description length in characters
 * @property {boolean} metaDescriptionExists - Whether meta description exists
 * @property {string} h1Text - First H1 tag text
 * @property {boolean} h1Exists - Whether H1 exists
 * @property {number} contentWordCount - Word count in body content
 * @property {number} internalLinksCount - Number of internal links
 * @property {number} externalLinksCount - Number of external links
 * @property {boolean} robotsTxtExists - Whether robots.txt exists
 * @property {boolean} sitemapExists - Whether sitemap.xml exists
 * @property {boolean} indexable - Whether page is indexable (not blocked by robots)
 * @property {number} htmlSizeKb - HTML size in KB
 * @property {number} imagesTotal - Total number of images
 * @property {number} imagesWithoutAlt - Number of images without alt text
 * @property {number} webVitalsScore - Web Vitals score (simplified)
 */

export const SITE_REPORT_COLUMNS = [
  'URL',
  'Technologies',
  'SpeedScore',
  'SpeedComment',
  'SEOScore',
  'SEOComment',
  'SiteCreatedAt',
  'HomepageLastUpdatedAt',
  'HttpStatus',
  'HttpsEnabled',
  'MobileFriendly',
  'FaviconPresent',
  'MetaTitle',
  'MetaTitleLength',
  'MetaDescription',
  'MetaDescriptionLength',
  'MetaDescriptionExists',
  'H1Text',
  'H1Exists',
  'ContentWordCount',
  'InternalLinksCount',
  'ExternalLinksCount',
  'RobotsTxtExists',
  'SitemapExists',
  'Indexable',
  'HtmlSizeKb',
  'ImagesTotal',
  'ImagesWithoutAlt',
  'WebVitalsScore'
];
