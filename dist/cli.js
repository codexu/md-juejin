#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const scraper_1 = require("./scraper");
const chalk_1 = __importDefault(require("chalk"));
commander_1.program
    .name('md-juejin')
    .description('A CLI tool to scrape Juejin articles and convert them to Markdown')
    .version('1.0.0');
commander_1.program
    .command('scrape <url>')
    .description('Scrape a Juejin article and convert it to Markdown')
    .option('-o, --output <dir>', 'Output directory', `${process.env.HOME}/Desktop`)
    .action(async (url, options) => {
    try {
        console.log(chalk_1.default.blue(`Starting to scrape article from ${url}`));
        await (0, scraper_1.scrapeArticle)(url, options.output);
        console.log(chalk_1.default.green('Article scraped successfully!'));
    }
    catch (error) {
        console.error(chalk_1.default.red('Error scraping article:'), error);
        process.exit(1);
    }
});
commander_1.program.parse(process.argv);
// If no command is provided, show help
if (!process.argv.slice(2).length) {
    commander_1.program.outputHelp();
}
