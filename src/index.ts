#!/usr/bin/env bun
import { Command } from "commander";
import * as path from "path";
import * as fs from "fs/promises";
import { generateEPub } from "./epub";

const program = new Command();

program
  .name("mkepub")
  .description("A CLI tool to automatically generate EPUB files from Markdown documents")
  .version("1.0.0")
  .argument("<input-markdown>", "Path to the input Markdown file")
  .option("-o, --output <path>", "Path to the output EPUB file (default: <input-name>.epub)")
  .option("-c, --css <path>", "Path to a custom CSS stylesheet")
  .option("-t, --toc", "Enable automatic generation of the Table of Contents", false)
  .option("--title <string>", "Book title (default: first <h1> or filename)")
  .option("--author <string>", "Author name (default: Unknown)", "Unknown")
  .option("--cover <path>", "Path to the cover image file")
  .option("--lang <string>", "Language code for the EPUB (default: ja)", "ja")
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

      // Determine output path
      let outputPath = options.output;
      if (!outputPath) {
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
        cssPath: options.css ? path.resolve(options.css) : undefined,
        generateToc: !!options.toc,
        title: options.title,
        author: options.author,
        coverPath: options.cover ? path.resolve(options.cover) : undefined,
        lang: options.lang,
      });

    } catch (error) {
      console.error("An error occurred:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);
