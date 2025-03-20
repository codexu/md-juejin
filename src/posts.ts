import { chromium, Page } from 'playwright'

export async function scrapeArticles(url: string) {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  await page.waitForSelector('.post-list-header', { timeout: 5000 })
  await autoScroll(page)
  const articles = await page.$$('.entry-list>.item')
  const articleList = []
  for (const article of articles) {
    const title = await article.$eval('.title', el => el.textContent?.trim().replace(/\s+/g, ''))
    const url = await article.$eval('.title', el => el.getAttribute('href'))
    articleList.push({ title, url: `https://juejin.cn${url}` })
  }
  await browser.close()
  return articleList
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    return new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      let scrollAttempts = 0;
      const maxScrollAttempts = 100;
      let timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrollAttempts++;
        if (totalHeight >= scrollHeight - window.innerHeight || scrollAttempts >= maxScrollAttempts) {
          clearInterval(timer);
          resolve();
        }
      }, 500);
    });
  });
  await page.waitForTimeout(1000);
}