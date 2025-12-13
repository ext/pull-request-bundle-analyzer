# Artifact size analyzer

A small, zero-opinion tool to analyze and compare the sizes of build artifacts across branches and CI runs.
Ideal for pull requests — it highlights size regressions and tracks compressed and uncompressed bundle sizes.

- ✅ Configurable: include/exclude files and compression algorithms
- ✅ Agnostic: works with any language or toolchain
- ✅ Multi-artifact: measure multiple bundles in one pass
- ✅ Outputs: JSON, Markdown, and plain text (for Actions, CLI, and API)

![Screenshot of a pull request comment made by this GitHub Action](example-comment.png)

## Table of Contents

- [Installation](#installation)
- [Configuration file](#configuration-file)
- [Using with GitHub Actions](#using-with-github-actions)
- [Using with CLI](#using-with-cli)
- [Using with API](#using-with-api)
- [Development](#development)

## Installation

Install as a dev dependency (recommended):

```bash
npm install --save-dev pull-request-bundle-analyzer
```

## Configuration file

The config file describes bundles to analyze.

```json
{
  "bundles": [
    {
      "id": "app",
      "name": "app",
      "include": "dist/**/*.js"
    }
  ]
}
```

### Options

#### `bundles[].id`

Type: `string`  
Required: yes

Unique identifier for this bundle.

#### `bundles[].name`

Type: `string`  
Required: yes

Display name for this bundle.

#### `bundles[].include`

Type: `string | string[]`  
Required: no  
Default: `[]`

Files to include for this bundle (globs supported).

#### `bundles[].exclude`

Type: `string | string[]`  
Required: no  
Default: `[]`

Files to exclude for this bundle (globs supported).

#### `bundles[].compression`

Type: `string | string[] | false`  
Required: no  
Default: `["gzip", "brotli"]`

Compression algorithm(s) to enable for this bundle or `false` to disable compression.

Supported compression algorithms:

- `gzip`
- `brotli`

## Using with GitHub Actions

The recommended pattern is three jobs:

- **Analyze (base)**: on the pull request target branch run the `analyze` action to produce a baseline.
- **Analyze (current)**: on the PR head ref, run the `analyze` action to bundle data for the current commit.
- **Compare**: run the `compare` action to compare the two bundles.

> [!IMPORTANT]
> Both the `analyze` and `compare` actions assume you perform the `checkout` and `setup-node` steps in the workflow (see example workflow below).

On target branch:

```yaml
- name: Run analyzer
  uses: ext/pull-request-bundle-analyzer/analyze
  with:
    config-file: ./example-config.json
    artifact-name: base-bundle
```

On head branch:

```yaml
- name: Run analyzer
  uses: ext/pull-request-bundle-analyzer/analyze
  with:
    config-file: ./example-config.json
    artifact-name: current-bundle
```

To compare:

```yaml
- name: Compare results
  id: compare
  uses: ext/pull-request-bundle-analyzer/compare
  with:
    base-artifact: base-bundle
    current-artifact: current-bundle
```

> [!TIP]
> It is recommended to pin the action references used in workflows to the same version as the dev dependency to avoid unexpected changes.

```yaml
uses: ext/pull-request-bundle-analyzer/analyze@1.2.3
```

Example workflow:

<details>
<summary>bundle-size.yml</summary>

```yaml
name: Bundle size

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  analyze-base:
    name: Analyze (base)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout target branch
        uses: actions/checkout@v6
        with:
          ref: ${{ github.event.pull_request.base.ref }}

      - name: Setup Node.js
        uses: actions/setup-node@v6

      - name: Install & build
        run: |
          npm ci
          npm run build

      - name: Run analyzer
        uses: ext/pull-request-bundle-analyzer/analyze
        with:
          config-file: ./example-config.json
          artifact-name: base-bundle

  analyze-current:
    name: Analyze (current)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout head ref
        uses: actions/checkout@v6
        with:
          ref: ${{ github.event.pull_request.head.ref }}

      - name: Setup Node.js
        uses: actions/setup-node@v6

      - name: Install & build
        run: |
          npm ci
          npm run build

      - name: Run analyzer (current)
        uses: ext/pull-request-bundle-analyzer/analyze
        with:
          config-file: ./example-config.json
          artifact-name: current-bundle

  compare:
    name: Compare
    runs-on: ubuntu-latest
    needs: [analyze-base, analyze-current]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6

      - name: Compare results
        id: compare
        uses: ext/pull-request-bundle-analyzer/compare
        with:
          base-artifact: base-bundle
          current-artifact: current-bundle

      - name: Print markdown
        run: |
          echo "Compare markdown output:"
          echo "========================"
          echo "${{ steps.compare.outputs.markdown }}"
```

</details>

The output from the `compare` action can be used in a pull request comment, this example uses [`marocchino/sticky-pull-request-comment`](https://github.com/marocchino/sticky-pull-request-comment) but you can use any you like.

````yaml
- name: Post sticky PR comment
  uses: marocchino/sticky-pull-request-comment@v2
  with:
    header: pull-request-bundle-analyzer
    message: |
      ${{ steps.compare.outputs.markdown }}

      <details><summary>Raw JSON</summary>

      ```json
      ${{ steps.compare.outputs.json }}
      ```

      </details>
````

### Analyze inputs

#### `artifact-name`

Type: `string`  
Required: yes

Name of the GitHub artifact to upload.

#### `config-file`

Type: `string`  
Required: yes

Path to the bundle configuration.

#### `output-file`

Type: `string`  
Required: no  
Default: `temp/bundle-size.json`

Path to the output file to be produced by the analyzer.
Can optionally specify the format as a prefix `format:filename`, where `format` is `json`, `markdown`, or `text`.

To use the `compare` action the format must be `json`.

#### `version`

Type: `string`  
Required: no

Optional npm package version (e.g. `1.2.3`).
When provided, the action runs `npx pull-request-bundle-analyzer@<version>`.

By default it uses the installed version.

### Compare inputs

#### `base-artifact`

Type: `string`  
Required: yes

GitHub artifact name for the base run (uploaded by `analyze`).

#### `current-artifact`

Type: `string`  
Required: yes

GitHub artifact name for the current run (uploaded by `analyze`).

#### `base-name`

Type: `string`  
Required: no  
Default: `bundle-size.json`

File name inside the base artifact that contains the analyzer output.

This should match the filename from the `output-file` input of the analyzer action.

Note: `base-name` and `current-name` refer to the path of the analyzer file inside the uploaded artifact; they must match the path passed to `analyze`'s `--output-file`.

#### `current-name`

Type: `string`  
Required: no  
Default: `bundle-size.json`

File name inside the current artifact that contains the analyzer output.

This should match the filename from the `output-file` input of the analyzer action.

#### `version`

Type: `string`  
Required: no

Optional npm package version (e.g. `1.2.3`).
When provided, the action runs `npx pull-request-bundle-analyzer@<version>`.

By default it uses the installed version.

### Compare outputs

#### `json`

Type: `string`

The comparison result formatted as JSON.

#### `markdown`

Type: `string`

The comparison result formatted as Markdown.

#### `text`

Type: `string`

The comparison result formatted as plain text.

## Using with CLI

Create a baseline (on the default branch):

```bash
npx pull-request-bundle-analyzer analyze -c example-config.json -f json -o temp/base.json
```

Analyze current bundle(s) (on the feature branch):

```bash
npx pull-request-bundle-analyzer analyze -c example-config.json -f json -o temp/current.json
```

Compare the results:

```bash
npx pull-request-bundle-analyzer compare --base temp/base.json --current temp/current.json
```

### Usage

```bash
npx pull-request-bundle-analyzer <command> [options]
```

where `command` is one of:

- `analyze`: Analyze bundles defined in a config file.
- `compare`: Compare two previously saved analysis outputs.

### Analyze

Analyze bundles from a config file and print results or write to a file.

```bash
npx pull-request-bundle-analyzer analyze -c example-config.json
npx pull-request-bundle-analyzer analyze -c example-config.json -f json -o temp/base.json
```

Options:

- `-c, --config-file <path>`: Path to the config file (required)
- `-f, --format <text|json|markdown>`: Output format (default: `text`)
- `-o, --output-file <format:filename|filename>`: Write output to file instead of stdout. Can be specified multiple times. If `format` is omitted the value from `--format` is used.

### Compare

Compare two saved results and print the diff.
The files should be the JSON outputs produced by `analyze -f json`.

```bash
npx pull-request-bundle-analyzer compare --base base.json --current current.json -f text
```

Options:

- `--base <path>`: Baseline JSON file produced by `analyze` (required)
- `--current <path>`: Current JSON file produced by `analyze` (required)
- `-f, --format <text|json|markdown>`: Output format (default: `text`)
- `-o, --output-file <path>`: Write output to file instead of stdout

## Using with API

Programmatic usage is supported via the library exports.

To analyze a bundle:

```ts
import { getBundleSize } from "pull-request-bundle-analyzer";

/* compression algorithm options */
const compression = {
  gzip: false,
  brotli: false,
};

/* bundle configuration (similar to the configuration file) */
const bundle = {
  id: "dist",
  name: "dist",
  include: ["dist/**/*.js"],
  exclude: [],
};

/* analyzes the configured bundle */
const result = await getBundleSize(bundle, { cwd: process.cwd(), compression });

console.log("Result:", result);
```

To compare two bundles:

```ts
import fs from "node:fs/promises";
import { type BundleSize, compareBundle } from "pull-request-bundle-analyzer";

/* previously saved output from `getBundleSize()` */
const base = JSON.parse(await fs.readFile("base.json", "utf8")) as BundleSize;
const current = JSON.parse(await fs.readFile("current.json", "utf8")) as BundleSize;

/* compares the two bundles */
const result = compareBundle(base, current);

console.log("Result:", result);
```

You can format the output of `getBundleSize` and `compareBundle()` using `formatBundle()` and `formatDiff()`:

```ts
import { formatDiff } from "pull-request-bundle-analyzer";

const output = formatDiff([result], "markdown", { color: false });
console.log(output);
```

Other noteworthy functions:

- `readConfigFile()` reads, validates and normalizes a configuration file.
- `compareBundles()` takes two arrays of base and current bundles and runs `compareBundle()` on each pair (based on `id`).

## Development

Build the project locally:

```bash
npm install
npm run build
```

Run tests and linting during development:

```bash
npm test
npm run eslint
npm run prettier:check
```
