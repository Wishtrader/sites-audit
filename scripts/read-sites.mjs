import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads URLs from ./sites.txt
 * Ignores empty lines and lines starting with #
 * @returns {string[]} Array of URLs
 */
export function readSites() {
  const sitesPath = path.join(__dirname, '..', 'sites.txt');
  
  if (!fs.existsSync(sitesPath)) {
    console.error('sites.txt not found!');
    return [];
  }
  
  const content = fs.readFileSync(sitesPath, 'utf-8');
  const lines = content.split('\n');
  
  const urls = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => !line.startsWith('#'));
  
  return urls;
}
