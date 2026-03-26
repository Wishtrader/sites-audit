import axios from 'axios';
import * as cheerio from 'cheerio';
import whois from 'whois-json';

/**
 * Extract domain from URL
 * @param {string} url 
 * @returns {string}
 */
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Detect technologies from headers and HTML
 * @param {Object} headers - Response headers
 * @param {string} html - Page HTML
 * @returns {string}
 */
function detectTechnologies(headers, html) {
  const technologies = [];
  
  // Check headers
  const server = headers['server'] || '';
  const xPoweredBy = headers['x-powered-by'] || '';
  
  if (server.toLowerCase().includes('nginx')) technologies.push('Nginx');
  if (server.toLowerCase().includes('apache')) technologies.push('Apache');
  if (server.toLowerCase().includes('cloudflare')) technologies.push('Cloudflare');
  if (xPoweredBy.toLowerCase().includes('php')) technologies.push('PHP');
  if (xPoweredBy.toLowerCase().includes('express')) technologies.push('Express');
  
  // Check HTML for common technologies
  const htmlLower = html.toLowerCase();
  
  if (htmlLower.includes('wp-content') || htmlLower.includes('wordpress')) {
    technologies.push('WordPress');
  }
  if (htmlLower.includes('bitrix') || htmlLower.includes('bitrix24')) {
    technologies.push('Bitrix');
  }
  if (htmlLower.includes('wp-json')) {
    technologies.push('WordPress REST API');
  }
  if (htmlLower.includes('wix') || htmlLower.includes('wix.com')) {
    technologies.push('Wix');
  }
  if (htmlLower.includes('shopify')) {
    technologies.push('Shopify');
  }
  if (htmlLower.includes('webflow')) {
    technologies.push('Webflow');
  }
  if (htmlLower.includes('tilda')) {
    technologies.push('Tilda');
  }
  if (htmlLower.includes(' Elementor')) {
    technologies.push('Elementor');
  }
  if (htmlLower.includes('react') || htmlLower.includes('reactjs')) {
    technologies.push('React');
  }
  if (htmlLower.includes('vue.js') || htmlLower.includes('vuejs')) {
    technologies.push('Vue.js');
  }
  if (htmlLower.includes('next.js') || htmlLower.includes('nextjs')) {
    technologies.push('Next.js');
  }
  if (htmlLower.includes('bootstrap')) {
    technologies.push('Bootstrap');
  }
  if (htmlLower.includes('tailwind')) {
    technologies.push('Tailwind CSS');
  }
  if (htmlLower.includes('jquery')) {
    technologies.push('jQuery');
  }
  if (htmlLower.includes('google tag manager')) {
    technologies.push('Google Tag Manager');
  }
  if (htmlLower.includes('google analytics')) {
    technologies.push('Google Analytics');
  }
  if (htmlLower.includes('yandex.metrika')) {
    technologies.push('Yandex Metrika');
  }
  
  return technologies.length > 0 ? technologies.join(', ') : 'Unknown';
}

/**
 * Calculate SEO score based on various factors
 * @param {Object} data - Analysis data
 * @returns {{score: number, comment: string}}
 */
function calculateSeoScore(data) {
  let score = 0;
  const issues = [];
  const positives = [];
  
  // HTTP Status (20 points)
  if (data.httpStatus === 200) {
    score += 20;
    positives.push('HTTP 200 OK');
  } else {
    issues.push(`HTTP ${data.httpStatus}`);
  }
  
  // HTTPS (15 points)
  if (data.httpsEnabled) {
    score += 15;
    positives.push('HTTPS enabled');
  } else {
    issues.push('No HTTPS');
  }
  
  // Meta Title (15 points)
  if (data.metaTitleLength >= 30 && data.metaTitleLength <= 60) {
    score += 15;
    positives.push('Optimal title length');
  } else if (data.metaTitleLength > 0) {
    score += 5;
    issues.push('Title length not optimal');
  } else {
    issues.push('Missing title');
  }
  
  // Meta Description (15 points)
  if (data.metaDescriptionLength >= 120 && data.metaDescriptionLength <= 160) {
    score += 15;
    positives.push('Optimal description length');
  } else if (data.metaDescriptionExists) {
    score += 5;
    issues.push('Description length not optimal');
  } else {
    issues.push('Missing description');
  }
  
  // H1 (10 points)
  if (data.h1Exists) {
    score += 10;
    positives.push('H1 present');
  } else {
    issues.push('Missing H1');
  }
  
  // Robots.txt (10 points)
  if (data.robotsTxtExists) {
    score += 10;
    positives.push('robots.txt present');
  } else {
    issues.push('Missing robots.txt');
  }
  
  // Sitemap (5 points)
  if (data.sitemapExists) {
    score += 5;
    positives.push('sitemap.xml present');
  }
  
  // Favicon (5 points)
  if (data.faviconPresent) {
    score += 5;
    positives.push('Favicon present');
  } else {
    issues.push('Missing favicon');
  }
  
  // Indexable (5 points)
  if (data.indexable) {
    score += 5;
    positives.push('Indexable');
  } else {
    issues.push('Blocked from indexing');
  }
  
  let comment = '';
  if (positives.length > 0) {
    comment += '+ ' + positives.slice(0, 3).join(', ');
  }
  if (issues.length > 0) {
    if (comment) comment += '. ';
    comment += '- ' + issues.slice(0, 3).join(', ');
  }
  
  return { score, comment };
}

/**
 * Calculate speed score based on response time
 * @param {number} responseTimeMs 
 * @returns {{score: number, comment: string}}
 */
function calculateSpeedScore(responseTimeMs) {
  let score;
  let comment;
  
  if (responseTimeMs < 200) {
    score = 100;
    comment = `Very fast (${responseTimeMs}ms)`;
  } else if (responseTimeMs < 500) {
    score = Math.round(100 - (responseTimeMs - 200) * 0.1);
    comment = `Fast (${responseTimeMs}ms)`;
  } else if (responseTimeMs < 1000) {
    score = Math.round(70 - (responseTimeMs - 500) * 0.06);
    comment = `Average (${responseTimeMs}ms)`;
  } else if (responseTimeMs < 3000) {
    score = Math.round(50 - (responseTimeMs - 1000) * 0.015);
    comment = `Slow (${responseTimeMs}ms)`;
  } else {
    score = Math.max(0, Math.round(30 - (responseTimeMs - 3000) * 0.005));
    comment = `Very slow (${responseTimeMs}ms)`;
  }
  
  return { score: Math.max(0, score), comment };
}

/**
 * Check if page is indexable
 * @param {Object} $ - Cheerio object
 * @returns {boolean}
 */
function isIndexable($) {
  const metaRobots = $('meta[name="robots"]').attr('content') || $('meta[name="robots"]').attr('content') || '';
  const xRobotsTag = $('meta[name="x-robots-tag"]').attr('content') || '';
  
  const robotsContent = (metaRobots + xRobotsTag).toLowerCase();
  
  if (robotsContent.includes('noindex')) {
    return false;
  }
  
  return true;
}

/**
 * Analyze a single site
 * @param {string} url - URL to analyze
 * @returns {Promise<Object>} SiteReport object
 */
export async function analyzeSite(url) {
  const startTime = Date.now();
  
  // Default report in case of error
  const defaultReport = {
    url,
    technologies: '',
    speedScore: null,
    speedComment: 'Error analyzing site',
    seoScore: null,
    seoComment: 'Error analyzing site',
    siteCreatedAt: 'Unknown',
    homepageLastUpdatedAt: 'Unknown',
    httpStatus: 0,
    httpsEnabled: false,
    mobileFriendly: false,
    faviconPresent: false,
    metaTitle: '',
    metaTitleLength: 0,
    metaDescription: '',
    metaDescriptionLength: 0,
    metaDescriptionExists: false,
    h1Text: '',
    h1Exists: false,
    contentWordCount: 0,
    internalLinksCount: 0,
    externalLinksCount: 0,
    robotsTxtExists: false,
    sitemapExists: false,
    indexable: true,
    htmlSizeKb: 0,
    imagesTotal: 0,
    imagesWithoutAlt: 0,
    webVitalsScore: null
  };
  
  try {
    // Ensure URL has protocol
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = 'https://' + url;
    }
    
    // Fetch the page
    const response = await axios.get(targetUrl, {
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const responseTime = Date.now() - startTime;
    const html = response.data;
    const headers = response.headers;
    const $ = cheerio.load(html);
    
    // Extract metadata
    const metaTitle = $('title').first().text().trim();
    const metaTitleLength = metaTitle.length;
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const metaDescriptionLength = metaDescription.length;
    const metaDescriptionExists = metaDescriptionLength > 0;
    
    // H1
    const h1Text = $('h1').first().text().trim();
    const h1Exists = h1Text.length > 0;
    
    // Content word count
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const contentWordCount = bodyText.split(' ').filter(word => word.length > 0).length;
    
    // Links
    const links = $('a[href]');
    let internalLinksCount = 0;
    let externalLinksCount = 0;
    const domain = getDomain(targetUrl);
    
    links.each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      try {
        if (href.startsWith('http')) {
          const linkDomain = getDomain(href);
          if (linkDomain === domain) {
            internalLinksCount++;
          } else {
            externalLinksCount++;
          }
        } else if (href.startsWith('/') || href.startsWith('#')) {
          internalLinksCount++;
        }
      } catch (e) {
        // Invalid href, skip
      }
    });
    
    // Images
    const images = $('img');
    const imagesTotal = images.length;
    let imagesWithoutAlt = 0;
    
    images.each((i, el) => {
      const alt = $(el).attr('alt');
      if (!alt || alt.trim() === '') {
        imagesWithoutAlt++;
      }
    });
    
    // Favicon
    const favicon = $('link[rel*="icon"]').attr('href') || 
                   $('link[rel="shortcut icon"]').attr('href') || 
                   '/favicon.ico';
    let faviconPresent = false;
    try {
      const faviconUrl = new URL(favicon, targetUrl).href;
      const faviconResponse = await axios.head(faviconUrl).catch(() => null);
      faviconPresent = faviconResponse && faviconResponse.status === 200;
    } catch {
      faviconPresent = false;
    }
    
    // HTML size
    const htmlSizeBytes = Buffer.byteLength(html, 'utf8');
    const htmlSizeKb = Math.round(htmlSizeBytes / 1024 * 100) / 100;
    
    // HTTPS check
    const httpsEnabled = targetUrl.startsWith('https://');
    
    // Detect technologies
    const technologies = detectTechnologies(headers, html);
    
    // Speed score
    const speedScoreData = calculateSpeedScore(responseTime);
    
    // Robots.txt check
    let robotsTxtExists = false;
    try {
      const robotsUrl = new URL('/robots.txt', targetUrl).href;
      const robotsResponse = await axios.get(robotsUrl, { timeout: 5000 }).catch(() => null);
      robotsTxtExists = robotsResponse && robotsResponse.status === 200;
    } catch {
      robotsTxtExists = false;
    }
    
    // Sitemap check
    let sitemapExists = false;
    const sitemapUrls = [
      new URL('/sitemap.xml', targetUrl).href,
      new URL('/sitemap_index.xml', targetUrl).href,
      new URL('/sitemap-index.xml', targetUrl).href
    ];
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        const sitemapResponse = await axios.get(sitemapUrl, { timeout: 5000 }).catch(() => null);
        if (sitemapResponse && sitemapResponse.status === 200) {
          sitemapExists = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Indexable
    const indexable = isIndexable($);
    
    // Mobile friendly (simple check - viewport meta tag)
    const viewport = $('meta[name="viewport"]').attr('content');
    const mobileFriendly = !!viewport;
    
    // Homepage last updated
    const lastModified = headers['last-modified'] || 'Unknown';
    let homepageLastUpdatedAt = lastModified;
    if (lastModified !== 'Unknown') {
      try {
        const date = new Date(lastModified);
        homepageLastUpdatedAt = date.toISOString().split('T')[0];
      } catch {
        homepageLastUpdatedAt = lastModified;
      }
    }
    
    // Domain creation date (whois)
    let siteCreatedAt = 'Unknown';
    try {
      const whoisData = await whois(domain);
      if (whoisData && whoisData.createdDate) {
        const createdDate = whoisData.createdDate;
        if (createdDate instanceof Date) {
          siteCreatedAt = createdDate.toISOString().split('T')[0];
        } else if (typeof createdDate === 'string') {
          const parsed = new Date(createdDate);
          if (!isNaN(parsed)) {
            siteCreatedAt = parsed.toISOString().split('T')[0];
          }
        }
      }
    } catch (whoisError) {
      console.log(`Whois lookup failed for ${domain}:`, whoisError.message);
      siteCreatedAt = 'Unknown';
    }
    
    // SEO score
    const seoData = {
      httpStatus: response.status,
      httpsEnabled,
      metaTitleLength,
      metaDescriptionLength,
      metaDescriptionExists,
      h1Exists,
      robotsTxtExists,
      sitemapExists,
      faviconPresent,
      indexable
    };
    const seoScoreData = calculateSeoScore(seoData);
    
    // Web Vitals (simplified - based on response time)
    const webVitalsScore = Math.max(0, 100 - Math.round(responseTime / 50));
    
    return {
      url,
      technologies,
      speedScore: speedScoreData.score,
      speedComment: speedScoreData.comment,
      seoScore: seoScoreData.score,
      seoComment: seoScoreData.comment,
      siteCreatedAt,
      homepageLastUpdatedAt,
      httpStatus: response.status,
      httpsEnabled,
      mobileFriendly,
      faviconPresent,
      metaTitle,
      metaTitleLength,
      metaDescription,
      metaDescriptionLength,
      metaDescriptionExists,
      h1Text,
      h1Exists,
      contentWordCount,
      internalLinksCount,
      externalLinksCount,
      robotsTxtExists,
      sitemapExists,
      indexable,
      htmlSizeKb,
      imagesTotal,
      imagesWithoutAlt,
      webVitalsScore
    };
    
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error.message);
    return {
      ...defaultReport,
      speedComment: `Error: ${error.message}`,
      seoComment: `Error: ${error.message}`
    };
  }
}
