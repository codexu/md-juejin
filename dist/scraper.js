"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeArticle = scrapeArticle;
const playwright_1 = require("playwright");
const turndown_1 = __importDefault(require("turndown"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const ora_1 = __importDefault(require("ora"));
// Create a Turndown service for converting HTML to Markdown
const turndownService = new turndown_1.default({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});
// Add rule to handle code blocks with language specification
turndownService.addRule('codeBlocks', {
    filter: (node) => {
        return (node.nodeName === 'PRE' &&
            node.firstChild &&
            node.firstChild.nodeName === 'CODE');
    },
    replacement: (content, node) => {
        const code = node.textContent || '';
        const lang = node.getAttribute('data-lang') || '';
        return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    },
});
// Function to download an image
async function downloadImage(imageUrl, outputPath) {
    return new Promise((resolve, reject) => {
        // Create directory if it doesn't exist
        fs.ensureDirSync(path.dirname(outputPath));
        // Handle both relative and absolute URLs
        const fullUrl = imageUrl.startsWith('http')
            ? imageUrl
            : `https:${imageUrl}`;
        https.get(fullUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }
            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
            fileStream.on('error', (err) => {
                fs.unlinkSync(outputPath);
                reject(err);
            });
        }).on('error', reject);
    });
}
async function scrapeArticle(articleUrl, outputBaseDir) {
    const spinner = (0, ora_1.default)('Launching browser...').start();
    // Launch a browser
    const browser = await playwright_1.chromium.launch();
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        spinner.text = 'Navigating to article...';
        await page.goto(articleUrl, { waitUntil: 'networkidle' });
        // Wait for the article content to load
        await page.waitForSelector('.article-content', { timeout: 30000 });
        // Get the article title
        spinner.text = 'Extracting article information...';
        const title = await page.evaluate(() => {
            const titleElement = document.querySelector('.article-title');
            return titleElement ? titleElement.textContent?.trim() : 'Untitled Article';
        });
        // Sanitize the title for use as a directory/file name
        const sanitizedTitle = (0, sanitize_filename_1.default)(title || 'Untitled Article');
        // Create the output directory
        const outputDir = path.join(outputBaseDir, sanitizedTitle);
        fs.ensureDirSync(outputDir);
        // Get the article content
        const htmlContent = await page.evaluate(() => {
            const contentElement = document.querySelector('.article-content');
            return contentElement ? contentElement.innerHTML : '';
        });
        // Get all images in the article
        spinner.text = 'Finding images...';
        const images = await page.evaluate(() => {
            const imgElements = Array.from(document.querySelectorAll('.article-content img'));
            return imgElements.map(img => ({
                src: img.getAttribute('src') || '',
                alt: img.getAttribute('alt') || '',
            }));
        });
        // Download all images
        spinner.text = 'Downloading images...';
        const imagePromises = images.map(async (image, index) => {
            if (!image.src)
                return;
            const imageExt = path.extname(image.src) || '.png';
            const imageName = `image_${index}${imageExt}`;
            const imagePath = path.join(outputDir, imageName);
            try {
                await downloadImage(image.src, imagePath);
                // Replace the image URL in the HTML with the local path
                const relativeImagePath = `./${imageName}`;
                htmlContent.replace(image.src, relativeImagePath);
                return { originalSrc: image.src, localPath: relativeImagePath };
            }
            catch (error) {
                console.error(`Failed to download image ${image.src}:`, error);
                return null;
            }
        });
        await Promise.all(imagePromises.filter(Boolean));
        // Convert HTML to Markdown
        spinner.text = 'Converting to Markdown...';
        let markdown = turndownService.turndown(htmlContent);
        // Replace image URLs in the markdown with local paths
        for (const image of images) {
            if (!image.src)
                continue;
            const imageExt = path.extname(image.src) || '.png';
            const imageName = `image_${images.indexOf(image)}${imageExt}`;
            const relativeImagePath = `./${imageName}`;
            // Replace both absolute and relative URLs
            const absoluteUrl = image.src.startsWith('http') ? image.src : `https:${image.src}`;
            markdown = markdown.replace(new RegExp(image.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), relativeImagePath);
            markdown = markdown.replace(new RegExp(absoluteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), relativeImagePath);
        }
        // Add title as H1 at the beginning of the markdown
        markdown = `# ${title}\n\n${markdown}`;
        // Write the markdown to a file
        spinner.text = 'Saving Markdown file...';
        const outputFile = path.join(outputDir, `${sanitizedTitle}.md`);
        await fs.writeFile(outputFile, markdown, 'utf8');
        spinner.succeed(`Article saved to ${outputFile}`);
    }
    catch (error) {
        spinner.fail('Scraping failed');
        throw error;
    }
    finally {
        await browser.close();
    }
}
