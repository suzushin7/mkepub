# mkepub

[English](#english) | [日本語](#日本語)

---

## English

A fast, simple CLI tool to automatically generate EPUB files from Markdown documents, powered by Bun.

### Features

- ⚡ **Super Fast**: Powered by Bun and JSZip for blazing-fast generation.
- 🎨 **Styling Support**: Automatically applies a clean default stylesheet, or customize it with `--css`.
- 📖 **Automatic TOC**: Generate logical tables of contents (EPUB 3 nav and NCX) with `--toc`.
- 🖼️ **Image Auto-Embedding**: Detects relative local image paths in your Markdown and bundles them into the EPUB automatically.
- 🏷️ **Metadata Customization**: Easily set the Title, Author, Language, and Cover image via command options.
- ✍️ **Vertical & Horizontal Layout**: Supports both horizontal (`ltr`) and vertical (`rtl`) layouts. When `rtl` is specified, the layout automatically switches to vertical writing mode with Mincho fonts, optimized margins, and borders (e.g., blockquote and header borders are adjusted).

### Installation

Make sure you have [Bun](https://bun.sh/) installed.

**From GitHub (Direct global install):**
```bash
bun install -g github:suzushin7/mkepub
```

**For local development:**
```bash
# Clone the repository and link it
git clone https://github.com/suzushin7/mkepub.git
cd mkepub
bun install
bun link
```

### Usage

You can run it directly using `bunx` without global installation:

```bash
bunx mkepub <input-markdown> [options]
```


### YAML Frontmatter Configuration

You can configure EPUB generation settings directly inside the Markdown file using YAML frontmatter (a YAML block wrapped with `---` at the very beginning of the file).

#### Configuration Options
* `title`: Book title
* `author`: Author name
* `cover`: Path to the cover image file (relative to the Markdown file)
* `toc`: Enable automatic generation of the Table of Contents (`true` / `false`)
* `lang`: Language code for the EPUB (e.g., `ja`, `en`)
* `css`: Path to a custom CSS stylesheet (relative to the Markdown file)
* `output`: Path to the output EPUB file (relative to the Markdown file)
* `direction`: Page progression direction (`ltr` or `rtl`). When `rtl` is specified, the layout automatically switches to vertical writing mode (using Mincho fonts and adjusting borders/margins).

#### Priority
1. **CLI Option**: Highest priority (overrides YAML setting if explicitly specified)
2. **YAML Frontmatter**: Medium priority (used if CLI option is omitted)
3. **Default Value**: Lowest priority (used if neither is specified)

#### Example
```markdown
---
title: "My Awesome Book"
author: "John Doe"
cover: "./cover.png"
toc: true
lang: "en"
css: "./custom.css"
output: "./dist/mybook.epub"
direction: "ltr"
---

# Introduction
...
```

#### Options

| Option | Short | Argument | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `--output` | `-o` | `<path>` | Output path for the EPUB file | `<input-name>.epub` |
| `--css` | `-c` | `<path>` | Path to a custom CSS stylesheet | Built-in default CSS |
| `--toc` | `-t` | None | Enable automatic generation of the Table of Contents | `false` |
| `--title` | None | `<string>` | Book title | First `<h1>` or filename |
| `--author` | None | `<string>` | Author name | `Unknown` |
| `--cover` | None | `<path>` | Path to the cover image file | None |
| `--lang` | None | `<string>` | Language code for the EPUB | `ja` |
| `--direction` | `-d` | `<string>` | Page progression direction (`ltr` or `rtl`) | `ltr` |

#### Examples

**Basic conversion:**
```bash
bunx mkepub draft.md
```

**Full features:**
```bash
bunx mkepub draft.md -o book.epub --css style.css --toc --title "My Masterpiece" --author "Author Name" --cover cover.png
```

---

## 日本語

`mkepub` は、Bunで動作する、MarkdownファイルからEPUB形式の電子書籍を自動生成して出力する高速・軽量なCLIツールです。

### 主な特徴

- ⚡ **超高速**: Bun と JSZip の採用により、一瞬でEPUBパッケージを作成します。
- 🎨 **美しいデフォルトスタイル**: 読みやすさに配慮したデフォルトCSSを内蔵。`--css` を使用して独自のカスタムCSSを設定することも可能です。
- 📖 **目次自動生成**: `--toc` オプションを指定することで、Markdownの見出し（h1〜h3）を解析し、EPUB 3標準のナビゲーション目次（`nav.xhtml`）および `toc.ncx` を自動生成します。
- 🖼️ **画像の自動インポート**: Markdown内に記述された相対パスのローカル画像を検出し、自動でEPUBパッケージにコピーしてパスを補正します。
- 🏷️ **メタデータ設定**: 書籍のタイトル、著者名、言語設定、カバー（表紙）画像をコマンドライン引数から簡単に指定できます。
- ✍️ **縦書き・横書き両対応**: 横書き（`ltr`）だけでなく、日本語書籍で一般的な縦書き（`rtl`）表示に対応しています。縦書き指定時は、文字送り方向だけでなく、明朝体フォントへの自動切り替えや見出し・引用文（blockquote）の余白・枠線も自動的に最適化されます。

### インストール方法

事前に [Bun](https://bun.sh/) がインストールされていることを確認してください。

**GitHub から直接グローバルインストールする場合:**
```bash
bun install -g github:suzushin7/mkepub
```

**ローカルでの開発・カスタマイズを行う場合:**
```bash
# リポジトリをクローンしてリンク
git clone https://github.com/suzushin7/mkepub.git
cd mkepub
bun install
bun link
```

### 使い方

グローバルインストールをせず、`bunx` を使って直接実行することも可能です。

```bash
bunx mkepub <input-markdown> [options]
```

#### オプション一覧

| オプション | 短縮形 | 引数 | 説明 | デフォルト値 |
| :--- | :--- | :--- | :--- | :--- |
| `--output` | `-o` | `<path>` | 出力するEPUBファイルのパス | 入力ファイル名に基づき自動生成 (例: `<入力ファイル名>.epub`) |
| `--css` | `-c` | `<path>` | 適用するカスタムCSSファイルのパス | 内蔵のデフォルトCSS |
| `--toc` | `-t` | なし | 目次（Table of Contents）を自動生成する | 生成しない (`false`) |
| `--title` | なし | `<string>` | 書籍のタイトル | Markdown内の最初の `<h1>` またはファイル名 |
| `--author` | なし | `<string>` | 著者名 | `Unknown` |
| `--cover` | なし | `<path>` | カバー（表紙）画像のパス | なし |
| `--lang` | なし | `<string>` | 書籍の言語コード | `ja` |
| `--direction` | `-d` | `<string>` | ページ送り方向 (`ltr`: 左から右 / `rtl`: 右から左) | `ltr` |


### YAMLフロントマターによる設定

Markdownファイルの先頭に `---` で囲まれたYAMLブロック（フロントマター）を記述することで、EPUB生成の設定を定義できます。

#### 設定可能項目
* `title`: 書籍のタイトル
* `author`: 著者名
* `cover`: カバー（表紙）画像のパス（Markdownファイルからの相対パス）
* `toc`: 目次（Table of Contents）の自動生成（`true` / `false`）
* `lang`: 書籍の言語コード（例: `ja`, `en`）
* `css`: 適用するカスタムCSSファイルのパス（Markdownファイルからの相対パス）
* `output`: 出力するEPUBファイルのパス（Markdownファイルからの相対パス）
* `direction`: ページ送り方向 (`ltr` または `rtl`)。`rtl`（右開き）を指定した場合は、自動的に文書全体のレイアウトが縦書き（および明朝体フォント、縦書き用の余白・境界線）に切り替わります。

#### 設定の優先順位
1. **CLI引数**: 最優先（明示的に引数で指定された場合、YAMLの設定を上書きします）
2. **YAMLフロントマター**: CLI引数が省略された場合に適用されます
3. **デフォルト値**: 上記のいずれにも指定がない場合に適用されます

#### 記述例
```markdown
---
title: "素晴らしい小説"
author: "著者 太郎"
cover: "./cover.png"
toc: true
lang: "ja"
css: "./style.css"
output: "./book.epub"
direction: "ltr"
---

# はじめに
...
```

#### 実行例

**最もシンプルな変換:**
```bash
bunx mkepub draft.md
```

**全オプションを指定した変換:**
```bash
bunx mkepub draft.md -o book.epub --css style.css --toc --title "素晴らしい小説" --author "著者 太郎" --cover cover.png
```

---

## License

MIT License.
