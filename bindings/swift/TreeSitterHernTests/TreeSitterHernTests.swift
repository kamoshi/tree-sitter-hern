import XCTest
import SwiftTreeSitter
import TreeSitterHern

final class TreeSitterHernTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_hern())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Hern grammar")
    }
}
