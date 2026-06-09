// Templates for EPUB required XML and XHTML files

export interface EPubMetadata {
  title: string;
  author: string;
  lang: string;
  uuid: string;
  coverPath?: string; // EPUB内での画像パス (例: images/cover.png)
  hasCover: boolean;
  pageProgressionDirection: "ltr" | "rtl";
}

export interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export interface SpineItem {
  idref: string;
}

export interface TocItem {
  title: string;
  href: string;
  level: number; // 1, 2, 3...
}

export function getContainerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

export function getContentOpf(
  meta: EPubMetadata,
  manifest: ManifestItem[],
  spine: SpineItem[]
): string {
  const manifestItemsXml = manifest
    .map(
      (item) =>
        `    <item id="${item.id}" href="${item.href}" media-type="${item.mediaType}"${
          item.properties ? ` properties="${item.properties}"` : ""
        }/>`
    )
    .join("\n");

  const spineItemsXml = spine
    .map((item) => `    <itemref idref="${item.idref}"/>`)
    .join("\n");

  // カバーメタデータ (EPUB 2 / EPUB 3 両対応)
  let coverMeta = "";
  if (meta.hasCover) {
    coverMeta = `\n    <meta name="cover" content="cover-image"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${meta.uuid}</dc:identifier>
    <dc:title>${escapeXml(meta.title)}</dc:title>
    <dc:creator id="creator">${escapeXml(meta.author)}</dc:creator>
    <dc:language>${meta.lang}</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>${coverMeta}
  </metadata>
  <manifest>
${manifestItemsXml}
  </manifest>
  <spine toc="ncx" page-progression-direction="${meta.pageProgressionDirection}">
${spineItemsXml}
  </spine>
</package>`;
}

export function getTocNcx(meta: EPubMetadata, tocItems: TocItem[]): string {
  let navPointsXml = "";
  if (tocItems.length > 0) {
    navPointsXml = tocItems
      .map((item, index) => {
        const indent = "  ".repeat(item.level);
        return `${indent}<navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
${indent}  <navLabel>
${indent}    <text>${escapeXml(item.title)}</text>
${indent}  </navLabel>
${indent}  <content src="${item.href}"/>
${indent}</navPoint>`;
      })
      .join("\n");
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${meta.uuid}"/>
    <meta name="dtb:depth" content="3"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(meta.title)}</text>
  </docTitle>
  <navMap>
${navPointsXml}
  </navMap>
</ncx>`;
}

export function getNavXhtml(meta: EPubMetadata, tocItems: TocItem[]): string {
  let listItemsXml = "";
  if (tocItems.length > 0) {
    let listContent = "";
    let currentLevel = 0;

    tocItems.forEach((item) => {
      if (currentLevel === 0) {
        listContent += "<li>" + `<a href="${item.href}">${escapeXml(item.title)}</a>`;
        currentLevel = item.level;
      } else if (item.level > currentLevel) {
        while (item.level > currentLevel) {
          listContent += "\n" + "  ".repeat(currentLevel) + "<ol>" + "\n" + "  ".repeat(currentLevel + 1) + "<li>";
          currentLevel++;
        }
        listContent += `<a href="${item.href}">${escapeXml(item.title)}</a>`;
      } else if (item.level < currentLevel) {
        listContent += "</li>";
        while (item.level < currentLevel) {
          currentLevel--;
          listContent += "\n" + "  ".repeat(currentLevel + 1) + "</ol>" + "\n" + "  ".repeat(currentLevel) + "</li>";
        }
        listContent += "\n" + "  ".repeat(currentLevel) + "<li>" + `<a href="${item.href}">${escapeXml(item.title)}</a>`;
      } else {
        listContent += "</li>\n" + "  ".repeat(currentLevel) + "<li>" + `<a href="${item.href}">${escapeXml(item.title)}</a>`;
      }
    });

    if (currentLevel > 0) {
      listContent += "</li>";
      while (currentLevel > 1) {
        currentLevel--;
        listContent += "\n" + "  ".repeat(currentLevel + 1) + "</ol>" + "\n" + "  ".repeat(currentLevel) + "</li>";
      }
    }

    listItemsXml = `<ol>\n      ${listContent}\n    </ol>`;
  } else {
    listItemsXml = `<ol>\n      <li><a href="text/content.xhtml">${escapeXml(meta.title)}</a></li>\n    </ol>`;
  }

    const htmlClass = meta.pageProgressionDirection === "rtl" ? ' class="vertical"' : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${meta.lang}" xml:lang="${meta.lang}"${htmlClass}>
<head>
  <title>${escapeXml(meta.title)}</title>
  <meta charset="utf-8" />
  <link rel="stylesheet" type="text/css" href="styles/style.css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    ${listItemsXml}
  </nav>
</body>
</html>`;
}

export function getHtmlWrap(meta: EPubMetadata, contentHtml: string): string {
  const htmlClass = meta.pageProgressionDirection === "rtl" ? ' class="vertical"' : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${meta.lang}" xml:lang="${meta.lang}"${htmlClass}>
<head>
  <title>${escapeXml(meta.title)}</title>
  <meta charset="utf-8" />
  <link rel="stylesheet" type="text/css" href="../styles/style.css" />
</head>
<body>
${contentHtml}
</body>
</html>`;
}

export function getCoverXhtml(meta: EPubMetadata, coverImageHref: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${meta.lang}" xml:lang="${meta.lang}">
<head>
  <title>Cover</title>
  <meta charset="utf-8" />
  <style type="text/css">
    @page { padding: 0; margin: 0; }
    body { margin: 0; padding: 0; text-align: center; background-color: #ffffff; }
    img { max-width: 100%; max-height: 100%; height: auto; width: auto; margin: auto; display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0; }
  </style>
</head>
<body>
  <div>
    <img src="${coverImageHref}" alt="Cover Image" />
  </div>
</body>
</html>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}
