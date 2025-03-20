import { chromium } from 'playwright'
import TurndownService from 'turndown'

const turndownPluginGfm = require('turndown-plugin-gfm')
const gfm = turndownPluginGfm.gfm
const tables = turndownPluginGfm.tables
const strikethrough = turndownPluginGfm.strikethrough

export async function scrapeArticle(url: string) {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  })
  turndownService.use(gfm)
  turndownService.use(tables)
  turndownService.use(strikethrough)
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForSelector('.article-title', { timeout: 30000 })
  const titleDom = await page.$('.article-title')
  const title = (await titleDom?.textContent())?.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_')
  await page.waitForSelector('#article-root', { timeout: 30000 })
  const article = await page.$('#article-root')
  await article?.$$eval('style', (styles) => styles.forEach(style => style.remove()))
  await article?.$$eval('.code-block-extension-header', (headers) => headers.forEach(header => header.remove()))
  const images = await article?.$$eval('img', (images) => images.map((img, index) => {
    const src = img.getAttribute('src') || ''
    const alt = img.getAttribute('alt') || 'png'
    const ext = alt.split('.').pop() || 'png'
    const fileName = `${index + 1}.${ext}`
    return { src, fileName }
  })) || []
  await article?.$$eval('img', (imgs) => {
    imgs.forEach((img, index) => {
      const ext = img.getAttribute('alt')?.split('.').pop() || 'png'
      const filename = `${index + 1}.${ext}`
      img.setAttribute('src', filename)
    })
  })
  const contentHtml = `<h1>${title}</h1>${await article?.innerHTML()}`
  const markdown = turndownService.turndown(contentHtml)
  await browser.close()
  return { title, markdown, images }
}
