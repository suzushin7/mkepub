#!/usr/bin/env bun
import { Command } from "commander";
import * as path from "path";
import * as fs from "fs/promises";
import { parse as parseYaml } from "yaml";
import { generateEPub } from "./epub";

const program = new Command();

program
  .name("mkepub")
  .description("A CLI tool to automatically generate EPUB files from Markdown documents")
  .version("1.0.0")
  .argument("<input-markdown>", "Path to the input Markdown file")
  .option("-o, --output <path>", "Path to the output EPUB file (default: <input-name>.epub)")
  .option("-c, --css <path>", "Path to a custom CSS stylesheet")
  .option("-t, --toc", "Enable automatic generation of the Table of Contents")
  .option("--title <string>", "Book title (default: first <h1> or filename)")
  .option("--author <string>", "Author name")
  .option("--cover <path>", "Path to the cover image file")
  .option("--lang <string>", "Language code for the EPUB")
  .action(async (inputMarkdown, options) => {
    try {
      const markdownPath = path.resolve(inputMarkdown);
      
      // Check input file existence
      try {
        await fs.access(markdownPath);
      } catch {
        console.error(`Error: Input file not found: ${inputMarkdown}`);
        process.exit(1);
      }

      // Read file and parse YAML frontmatter if exists
      const markdownContent = await fs.readFile(markdownPath, "utf-8");
      let frontmatter: any = {};
      const fmMatch = markdownContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
      if (fmMatch && fmMatch[1]) {
        try {
          frontmatter = parseYaml(fmMatch[1]) || {};
        } catch (error) {
          console.warn("Warning: Failed to parse YAML frontmatter.", error);
        }
      }

      // Merge options (CLI options take precedence over YAML frontmatter, then defaults)
      const mergedOptions = {
        title: options.title || frontmatter.title,
        author: options.author || frontmatter.author || "Unknown",
        lang: options.lang || frontmatter.lang || "ja",
        generateToc: options.toc !== undefined ? !!options.toc : (frontmatter.toc !== undefined ? !!frontmatter.toc : false),
      };

      // Resolve CSS path
      let cssPath: string | undefined;
      if (options.css) {
        cssPath = path.resolve(options.css);
      } else if (frontmatter.css) {
        cssPath = path.resolve(path.dirname(markdownPath), frontmatter.css);
      }

      // Resolve Cover path
      let coverPath: string | undefined;
      if (options.cover) {
        coverPath = path.resolve(options.cover);
      } else if (frontmatter.cover) {
        coverPath = path.resolve(path.dirname(markdownPath), frontmatter.cover);
      }

      // Resolve Output path
      let outputPath: string;
      if (options.output) {
        outputPath = path.resolve(options.output);
      } else if (frontmatter.output) {
        outputPath = path.resolve(path.dirname(markdownPath), frontmatter.output);
      } else {
        const ext = path.extname(markdownPath);
        outputPath = path.join(
          path.dirname(markdownPath),
          path.basename(markdownPath, ext) + ".epub"
        );
      }
      outputPath = path.resolve(outputPath);

      console.log("Starting EPUB generation...");
      console.log(`Input: ${markdownPath}`);
      console.log(`Output: ${outputPath}`);

      await generateEPub({
        markdownPath,
        outputPath,
        cssPath,
        generateToc: mergedOptions.generateToc,
        title: mergedOptions.title,
        author: mergedOptions.author,
        coverPath,
        lang: mergedOptions.lang,
      });

    } catch (error) {
      console.error("An error occurred:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);

