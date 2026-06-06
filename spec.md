# mkepub 仕様書 (Requirements and Specifications)

`mkepub` は、MarkdownファイルからEPUB（電子書籍）ファイルを自動生成して出力するコマンドラインツール（CLI）です。

---

## 1. 概要 (Overview)

本ツールは、執筆者や開発者が使い慣れたMarkdown形式でテキストを記述し、簡単なコマンド操作で標準的なEPUBフォーマットの電子書籍を作成できるようにすることを目的とします。

---

## 2. ユースケース (Use Cases)

- 個人ブログの記事や技術ドキュメントをまとめてEPUB化し、電子書籍リーダー（Kindle, Kobo, Apple Books等）で読みたい。
- 自作の小説やドキュメントを電子書籍として配布・販売するために、MarkdownからEPUBをビルドしたい。

---

## 3. 主要機能要件 (Key Functional Requirements)

### 3.1. 基本変換機能
- **MarkdownからEPUBへの変換**: 
  - 入力されたMarkdown（`.md`）ファイルを解析し、EPUB規格（EPUB 3推奨）に準拠したファイルを生成します。
  - Markdown内の標準的な記法（見出し、段落、箇条書き、太字/斜体、リンク、コードブロック、引用など）を適切にHTMLに変換してEPUB内に取り込みます。

### 3.2. スタイリング (CSS)
- **デフォルトCSS**: 
  - 指定がない場合でも、読みやすいフォントサイズや行間を設定したデフォルトのCSSを適用します（日本語環境に配慮した縦書き・横書きの最適化スタイルをデフォルトで保持）。
- **カスタムCSSの適用 (`--css`)**:
  - `--css <filepath>` オプションにより、ユーザーが定義したカスタムCSSファイルを指定し、EPUB全体のデザインをカスタマイズできます。

### 3.3. 目次自動生成 (`--toc`)
- **目次 (Table of Contents) の自動生成**:
  - `--toc` オプションが指定された場合、Markdown内の見出しレベル（`#`, `##`, `###`）を解析し、EPUBの論理目次（`toc.ncx` / `nav.xhtml`）および書籍内の目次ページを自動生成します。

### 3.4. メタデータ指定 (Metadata)
- **書籍情報の付与**:
  - タイトル (`--title`)、著者名 (`--author`)、言語 (`--lang`、デフォルトは `ja`) などの基本的なメタデータをEPUBに埋め込みます。
  - 指定がない場合は、入力ファイルのファイル名やシステム情報からデフォルト値を自動生成します。

### 3.5. カバー画像指定 (`--cover`)
- **表紙の設定**:
  - `--cover <image-path>` オプションにより、指定した画像（JPEG/PNG等）を書籍のカバーとして設定します。

### 3.6. ローカル画像の自動埋め込み (Image Embedding)
- **画像リソースのインポート**:
  - Markdownファイル内で相対パスで記述されている画像（例: `![説明](./images/photo.png)`）を検出し、自動的にEPUBパッケージ内にコピー・配置し、リンクをEPUB内部向けに適切に変換します。

---

## 4. CLIインターフェース仕様 (CLI Interface)

### コマンド形式
```bash
mkepub <input-markdown-file> [options]
```

### オプション一覧

| オプション | 短縮形 | 引数 | 説明 | デフォルト値 |
| :--- | :--- | :--- | :--- | :--- |
| `--output` | `-o` | `<path>` | 出力するEPUBファイルのパス | 入力ファイル名に基づき自動生成 (例: `book.epub`) |
| `--css` | `-c` | `<path>` | 適用するカスタムCSSファイルのパス | 内蔵のデフォルトCSS |
| `--toc` | `-t` | なし | 目次（Table of Contents）を自動生成する | 生成しない |
| `--title` | なし | `<string>` | 書籍のタイトル | 入力ファイル名、または最初の `<h1>` 見出し |
| `--author` | なし | `<string>` | 著者名 | `Unknown` またはシステムユーザー名 |
| `--cover` | なし | `<path>` | カバー画像のパス | なし |
| `--lang` | なし | `<string>` | 書籍の言語コード | `ja` |

### 実行例

**最もシンプルな実行（デフォルトCSS、目次なし）:**
```bash
mkepub draft.md
# draft.epub が出力される
```

**フルオプションでの実行:**
```bash
mkepub draft.md -o finished_book.epub --css my-style.css --toc --title "マイブック" --author "鈴木俊吾" --cover cover.png
```

---

### 開発言語・ランタイム・パッケージマネージャー
- **Bun (TypeScript)**:
  - 高速なJavaScript/TypeScriptランタイムおよびパッケージマネージャーとして Bun を採用します。
  - TypeScript が標準でサポートされており、ビルドや実行が高速です。
  - MarkdownのパースやZIPアーカイブ化、EPUB生成処理を効率的に実装できます。

### EPUBのパッケージング構造
生成されるEPUBファイルは、実質的に以下のディレクトリ構造を持つZIPアーカイブです。
```text
mimetype
META-INF/
  container.xml
OEBPS/
  content.opf
  toc.ncx
  nav.xhtml
  styles/
    style.css
  images/
    cover.png
    (その他Markdown内の画像)
  sections/
    section1.xhtml
    section2.xhtml
```
`mkepub` は、MarkdownをHTML（XHTML）に変換し、上記のような標準的なEPUB 3構成を動的にメモリ上または一時フォルダ内に組み立ててZIP圧縮します。
