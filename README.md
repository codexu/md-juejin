# md-juejin

A CLI tool to scrape Juejin articles, convert them to Markdown, and save them along with their images.

## Features

- Scrape articles from Juejin
- Convert HTML content to Markdown format
- Download and save all images from the article
- Save the article and images to a directory on your Desktop

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/md-juejin.git
cd md-juejin

# Install dependencies
npm install

# Build the project
npm run build

# Link the package globally (optional)
npm link
```

## Usage

```bash
# Using npx
npx md-juejin scrape <article-url>

# If linked globally
md-juejin scrape <article-url>

# Specify a custom output directory
md-juejin scrape <article-url> --output /path/to/output
```

### Example

```bash
md-juejin scrape https://juejin.cn/post/7318704408727519270
```

This will:
1. Scrape the article from the provided URL
2. Convert the HTML content to Markdown
3. Download all images in the article
4. Save everything to a folder named after the article title on your Desktop

## Requirements

- Node.js 14 or higher
- npm or yarn

## License

MIT
