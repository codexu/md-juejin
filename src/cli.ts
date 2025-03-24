#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
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
      const spinner = ora('开始查询文章列表').start();
      const articleList = await scrapeArticles(url);
      spinner.succeed(`文章列表查询成功，共 ${articleList.length} 篇文章。`);
      for (const article of articleList) {
        const index = articleList.indexOf(article) + 1
        spinner.start(`正在导出 (${index}/${articleList.length}) 《${article.title}》`);
        try {
          const articleInfo = await scrapeArticle(article.url);
          const path = `${options.output}/${articleInfo.title}`
          await saveMarkdown(articleInfo.markdown, path, articleInfo.title);
          await saveImages(articleInfo.images, path)
          spinner.succeed(`《${articleInfo.title}》导出成功，共 ${articleInfo.images.length} 张图片。`);
        } catch (error) {
          spinner.fail(`《${article.title}》导出失败`);
        }
      }
      spinner.succeed(`文章导出结束，导出路径：${options.output}`);
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
