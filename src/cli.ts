#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { createStream } from 'table';
import { scrapeArticle } from './post';
import saveMarkdown from './saveMarkdown';
import saveImages from './saveImages';
import { scrapeArticles } from './posts';
import figlet from 'figlet';
import ora from 'ora';

console.log(figlet.textSync("md-juejin"));
console.log('')

program
  .name('md-juejin')
  .description('A CLI tool to scrape Juejin articles and convert them to Markdown')
  .version('1.0.3');

program
  .command('post <url>')
  .description('Scrape a Juejin article and convert it to Markdown')
  .option('-o, --output <dir>', 'Output directory', `${process.cwd()}/md-juejin`)
  .action(async (url, options) => {
    try {
      console.log(chalk.blue(`开始导出 ${url}`));
      const articleInfo = await scrapeArticle(url);
      const path = `${options.output}/${articleInfo.title || 'untitled'}`
      await saveMarkdown(articleInfo.markdown, path, articleInfo.title || 'untitled');
      await saveImages(articleInfo.images, path)
      console.log(chalk.green(`《${articleInfo.title}》导出成功，共 ${chalk.blue(articleInfo.images.length)} 张图片。`));
    } catch (error) {
      console.error(chalk.red('Error scraping article:'), error);
      process.exit(1);
    }
  });

program
  .command('posts <url>')
  .description('Scrape multiple Juejin articles and convert them to Markdown')
  .option('-o, --output <dir>', 'Output directory', `${process.cwd()}/md-juejin`)
  .action(async (url, options) => {
    try {
      const config = {
        columnCount: 4,
        columnDefault: {
          width: 10,
        },
        columns: {
          0: { width: 5 },
          1: { width: 50 },
          2: { width: 10 },
          3: { width: 15 },
        },
      };
      const stream = createStream(config);
      stream.write(['编号', '文章名称', '图片数量', '发布时间']);
      const spinner = ora('开始查询文章列表').start();
      const articleList = await scrapeArticles(url);
      for (const article of articleList) {
        const index = articleList.indexOf(article) + 1
        spinner.start(`正在导出《${article.title}》，进度：${index}/${articleList.length}`);
        const articleInfo = await scrapeArticle(article.url);
        const path = `${options.output}/${articleInfo.title}`
        await saveMarkdown(articleInfo.markdown, path, articleInfo.title);
        await saveImages(articleInfo.images, path)
        stream.write([`${index}`, articleInfo.title, `${articleInfo.images.length}`, articleInfo.createdAt]);
      }
      spinner.succeed(`导出成功 ${articleList.length}篇文章`);
      process.exit(0)
    } catch (error) {
      console.error(chalk.red('Error scraping articles:'), error);
      process.exit(1);
    }
  });

program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
