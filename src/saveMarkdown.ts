import fs from 'fs/promises'

export default async function saveMarkdown(markdown: string, outputDir: string, fileName: string) {
  // 判断 outputDir 是否存在，不存在则创建
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(`${outputDir}/${fileName}.md`, markdown, { encoding: 'utf8' })
}
