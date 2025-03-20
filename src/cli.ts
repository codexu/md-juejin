#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { scrapeArticle } from './post';
import saveMarkdown from './saveMarkdown';
import saveImages from './saveImages';
import { scrapeArticles } from './posts';

program
  .name('md-juejin')
  .description('A CLI tool to scrape Juejin articles and convert them to Markdown')
  .version('1.0.0');

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
      console.log(chalk.green(`导出成功 ${articleInfo.title}，共计${articleInfo.images.length}张图片。`));
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
      console.log(chalk.blue(`开始查询文章列表 ${url}`));
      const articleList = await scrapeArticles(url);
      console.log(chalk.blue(`共查询到${articleList.length}篇文章，开始导出...`));
      for (const article of articleList) {
        const articleInfo = await scrapeArticle(article.url);
        const path = `${options.output}/${articleInfo.title || 'untitled'}`
        await saveMarkdown(articleInfo.markdown, path, articleInfo.title || 'untitled');
        await saveImages(articleInfo.images, path)
        console.log(chalk.green(`导出成功 ${articleInfo.title}，共计${articleInfo.images.length}张图片。`));
      }
      console.log(chalk.green(`导出成功 ${articleList.length}篇文章`))
    } catch (error) {
      console.error(chalk.red('Error scraping article:'), error);
      process.exit(1);
    }
  });

program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
