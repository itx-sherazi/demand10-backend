import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads an HTML template file and replaces placeholders with provided data
 * @param {string} templateName - Name of the template file (without .html extension)
 * @param {Object} data - Data to populate the template with
 * @returns {Promise<string>} - Populated HTML template
 */
export const readAndPopulateTemplate = async (templateName, data) => {
  try {
    // Construct the full path to the template file
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
    
    // Read the template file
    const template = await fs.readFile(templatePath, 'utf8');
    
    // Replace placeholders with actual data
    let populatedTemplate = template;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      // Handle cases where value might be undefined or null
      const replacement = value !== undefined && value !== null ? value : 'Not provided';
      populatedTemplate = populatedTemplate.replace(new RegExp(placeholder, 'g'), replacement);
    }
    
    // Replace currentYear placeholder with actual year
    const currentYearPlaceholder = '{{currentYear}}';
    populatedTemplate = populatedTemplate.replace(new RegExp(currentYearPlaceholder, 'g'), new Date().getFullYear());
    
    return populatedTemplate;
  } catch (error) {
    console.error(`Error reading or populating template ${templateName}:`, error);
    throw error;
  }
};