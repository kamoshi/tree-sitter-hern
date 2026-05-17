# tree-sitter-hern

Tree-sitter grammar for Hern, a small language for experimenting with
type-system ideas.

This repository provides:

- a Tree-sitter grammar in `grammar.js`
- generated parser artifacts in `src/`
- Rust bindings in `bindings/rust/`
- syntax highlighting queries in `queries/highlights.scm`
- parser regression tests in `test/corpus/`

## Development

Install the Tree-sitter CLI, then run:

```sh
tree-sitter generate
tree-sitter test
cargo test
```

To inspect a Hern file:

```sh
tree-sitter parse path/to/file.hern
```

To check the highlight query against a file:

```sh
tree-sitter query queries/highlights.scm path/to/file.hern
```

## Updating The Grammar

After changing `grammar.js`, regenerate the parser:

```sh
tree-sitter generate
```

Commit the updated generated files under `src/` together with the grammar change. If the change affects highlighting, update `queries/highlights.scm` and run `cargo test`; the Rust binding includes a small query-compilation regression test.

## Editor Integrations

The grammar is used by local editor tooling such as `zed-hern` and by documentation/site rendering experiments. When changing nodes or captures, check downstream query files as well.

For example, to validate Zed queries against Hern sources:

```sh
rg --files -g '*.hern' ../hern > /tmp/hern-files.txt
tree-sitter query ../zed-hern/languages/hern/highlights.scm --paths /tmp/hern-files.txt --quiet
tree-sitter query ../zed-hern/languages/hern/indents.scm --paths /tmp/hern-files.txt --quiet
```

## Status

This grammar tracks the current Hern syntax and is still evolving with the language.
