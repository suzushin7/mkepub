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
  .argument("<input-markdowns...>", "Paths to the input Markdown files")
  .option("-o, --output <path>", "Path to the output EPUB file (default: <first-input-name>.epub)")
  .option("-c, --css <path>", "Path to a custom CSS stylesheet")
  .option("-t, --toc", "Enable automatic generation of the Table of Contents")
  .option("--title <string>", "Book title (default: first <h1> or filename)")
  .option("--author <string>", "Author name")
  .option("--cover <path>", "Path to the cover image file")
  .option("--lang <string>", "Language code for the EPUB")
  .option("-d, --direction <string>", "Page progression direction (ltr or rtl)")
  .action(async (inputMarkdowns: string[], options) => {
    try {
      const markdownPaths = inputMarkdowns.map((p: string) => path.resolve(p));
      
      // Check input files existence
      for (const p of markdownPaths) {
        try {
          await fs.access(p);
        } catch {
          console.error(`Error: Input file not found: ${p}`);
          process.exit(1);
        }
      }

      // Base markdown path for resolving relative paths (using the first file)
      const markdownPath = markdownPaths[0];
      if (!markdownPath) {
        console.error("Error: No input files specified.");
        process.exit(1);
      }

      let frontmatter: any = {};
      let mergedBodyContent = "";

      for (let i = 0; i < markdownPaths.length; i++) {
        const p = markdownPaths[i] || "";
        const markdownContent = await fs.readFile(p, "utf-8");
        
        let fileFrontmatter: any = {};
        let body = markdownContent;
        const fmMatch = markdownContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
        
        if (fmMatch && fmMatch[1]) {
          try {
            fileFrontmatter = parseYaml(fmMatch[1]) || {};
            body = markdownContent.substring(fmMatch[0].length);
          } catch (error) {
            console.warn(`Warning: Failed to parse YAML frontmatter in ${p}.`, error);
          }
        }

        // Use the frontmatter of the first file as the primary configuration
        if (i === 0) {
          frontmatter = fileFrontmatter;
          mergedBodyContent = body;
        } else {
          // Append subsequent files with a page break delimiter
          mergedBodyContent += "\n\n<div class=\"page-break\"></div>\n\n" + body;
        }
      }

      // Merge options (CLI options take precedence over YAML frontmatter, then defaults)
      const mergedOptions = {
        title: options.title || frontmatter.title,
        author: options.author || frontmatter.author || "Unknown",
        lang: options.lang || frontmatter.lang || "ja",
        generateToc: options.toc !== undefined ? !!options.toc : (frontmatter.toc !== undefined ? !!frontmatter.toc : false),
        direction: options.direction || frontmatter.direction || "ltr",
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
      console.log(`Input(s): ${markdownPaths.join(", ")}`);
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
        direction: mergedOptions.direction,
        markdownContent: mergedBodyContent,
      });

    } catch (error) {
      console.error("An error occurred:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);

