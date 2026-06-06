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
