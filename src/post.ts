import chalk from 'chalk'
import { chromium, BrowserContext } from 'playwright'
import TurndownService from 'turndown'
import { verify } from './verify'

const turndownPluginGfm = require('turndown-plugin-gfm')
const gfm = turndownPluginGfm.gfm
const tables = turndownPluginGfm.tables
const strikethrough = turndownPluginGfm.strikethrough
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
})
turndownService.use(gfm)
turndownService.use(tables)
turndownService.use(strikethrough)

export async function scrapeArticle(url: string, headless: boolean = true) {
  const browser = await chromium.launch({ headless, devtools: true, args: ['--disable-web-security'] })
  const context = await browser.newContext()
  const { title, markdown, images, createdAt } = await readArticle(context, url)
  await browser.close()
  return { title, markdown, images, createdAt }
}

export async function readArticle(context: BrowserContext, url: string)
  : Promise<{ title: string, markdown: string, images: { src: string, fileName: string }[], createdAt: string }> 
{
  const page = await context.newPage()
  await page.goto(url)
  try {
    await verify(page)
  } catch (error) {
  }
  try {
    await page.waitForSelector('.article-title', { timeout: 10000 })
    const titleDom = await page.$('.article-title')
    const title = (await titleDom?.textContent())?.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_') || ''
    const createdAt = (await (await page.$('.time'))?.textContent())?.trim() || '未获取到时间'
    await page.waitForSelector('#article-root', { timeout: 10000 })
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
    return { title, markdown, images, createdAt }
  } catch (error) {
    console.log(chalk.red('发生异常，请手动处理验证码'))
    return await scrapeArticle(url, false)
  }
}