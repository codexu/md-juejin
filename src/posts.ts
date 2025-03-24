import axios from 'axios';
import { JuejinRes } from './juejin';

let isMore = true

export async function scrapeArticles(url: string) {
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
