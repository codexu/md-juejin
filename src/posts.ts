import axios from 'axios';
import { JuejinRes } from './juejin';
import { chromium } from 'playwright';
import { readArticle } from './post';
import ora from 'ora';
import saveMarkdown from './saveMarkdown';
import saveImages from './saveImages';
import dayjs from 'dayjs';
import { access } from 'fs/promises';

const open = require('open');

let isMore = true

export async function fetchPostsList(url: string) {
  const user_id = url.split('/')[4]
  let cursor = 0;
  const articleList: { title: string, url: string}[] = []
  while (isMore) {
    const res = await fetchPosts(user_id, cursor)
    cursor += 10
    articleList.push(...res)
    if (!res.length) break
  }
  return articleList
}

async function fetchPosts(user_id: string, cursor: number) {
  const body = {
    user_id,
    sort_type: 2,
    cursor: `${cursor}`,
  }
  const { data } = await axios.post<JuejinRes>('https://api.juejin.cn/content_api/v1/article/query_list', body)
  isMore = data.has_more
  return data.data.map((item) => ({
    title: item.article_info.title,
    url: `https://juejin.cn/post/${item.article_info.article_id}`
  }))
}

export async function scrapeArticles({
  url,
  spinner,
  options,
  startTime
}: {
  url: string,
  spinner: ora.Ora
  options: {
    output: string
  },
  startTime: dayjs.Dayjs
}) {
  const articleList = await fetchPostsList(url)
  spinner.succeed(`文章列表查询成功，共 ${articleList.length} 篇文章。`);
  const browser = await chromium.launch({ headless: true, devtools: true, args: ['--disable-web-security'] })
  const context = await browser.newContext()
  let endIndex = 0;
  for (const article of articleList) {
    endIndex += 1
    spinner.start(`${endIndex}/${articleList.length} 正在导出《${article.title}》`);
    try {
      // 判断是否已经存在
      const filePath = `${options.output}/${article.title?.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_') || ''}`
      const isExist = await access(filePath).then(() => true).catch(() => false)
      if (isExist) {
        spinner.succeed(`${endIndex}/${articleList.length}《${article.title}》已存在，跳过。`);
        continue
      }
      const articleInfo = await readArticle(context, article.url);
      const path = `${options.output}/${articleInfo.title}`
      await saveMarkdown(articleInfo.markdown, path, articleInfo.title);
      await saveImages(articleInfo.images, path)
      spinner.succeed(`${endIndex}/${articleList.length}《${articleInfo.title}》导出成功，共 ${articleInfo.images.length} 张图片。`);
    } catch (error) {
      spinner.fail(`${endIndex}/${articleList.length}《${article.title}》导出失败`);
    }
  }
  await browser.close()
  spinner.succeed(`文章导出结束，花费 ${dayjs().diff(startTime, 'second')} 秒，导出路径：${options.output}`);
  const endTime = dayjs()
  console.log(`总耗时：${endTime.diff(startTime, 'second')}秒`)
  await open(options.output)
  process.exit(0)
}