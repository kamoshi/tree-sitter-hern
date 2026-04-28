package tree_sitter_hern_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_hern "github.com/tree-sitter/tree-sitter-hern/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_hern.Language())
	if language == nil {
		t.Errorf("Error loading Hern grammar")
	}
}
