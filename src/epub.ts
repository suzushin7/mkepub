import * as fs from "fs/promises";
import * as path from "path";
import { marked } from "marked";
import JSZip from "jszip";
import mime from "mime-types";
import crypto from "crypto";
import {
  getContentOpf,
  getContainerXml,
  getNavXhtml,
  getTocNcx,
  getHtmlWrap,
  getCoverXhtml,
  type EPubMetadata,
  type ManifestItem,
  type SpineItem,
  type TocItem,
} from "./templates";

export interface EPubOptions {
  markdownPath: string;
  outputPath: string;
  cssPath?: string;
  generateToc: boolean;
  title?: string;
  author?: string;
  coverPath?: string;
  lang?: string;
  direction?: string;
}

export async function generateEPub(options: EPubOptions) {
  const markdownDir = path.dirname(options.markdownPath);
  const markdownContent = await fs.readFile(options.markdownPath, "utf-8");
  const direction = options.direction === "rtl" ? "rtl" : "ltr";

  // Remove YAML frontmatter if exists
  let bodyContent = markdownContent;
  const fmMatch = markdownContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (fmMatch) {
    bodyContent = markdownContent.substring(fmMatch[0].length);
  }

  // 1. タイトルの決定 (第一候補: 引数、第二候補: Markdown内の最初のh1、第三候補: ファイル名)
  let title = options.title;
  if (!title) {
    const h1Match = bodyContent.match(/^#\s+(.+)$/m);
    title = h1Match?.[1]?.trim() || path.basename(options.markdownPath, ".md");
  }

  // 2. 著者の決定
  const author = options.author || "Unknown";

  // 3. 言語の決定
  const lang = options.lang || "ja";

  // 4. UUIDの生成
  const uuid = `urn:uuid:${crypto.randomUUID()}`;

  let htmlContent = await marked.parse(bodyContent, {
    async: true,
  });

  // XHTML準拠にするために、自己閉鎖タグ (img, br, hr) を補正する
  htmlContent = htmlContent
    .replace(/<img([^>]*)(?<!\/)>/gi, "<img$1 />")
    .replace(/<br([^>]*)(?<!\/)>/gi, "<br$1 />")
    .replace(/<hr([^>]*)(?<!\/)>/gi, "<hr$1 />");

  // 6. 画像の抽出と置換、目次の抽出をパース後のHTMLから行う
  const manifestItems: ManifestItem[] = [];
  const spineItems: SpineItem[] = [];
  const tocItems: TocItem[] = [];

  const zip = new JSZip();

  // mimetype は圧縮せずに配置する必要がある (先頭)
  // JSZipで圧縮なし(store)で書き出すために、内部メタデータを制御
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF/container.xml
  zip.file("META-INF/container.xml", getContainerXml());

  // styles/style.css
  let cssContent = "";
  if (options.cssPath) {
    cssContent = await fs.readFile(options.cssPath, "utf-8");
  } else {
    // デフォルトCSSの読み込み
    const defaultCssPath = path.join(__dirname, "default.css");
    cssContent = await fs.readFile(defaultCssPath, "utf-8");
  }
  zip.file("OEBPS/styles/style.css", cssContent);
  manifestItems.push({
    id: "style",
    href: "styles/style.css",
    mediaType: "text/css",
  });

  // カバー画像の処理
  if (options.coverPath) {
    const coverFullPath = path.resolve(options.coverPath);
    const coverBuffer = await fs.readFile(coverFullPath);
    const coverExt = path.extname(coverFullPath);
    const coverFileName = `cover${coverExt}`;
    const coverMediaType = mime.lookup(coverFullPath) || "image/jpeg";

    zip.file(`OEBPS/images/${coverFileName}`, coverBuffer);
    manifestItems.push({
      id: "cover-image",
      href: `images/${coverFileName}`,
      mediaType: coverMediaType,
      properties: "cover-image",
    });

    // カバー用XHTMLの追加
    const meta: EPubMetadata = { title, author, lang, uuid, hasCover: true, pageProgressionDirection: direction };
    const coverHtml = getCoverXhtml(meta, `../images/${coverFileName}`);
    zip.file("OEBPS/text/cover.xhtml", coverHtml);
    manifestItems.push({
      id: "cover",
      href: "text/cover.xhtml",
      mediaType: "application/xhtml+xml",
    });
    spineItems.push({ idref: "cover" });
  }

  // ナビゲーション (nav.xhtml) のアイテムを登録
  manifestItems.push({
    id: "nav",
    href: "nav.xhtml",
    mediaType: "application/xhtml+xml",
    properties: "nav",
  });

  // HTMLコンテンツ内の画像タグと見出しをパース・変換
  let processedHtml = htmlContent;

  // ローカル画像の埋め込み
  const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
  let imgMatch;
  let imgIndex = 1;

  while ((imgMatch = imgRegex.exec(htmlContent)) !== null) {
    const originalSrc = imgMatch[1];
    if (!originalSrc) {
      continue;
    }
    // httpなどで始まる外部URLはスキップ
    if (originalSrc.startsWith("http://") || originalSrc.startsWith("https://")) {
      continue;
    }

    try {
      const imgFullPath = path.resolve(markdownDir, originalSrc);
      const imgBuffer = await fs.readFile(imgFullPath);
      const imgExt = path.extname(imgFullPath);
      const epubImgName = `img_${imgIndex}${imgExt}`;
      const imgMediaType = mime.lookup(imgFullPath) || "image/jpeg";

      zip.file(`OEBPS/images/${epubImgName}`, imgBuffer);
      manifestItems.push({
        id: `img-${imgIndex}`,
        href: `images/${epubImgName}`,
        mediaType: imgMediaType,
      });

      // HTML内のパスをEPUB内相対パスに書き換える (text/から見た相対パス)
      processedHtml = processedHtml.replace(
        new RegExp(`src="${escapeRegex(originalSrc)}"`, "g"),
        `src="../images/${epubImgName}"`
      );

      imgIndex++;
    } catch (e) {
      console.warn(`Warning: Failed to load image file: ${originalSrc}`, e);
    }
  }

  // 目次の抽出（h1, h2, h3）
  // 簡易的にHTMLタグから見出しを抽出する
  const headingRegex = /<(h[1-3])\s*(?:id="([^"]+)")?\s*>(.*?)<\/h[1-3]>/gi;
  let headingMatch;
  let headingIndex = 1;
  const headingsToInsertIds: { original: string; replaced: string }[] = [];

  while ((headingMatch = headingRegex.exec(processedHtml)) !== null) {
    const tag = headingMatch[1];
    const originalId = headingMatch[2];
    const textGroup = headingMatch[3];

    if (!tag || !textGroup) {
      continue;
    }

    const text = textGroup.replace(/<[^>]+>/g, ""); // 内部HTMLタグを除去してプレーンテキストにする
    const level = parseInt(tag.substring(1));

    const id = originalId || `heading-${headingIndex}`;
    
    if (!originalId) {
      // idがなかった場合は後で置換するために記録
      headingsToInsertIds.push({
        original: headingMatch[0],
        replaced: `<${tag} id="${id}">${textGroup}</${tag}>`,
      });
    }

    tocItems.push({
      title: text,
      href: `text/content.xhtml#${id}`,
      level,
    });

    headingIndex++;
  }

  // 見出しにIDを付与したHTMLにする
  for (const item of headingsToInsertIds) {
    processedHtml = processedHtml.replace(item.original, item.replaced);
  }

  // メインのXHTMLの書き込み
  const epubMeta: EPubMetadata = {
    title,
    author,
    lang,
    uuid,
    hasCover: !!options.coverPath,
    pageProgressionDirection: direction,
  };

  const xhtmlContent = getHtmlWrap(epubMeta, processedHtml);
  zip.file("OEBPS/text/content.xhtml", xhtmlContent);
  manifestItems.push({
    id: "content",
    href: "text/content.xhtml",
    mediaType: "application/xhtml+xml",
  });
  if (options.generateToc) {
    spineItems.push({ idref: "nav" });
  }
  spineItems.push({ idref: "content" });

  // 目次 (nav.xhtml, toc.ncx) の生成
  const tocToUse = options.generateToc ? tocItems : [];
  zip.file("OEBPS/nav.xhtml", getNavXhtml(epubMeta, tocToUse));
  zip.file("OEBPS/toc.ncx", getTocNcx(epubMeta, tocToUse));

  manifestItems.push({
    id: "ncx",
    href: "toc.ncx",
    mediaType: "application/x-dtbncx+xml",
  });

  // content.opf
  zip.file("OEBPS/content.opf", getContentOpf(epubMeta, manifestItems, spineItems));

  // ZIP生成
  const content = await zip.generateAsync({
    type: "nodebuffer",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });

  await fs.writeFile(options.outputPath, content);
  console.log(`EPUB file generated successfully: ${options.outputPath}`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
