// ==============================================================================
// Hern tree-sitter grammar
// ==============================================================================

const PREC = {
	ASSIGN: 1,
	PIPE: 2,
	RANGE: 3,
	OR: 4,
	AND: 5,
	COMPARE: 6,
	CONCAT: 7,
	ADD: 8,
	MUL: 9,
	UNARY: 10,
	FIELD: 11,
	CALL: 12,
};

module.exports = grammar({
	name: "hern",

	word: ($) => $.identifier,

	extras: ($) => [/\s/, $.comment, $.hashbang],

	conflicts: ($) => [
		[$.expression_statement, $.block],
		[$._type, $.type_apply],
		[$.variant],
		// Same ambiguity as block: the final expression inside `do { }` is
		// not semicolon-terminated, so it looks like expression_statement.
		[$.expression_statement, $.do_expression],
		[$.range_expression],
		[$.primary_expression, $.associated_type],
		[$.primary_expression, $.associated_type_apply],
		[$.associated_type_hole, $.wildcard_pattern],
		[$.associated_type, $.pattern],
		[$.unit_expression, $.unit_type],
		[$.associated_type_record, $.record_expression],
		[$.associated_type_record, $.record_pattern],
		[$.record_rest_pattern, $.type_rest],
		[$.associated_type, $.record_pattern_field],
		[$.parameters, $.associated_type_fn],
	],

	rules: {
		program: ($) => repeat(choice($._stmt, $.inner_attribute)),

		_stmt: ($) =>
			choice(
				$.let_stmt,
				$.fn_group_stmt,
				$.test_stmt,
				$.trait_stmt,
				$.impl_stmt,
				$.type_def_stmt,
				$.type_alias_stmt,
				$.extern_stmt,
				$.expression_statement,
			),

		expression_statement: ($) => seq($._expression, optional(";")),

		// --- Declarations ---

		let_stmt: ($) =>
			seq(
				"let",
				optional("mut"),
				field("pattern", $.pattern),
				optional(seq(":", field("type", $._type))),
				"=",
				field("value", $._expression),
				";",
			),

		fn_stmt: ($) =>
			seq(
				repeat($.attribute),
				"fn",
				optional($._fn_fixity),
				field("name", choice($.identifier, $.operator)),
				field("parameters", $.parameters),
				optional(seq("->", field("return_type", $.return_type))),
				optional(field("where_clause", $.where_clause)),
				field("body", $._expression),
			),

		fn_group_stmt: ($) =>
			choice(
				$.fn_stmt,
				seq($.fn_stmt, repeat1(seq("and", $.fn_stmt))),
			),

		_fn_fixity: ($) =>
			seq(
				field("fixity", choice("infixl", "infixr", "infix")),
				field("precedence", $.number),
			),

		where_clause: ($) => seq("where", sep1($.type_bound, ",")),

		type_bound: ($) =>
			seq(
				repeat1(field("arg", $._type)),
				optional(seq("->", repeat1(field("dependent", $._type)))),
				":",
				sep1(field("trait", $.identifier), "+"),
			),

		parameters: ($) => seq("(", sep($.parameter, ","), ")"),

		parameter: ($) =>
			seq(
				optional(field("mut", "mut")),
				field("pattern", $.pattern),
				optional(seq(":", field("type", $._type))),
			),

		trait_stmt: ($) =>
			seq(
				"trait",
				field("name", $.identifier),
				$.trait_params,
				"{",
				repeat($.trait_method),
				"}",
			),

		trait_params: ($) =>
			seq(
				repeat1(field("param", choice($.identifier, $.type_variable))),
				optional(
					seq(
						"->",
						repeat1(
							field("dependent", choice($.identifier, $.type_variable)),
						),
					),
				),
			),

		trait_method: ($) =>
			seq(
				repeat($.attribute),
				"fn",
				optional($._fn_fixity),
				field("name", choice($.identifier, $.operator)),
				field("parameters", $.trait_parameters),
				"->",
				field("return_type", $._type),
			),

		trait_parameters: ($) => seq("(", sep($.trait_parameter, ","), ")"),

		trait_parameter: ($) =>
			seq(field("name", $.identifier), ":", field("type", $._type)),

		impl_stmt: ($) => choice($.trait_impl_stmt, $.inherent_impl_stmt),

		trait_impl_stmt: ($) =>
			seq(
				"impl",
				field("trait", $._type),
				"for",
				field("type", $.trait_impl_target),
				optional(field("where_clause", $.where_clause)),
				"{",
				repeat($.trait_impl_method),
				"}",
			),

		trait_impl_target: ($) =>
			seq(
				sep1(field("arg", $._type), ","),
				optional(seq("->", sep1(field("dependent", $._type), ","))),
			),

		inherent_impl_stmt: ($) =>
			seq(
				"impl",
				field("type", $._type),
				optional(field("where_clause", $.where_clause)),
				"{",
				repeat($.inherent_impl_method),
				"}",
			),

		trait_impl_method: ($) =>
			seq(
				repeat($.attribute),
				"fn",
				field("name", choice($.identifier, $.operator)),
				field("parameters", $.parameters),
				optional(seq("->", field("return_type", $.return_type))),
				field("body", $._expression),
			),

		inherent_impl_method: ($) =>
			seq(
				repeat($.attribute),
				"fn",
				field("name", $.identifier),
				field("parameters", $.parameters),
				optional(seq("->", field("return_type", $.return_type))),
				optional(field("where_clause", $.where_clause)),
				field("body", $._expression),
			),

		type_def_stmt: ($) =>
			seq(
				repeat($.attribute),
				"type",
				field("name", $.identifier),
				optional($.type_params),
				"=",
				choice(
					"*",
					prec.dynamic(1, seq(sep1($.variant, "|"))),
				),
				optional(";"),
			),

		type_alias_stmt: ($) =>
			seq(
				repeat($.attribute),
				"type",
				"alias",
				field("name", $.identifier),
				optional($.type_params),
				"=",
				field("type", $._type),
				optional(";"),
			),

		test_stmt: ($) =>
			seq(
				"test",
				"{",
				repeat($.test_block_statement),
				"}",
			),

		test_block_statement: ($) =>
			choice(
				$.let_stmt,
				$.fn_group_stmt,
				$.trait_stmt,
				$.impl_stmt,
				$.type_def_stmt,
				$.type_alias_stmt,
				$.extern_stmt,
				$.expression_statement,
			),

		type_params: ($) =>
			seq("(", sep1(choice($.identifier, $.type_variable), ","), ")"),

		variant: ($) =>
			seq(
				field("name", choice($.identifier, $.type_identifier)),
				optional(prec(1, seq("(", field("payload", $._type), ")"))),
			),

		extern_stmt: ($) =>
			seq(
				"extern",
				field("name", $.identifier),
				":",
				field("type", $._type),
				"=",
				optional($.extern_attribute),
				field("binding", $.string),
				";",
			),

		attribute: ($) =>
			seq(
				"#",
				"[",
				field("name", choice("inline", "test", "derive", $.identifier)),
				optional($.attribute_arguments),
				"]",
			),

		attribute_arguments: ($) =>
			seq("(", sep1(field("argument", $.identifier), ","), optional(","), ")"),

		extern_attribute: ($) => seq("#", "[", "template", "]"),

		// `#![name]` — file-level inner attribute (e.g. `#![no_implicit_prelude]`).
		inner_attribute: ($) =>
			seq("#", "!", "[", field("name", $.identifier), "]"),

		// --- Expressions ---

		_expression: ($) =>
			choice(
				$.assignment_expression,
				$.binary_expression,
				$.unary_expression,
				$.pipe_expression,
				$.range_expression,
				$.primary_expression,
			),

		assignment_expression: ($) =>
			prec.right(
				PREC.ASSIGN,
				seq(
					field(
						"left",
						choice($.identifier, $.field_access_expression, $.index_expression),
					),
					"=",
					field("right", $._expression),
				),
			),

		binary_expression: ($) => {
			const operators = [
				["||", PREC.OR],
				["&&", PREC.AND],
				["==", PREC.COMPARE],
				["!=", PREC.COMPARE],
				["<", PREC.COMPARE],
				[">", PREC.COMPARE],
				["<=", PREC.COMPARE],
				[">=", PREC.COMPARE],
				[$.operator, PREC.CONCAT],
				["+", PREC.ADD],
				["-", PREC.ADD],
				["*", PREC.MUL],
				["/", PREC.MUL],
			];

			return choice(
				...operators.map(([op, precedence]) =>
					prec.left(
						precedence,
						seq(
							field("left", $._expression),
							field("op", op),
							field("right", $._expression),
						),
					),
				),
			);
		},

		range_expression: ($) =>
			prec.left(
				PREC.RANGE,
				choice(
					seq(
						field("start", $._expression),
						field("op", choice("..", "..=")),
						field("end", $._expression),
					),
					seq(field("start", $._expression), field("op", "..")),
					seq(field("op", "..="), field("end", $._expression)),
					seq(field("op", ".."), optional(field("end", $._expression))),
				),
			),

		unary_expression: ($) =>
			prec(PREC.UNARY, seq(field("op", choice("!", "-")), field("operand", $._expression))),

		pipe_expression: ($) =>
			prec.left(
				PREC.PIPE,
				seq(field("left", $._expression), "|>", field("right", $._expression)),
			),

		primary_expression: ($) =>
			choice(
				$.identifier,
				$.type_identifier,
				$.number,
				$.string,
				$.bool,
				$.unit_expression,
				$.block,
				$.parenthesized_expression,
				$.tuple_expression,
				$.array_expression,
				$.record_expression,
				$.if_expression,
				$.match_expression,
				$.for_expression,
				$.loop_expression,
				$.break_expression,
				"continue",
				$.return_expression,
				$.import_expression,
				$.lambda_expression,
				$.do_expression,
				$.call_expression,
				$.field_access_expression,
				$.index_expression,
				$.associated_access_expression,
			),

		call_expression: ($) =>
			prec.left(
				PREC.CALL,
				seq(
					field("function", $.primary_expression),
					"(",
					sep($._expression, ","),
					")",
				),
			),

		field_access_expression: ($) =>
			prec.left(
				PREC.FIELD,
				seq(
					field("object", $.primary_expression),
					".",
					field("field", $.identifier),
				),
			),

		index_expression: ($) =>
			prec.left(
				PREC.CALL,
				seq(
					field("receiver", $.primary_expression),
					"[",
					field("key", $._expression),
					"]",
				),
			),

		associated_access_expression: ($) =>
			prec.left(
				PREC.FIELD,
				seq(
					field("type", $.associated_target),
					"::",
					field("member", $.identifier),
				),
			),

		associated_target: ($) =>
			$.associated_type,

		associated_type: ($) =>
			choice(
				$.associated_type_hole,
				$.type_variable,
				$.type_identifier,
				$.identifier,
				$.associated_type_apply,
				$.associated_type_array,
				$.associated_type_record,
				$.associated_type_fn,
				$.associated_type_mut,
				$.never_type,
				$.unit_type,
				$.associated_parenthesized_type,
				$.associated_type_tuple,
			),

		associated_type_apply: ($) =>
			seq(
				field("name", choice($.type_identifier, $.identifier, $.type_variable)),
				"(",
				sep1(field("argument", $.associated_type), ","),
				")",
			),

		associated_type_hole: ($) => "_",

		associated_type_array: ($) => seq("[", $.associated_type, "]"),

		associated_type_record: ($) =>
			seq(
				"#",
				"{",
				choice(
					seq(sep($.associated_type_field, ","), optional(",")),
					seq(sep1($.associated_type_field, ","), ",", $.type_rest),
					$.type_rest,
				),
				"}",
			),

		associated_type_field: ($) =>
			seq(field("name", $.identifier), ":", field("type", $.associated_type)),

		associated_type_fn: ($) =>
			seq(
				"fn",
				"(",
				sep($.associated_type_fn_parameter, ","),
				")",
				"->",
				field("return_type", $.associated_type_fn_return),
			),

		associated_type_fn_parameter: ($) =>
			prec(
				1,
				seq(optional(field("mut", "mut")), field("type", $.associated_type)),
			),

		associated_type_fn_return: ($) =>
			prec(
				1,
				seq(optional(field("mut", "mut")), field("type", $.associated_type)),
			),

		associated_type_mut: ($) => seq("mut", field("type", $.associated_type)),

		associated_parenthesized_type: ($) => seq("(", $.associated_type, ")"),

		associated_type_tuple: ($) =>
			seq(
				"(",
				$.associated_type,
				",",
				sep($.associated_type, ","),
				optional(","),
				")",
			),

		block: ($) => seq("{", repeat($.block_statement), optional($._expression), "}"),

		block_statement: ($) => choice($.let_stmt, $.fn_group_stmt, $.expression_statement),

		unit_expression: ($) => seq("(", ")"),

		parenthesized_expression: ($) => seq("(", $._expression, ")"),

		tuple_expression: ($) =>
			seq(
				"(",
				$._expression,
				",",
				sep($._expression, ","),
				optional(","),
				")",
			),

		array_element: ($) =>
			choice(
				field("spread", seq("..", $._expression)),
				$._expression,
			),

		array_expression: ($) => seq("[", sep($.array_element, ","), optional(","), "]"),

		record_field_or_spread: ($) =>
			choice(
				seq("..", field("spread", $._expression)),
				$.field_initializer,
				field("shorthand", $.identifier),
			),

		record_expression: ($) =>
			seq("#", "{", sep($.record_field_or_spread, ","), optional(","), "}"),

		field_initializer: ($) =>
			seq(field("name", $.identifier), ":", field("value", $._expression)),

		if_expression: ($) =>
			prec.right(
				seq(
					"if",
					field("condition", $._expression),
					field("then", $._expression),
					optional(seq("else", field("else", $._expression))),
				),
			),

		match_expression: ($) =>
			seq(
				"match",
				field("value", $._expression),
				"{",
				repeat($.match_arm),
				"}",
			),

		match_arm: ($) =>
			seq(
				field("pattern", $.pattern),
				"->",
				field("value", $._expression),
				optional(","),
			),

		pattern: ($) =>
			choice(
				$.wildcard_pattern,
				$.range_pattern,
				$.number_pattern,
				$.bool,
				$.identifier,
				$.type_identifier,
				$.string,
				$.constructor_pattern,
				$.record_pattern,
				$.tuple_pattern,
				$.parenthesized_pattern,
				$.list_pattern,
			),

		wildcard_pattern: ($) => "_",

		number_pattern: ($) => seq(optional("-"), $.number),

		range_pattern: ($) =>
			seq(
				optional("-"),
				$.number,
				choice("..", "..="),
				optional("-"),
				$.number,
			),

		constructor_pattern: ($) =>
			seq(
				field("name", choice($.identifier, $.type_identifier)),
				"(",
				field("binding", $.pattern),
				")",
			),

		record_pattern: ($) =>
			seq(
				"#",
				"{",
				choice(
					seq(sep($.record_pattern_field, ","), optional(",")),
					seq(sep1($.record_pattern_field, ","), ",", $.record_rest_pattern),
					$.record_rest_pattern,
				),
				"}",
			),

		record_pattern_field: ($) =>
			seq(
				field("field", $.identifier),
				optional(seq(":", field("binding", $.identifier))),
			),

		record_rest_pattern: ($) => seq("..", optional(field("binding", $.identifier))),

		parenthesized_pattern: ($) => seq("(", $.pattern, ")"),

		tuple_pattern: ($) =>
			seq("(", $.pattern, ",", sep($.pattern, ","), optional(","), ")"),

		list_pattern: ($) =>
			seq(
				"[",
				choice(
					seq(sep($.pattern, ","), optional(",")),
					seq(sep1($.pattern, ","), ",", $.list_rest_pattern),
					$.list_rest_pattern,
				),
				"]",
			),

		list_rest_pattern: ($) => seq("..", optional(field("binding", $.identifier))),

		for_expression: ($) =>
			seq(
				"for",
				field("item", $.pattern),
				"in",
				field("iterable", $._expression),
				field("body", $.block),
			),

		loop_expression: ($) => seq("loop", field("body", $.block)),

		break_expression: ($) => prec.right(seq("break", optional($._expression))),

		return_expression: ($) =>
			prec.right(seq("return", optional($._expression))),

		import_expression: ($) => seq("import", $.string),

		lambda_expression: ($) =>
			// Lambda bodies require braces so `fn(x) { ... }` stays an expression
			// atom and does not greedily consume surrounding expression syntax.
			seq(
				"fn",
				field("parameters", $.parameters),
				optional(seq("->", field("return_type", $._type))),
				field("body", $.block),
			),

		// `do { ... }` — monadic block, desugared to >>= chains at parse time.
		// Statements are either:
		//   let [mut] pat [: ty] = expr ;   (plain let)
		//   let [mut] pat [: ty] <- expr ;  (monadic bind)
		//   expr ;                           (sequenced effect)
		// The block must end with a final expression (no semicolon).
		do_expression: ($) =>
			seq(
				"do",
				"{",
				repeat($.do_statement),
				optional($._expression),
				"}",
			),

		do_statement: ($) =>
			choice(
				$.do_bind_statement,
				$.let_stmt,
				$.expression_statement,
			),

		// `let [mut] pat [: ty] <- expr ;`
		do_bind_statement: ($) =>
			seq(
				"let",
				optional(field("mut", "mut")),
				field("pattern", $.pattern),
				optional(seq(":", field("type", $._type))),
				"<-",
				field("value", $._expression),
				";",
			),

		// --- Types ---

		_type: ($) =>
			choice(
				$.type_hole,
				$.type_variable,
				$.type_identifier,
				$.identifier,
				$.type_apply,
				$.type_array,
				$.type_record,
				$.type_fn,
				$.type_mut,
				$.never_type,
				$.unit_type,
				$.parenthesized_type,
				$.type_tuple,
			),

		type_hole: ($) => "*",

		type_identifier: ($) => /[A-Z][a-zA-Z0-9_]*/,

		type_variable: ($) => /'[a-zA-Z_][a-zA-Z0-9_]*/,

		type_apply: ($) =>
			seq(
				field("name", choice($.type_identifier, $.identifier, $.type_variable)),
				"(",
				sep1($._type, ","),
				")",
			),

		type_array: ($) => seq("[", $._type, "]"),

		type_record: ($) =>
			seq(
				"#",
				"{",
				choice(
					seq(sep($.type_field, ","), optional(",")),
					seq(sep1($.type_field, ","), ",", $.type_rest),
					$.type_rest,
				),
				"}",
			),

		type_field: ($) =>
			seq(field("name", $.identifier), ":", field("type", $._type)),

		type_rest: ($) => "..",

		type_fn: ($) =>
			seq(
				"fn",
				"(",
				sep($.type_fn_parameter, ","),
				")",
				"->",
				field("return_type", $.type_fn_return),
			),

		type_fn_parameter: ($) =>
			prec(1, seq(optional(field("mut", "mut")), field("type", $._type))),

		type_fn_return: ($) =>
			prec(1, seq(optional(field("mut", "mut")), field("type", $._type))),

		return_type: ($) =>
			prec(1, seq(optional(field("mut", "mut")), field("type", $._type))),

		type_mut: ($) => seq("mut", field("type", $._type)),

		never_type: ($) => "!",

		unit_type: ($) => seq("(", ")"),

		parenthesized_type: ($) => seq("(", $._type, ")"),

		type_tuple: ($) =>
			seq("(", $._type, ",", sep($._type, ","), optional(","), ")"),

		// --- Terminals ---

		identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

		number: ($) => /[0-9]+(?:\.[0-9]+)?/,

		string: ($) => /"([^"\\]|\\.)*"/,

		bool: ($) => choice("true", "false"),

		operator: ($) =>
			choice(
				/[+\-*/=!<>|&?$@^~%][+\-*/=!<>|&?$@^~%.]*/,
				/\.[+\-*/=!<>|&?$@^~%.]+/,
			),

		// `#!/usr/bin/env hern` — shebang line; treated as whitespace (in extras).
		// Uses a negative character class for the third char so it never matches
		// `#![...]` (inner attributes), which also start with `#!`.
		hashbang: ($) => token(seq("#!", /[^\[\n][^\n]*/)),

		// Priority 1 ensures the comment token wins over the `operator` regex
		// whenever both could match `//` at the same position.
		comment: ($) => token(prec(1, seq("//", /.*/)))
	},
});

function sep(rule, separator) {
	return optional(sep1(rule, separator));
}

function sep1(rule, separator) {
	return seq(rule, repeat(seq(separator, rule)));
}
