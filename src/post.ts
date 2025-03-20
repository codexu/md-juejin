import { chromium } from 'playwright'
import TurndownService from 'turndown'

const turndownPluginGfm = require('turndown-plugin-gfm')
const gfm = turndownPluginGfm.gfm
const tables = turndownPluginGfm.tables
const strikethrough = turndownPluginGfm.strikethrough

const turndownService = new TurndownService()
turndownService.use(gfm)
turndownService.use(tables)
turndownService.use(strikethrough)

export async function scrapeArticle(url: string) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForSelector('.article-title', { timeout: 5000 })
  const titleDom = await page.$('.article-title')
  const title = (await titleDom?.textContent())?.trim().replace(/\s+/g, '')
  await page.waitForSelector('#article-root', { timeout: 5000 })
  const article = await page.$('#article-root')
  await article?.$$eval('style', (styles) => styles.forEach(style => style.remove()))
  const contentHtml = `<h1>${title}</h1>${await article?.innerHTML()}`
  console.log(contentHtml);
  const markdown = turndownService.turndown(contentHtml)
  await browser.close()
  return { title, markdown }
}
