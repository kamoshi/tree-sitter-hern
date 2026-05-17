; Keywords
[
  "let"
  "fn"
  "trait"
  "impl"
  "type"
  "alias"
  "test"
  "and"
  "extern"
  "import"
  "where"
  "for"
  "in"
  "do"
] @keyword

; `mut` is a modifier; highlight it distinctly wherever it appears
"mut" @keyword.modifier

[
  "match"
  "if"
  "else"
  "loop"
  "continue"
  "break"
  "return"
] @keyword.control

[
  "infix"
  "infixl"
  "infixr"
] @keyword

; The generic named-child capture handles custom attributes; literal captures
; below handle contextual attribute names such as `inline`, `test`, and `derive`.
(attribute name: (_) @attribute)
(attribute "inline" @attribute)
(attribute "test" @attribute)
(attribute "derive" @attribute)
(attribute_arguments argument: (identifier) @type)
(extern_attribute "template" @attribute)
(inner_attribute name: (identifier) @attribute)

; Hashbang and comments
(hashbang) @comment

; Operators
[
  "->"
  "|>"
  "||"
  "&&"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "+"
  "-"
  "*"
  "/"
  ".."
  "..="
  "::"
  "!"
  "="
  "<-"
] @operator

(operator) @operator

; Punctuation
[
  ";"
  ":"
  ","
  "."
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

"#" @punctuation.special

; Literals
(string) @string
(number) @number
(number_pattern (number) @number)
(range_pattern (number) @number)
(bool) @boolean
(unit_expression) @constant.builtin
(unit_type) @type.builtin
(never_type) @type.builtin

; Variables and properties
(identifier) @variable
(field_initializer name: (identifier) @property)
(record_field_or_spread shorthand: (identifier) @property)
(field_access_expression field: (identifier) @property)
(record_pattern_field field: (identifier) @property)

; Types
(type_identifier) @type
(type_variable) @type.parameter
(type_hole) @type.builtin
(type_rest) @punctuation.special
(type_field name: (identifier) @property)
(type_def_stmt name: (identifier) @type.definition)
(type_alias_stmt name: (identifier) @type.definition)
(type_params (identifier) @type.parameter)
(type_params (type_variable) @type.parameter)
(type_bound arg: (identifier) @type.parameter)
(type_bound arg: (type_variable) @type.parameter)
(type_bound dependent: (identifier) @type.parameter)
(type_bound dependent: (type_variable) @type.parameter)
(type_bound trait: (identifier) @type)
(parameter type: (identifier) @type)
(let_stmt type: (identifier) @type)
(do_bind_statement type: (identifier) @type)
(return_type type: (identifier) @type)
(type_field type: (identifier) @type)
(type_apply name: (identifier) @type)
(type_apply name: (type_identifier) @type)
(type_array (identifier) @type)
(type_fn_parameter type: (identifier) @type)
(type_fn_return type: (identifier) @type)
(type_mut type: (identifier) @type)
(type_tuple (identifier) @type)
(parenthesized_type (identifier) @type)
(trait_stmt name: (identifier) @type)
(trait_params param: (identifier) @type.parameter)
(trait_params dependent: (identifier) @type.parameter)
(trait_impl_stmt trait: (identifier) @type)
(trait_impl_stmt trait: (type_identifier) @type)
(trait_impl_stmt trait: (type_apply name: (_) @type))
(trait_impl_target arg: (identifier) @type)
(trait_impl_target dependent: (identifier) @type)

; Associated type targets, e.g. `Foo([int])::bar` and `Functor(Result(_, string))::map`
(associated_type_hole) @type.builtin
(associated_type_apply name: (identifier) @type)
(associated_type_field name: (identifier) @property)
(associated_type_field type: (associated_type (identifier) @type))
(associated_type_fn_parameter type: (associated_type (identifier) @type))
(associated_type_fn_return type: (associated_type (identifier) @type))
(associated_type_mut type: (associated_type (identifier) @type))
(associated_type_array (associated_type (identifier) @type))
(associated_type_tuple (associated_type (identifier) @type))
(associated_parenthesized_type (associated_type (identifier) @type))
(associated_type (identifier) @type)

; Constructors and variants
(variant name: (identifier) @constructor)
(variant name: (type_identifier) @constructor)
(constructor_pattern name: (identifier) @constructor)

; Bindings
(parameter pattern: (pattern (identifier) @variable.parameter))
(trait_parameter name: (identifier) @variable.parameter)
(record_pattern_field binding: (identifier) @variable)
(record_rest_pattern binding: (identifier) @variable)
(list_rest_pattern binding: (identifier) @variable)

; Spread syntax in record expressions
(record_field_or_spread ".." @punctuation.special)

; Functions and methods
(fn_stmt name: (identifier) @function)
(fn_stmt name: (operator) @function)
(inherent_impl_method name: (identifier) @function.method)
(trait_impl_method name: (identifier) @function.method)
(trait_impl_method name: (operator) @function.method)
(trait_method name: (identifier) @function.method)
(trait_method name: (operator) @function.method)
(extern_stmt name: (identifier) @variable)
(associated_access_expression member: (identifier) @function.method)
(call_expression function: (primary_expression (identifier) @function.call))
(call_expression
  function: (primary_expression
    (field_access_expression field: (identifier) @function.method.call)))
(call_expression
  function: (primary_expression
    (associated_access_expression member: (identifier) @function.method.call)))

; do-bind pattern variable
(do_bind_statement pattern: (pattern (identifier) @variable))

; Comments
(comment) @comment
