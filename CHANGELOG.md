# artifact-size-analyzer changelog

## 1.2.0 (2025-12-19)

### Features

- **cli:** add new `--unchanged` option to omit or collapse unchanged artifacts ([69c2fa7](https://github.com/ext/artifact-size-analyzer/commit/69c2fa7911098a22bce1af03e03bacbd864dc9b8))
- **github:** add new `unchanged` input to omit or collapse unchanged artifacts ([66b1b7c](https://github.com/ext/artifact-size-analyzer/commit/66b1b7cb18481881030afad725b5d36b127ba4a9))

### Bug Fixes

- **github:** fix logging of the current result ([538e427](https://github.com/ext/artifact-size-analyzer/commit/538e4276efcab8dfd3bf7a40db606598ae23facd))
- only show current size when there was no change ([6e7246e](https://github.com/ext/artifact-size-analyzer/commit/6e7246e3c949df17df68a7293b0942bc959083bb))

## 1.1.0 (2025-12-17)

### Features

- **github:** fetch configuration from head branch by default ([0bf63e1](https://github.com/ext/artifact-size-analyzer/commit/0bf63e192d3df902cf387b838d50c96d5657986e))

### Bug Fixes

- add newline between artifacts in text output for readability ([9aec140](https://github.com/ext/artifact-size-analyzer/commit/9aec1401561951a95c95b1cd3c47121ad5ccf77b))
- better error message when config is missing ([04f7fa4](https://github.com/ext/artifact-size-analyzer/commit/04f7fa44323cc0c17fb2a2228ea1766e8c6e1b47))
- fix bin script permissions ([0d4461e](https://github.com/ext/artifact-size-analyzer/commit/0d4461e15b8f12f8fe6a279d5694d728c6464919))
- handle globstar `**` include patterns ([5f561f3](https://github.com/ext/artifact-size-analyzer/commit/5f561f3915d47746f7a80013ef1348f67f221b77))
- omit disabled compression columns when analyzing ([30eaf56](https://github.com/ext/artifact-size-analyzer/commit/30eaf56c86278fae2b103434e8e8febfa228de3e))

## 1.0.2 (2025-12-14)

### Bug Fixes

- add missing bin script ([aec7ed7](https://github.com/ext/artifact-size-analyzer/commit/aec7ed71687c8cf5ad6e02e13a6e41fecaac3080))

## 1.0.1 (2025-12-14)

### Bug Fixes

- **deps:** fix extraneous dependencies in published npm package ([41162b9](https://github.com/ext/artifact-size-analyzer/commit/41162b9b61e27494cd1fbe9a2c0d46f5b65b5d8c))
