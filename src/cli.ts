#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { scrapeArticle } from './post';
import saveMarkdown from './saveMarkdown';
import saveImages from './saveImages';

program
  .name('md-juejin')
  .description('A CLI tool to scrape Juejin articles and convert them to Markdown')
  .version('1.0.0');

program
  .command('post <url>')
  .description('Scrape a Juejin article and convert it to Markdown')
  .option('-o, --output <dir>', 'Output directory', `${process.env.HOME}/Desktop`)
  .action(async (url, options) => {
    try {
      console.log(chalk.blue(`Starting to scrape article from ${url}`));
      const articleInfo = await scrapeArticle(url);
      const path = `${options.output}/${articleInfo.title}`
      await saveMarkdown(articleInfo.markdown, path, articleInfo.title || 'untitled');
      await saveImages(articleInfo.images, path)
      console.log(chalk.green('Article scraped successfully!'));
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
