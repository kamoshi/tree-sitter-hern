// ==============================================================================
// Hern tree-sitter grammar
// ==============================================================================

const PREC = {
	ASSIGN: 1,
	PIPE: 2,
	OR: 3,
	AND: 4,
	COMPARE: 5,
	CONCAT: 6,
	ADD: 7,
	MUL: 8,
	UNARY: 9,
	FIELD: 10,
	CALL: 11,
};

module.exports = grammar({
	name: "hern",

	word: ($) => $.identifier,

	extras: ($) => [/\s/, $.comment],

	conflicts: ($) => [
		[$.expression_statement, $.block],
		[$.variant, $._type, $.type_apply],
		[$.variant, $._type],
		[$._type, $.type_apply],
		[$.variant],
	],

	rules: {
		program: ($) => repeat($._stmt),

		_stmt: ($) =>
			choice(
				$.let_stmt,
				$.fn_stmt,
				$.trait_stmt,
				$.impl_stmt,
				$.type_def_stmt,
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
				"fn",
				optional($._fn_fixity),
				field("name", choice($.identifier, $.operator)),
				optional(field("type_bounds", $.type_bounds)),
				field("parameters", $.parameters),
				optional(seq("->", field("return_type", $._type))),
				field("body", $._expression),
			),

		_fn_fixity: ($) =>
			seq(
				field("fixity", choice("infixl", "infixr", "infix")),
				field("precedence", $.number),
			),

		type_bounds: ($) => seq("[", sep1($.type_bound, ","), "]"),

		type_bound: ($) =>
			seq(
				field("var", choice($.identifier, $.type_variable)),
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
				field("param", choice($.identifier, $.type_variable)),
				"{",
				repeat($.trait_method),
				"}",
			),

		trait_method: ($) =>
			seq(
				optional($.attribute),
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

		// Handles both trait impls (`impl Trait for Type`) and inherent impls (`impl Type`).
		impl_stmt: ($) =>
			seq(
				"impl",
				optional(seq(field("trait", $._type), "for")),
				field("type", $._type),
				"{",
				repeat($.impl_method),
				"}",
			),

		impl_method: ($) =>
			seq(
				optional($.attribute),
				"fn",
				field("name", choice($.identifier, $.operator)),
				field("parameters", $.parameters),
				optional(seq("->", field("return_type", $._type))),
				field("body", $._expression),
			),

		type_def_stmt: ($) =>
			seq(
				"type",
				field("name", $.identifier),
				optional($.type_params),
				"=",
				choice(
					prec.dynamic(1, seq(sep1($.variant, "|"))),
					prec.dynamic(-1, $._type),
				),
				optional(";"),
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

		attribute: ($) => seq("#", "[", "inline", "]"),

		extern_attribute: ($) => seq("#", "[", "template", "]"),

		// --- Expressions ---

		_expression: ($) =>
			choice(
				$.assignment_expression,
				$.binary_expression,
				$.unary_expression,
				$.pipe_expression,
				$.primary_expression,
			),

		assignment_expression: ($) =>
			prec.right(
				PREC.ASSIGN,
				seq(
					field("left", choice($.identifier, $.field_access_expression)),
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
				[$.operator, PREC.CONCAT],
				["+", PREC.ADD],
				["-", PREC.ADD],
				["*", PREC.MUL],
				["..", PREC.CONCAT],
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

		unary_expression: ($) =>
			prec(PREC.UNARY, seq(field("op", "!"), field("operand", $._expression))),

		pipe_expression: ($) =>
			prec.left(
				PREC.PIPE,
				seq(field("left", $._expression), "|>", field("right", $._expression)),
			),

		primary_expression: ($) =>
			choice(
				$.identifier,
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
				$.call_expression,
				$.field_access_expression,
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

		block: ($) => seq("{", repeat($.block_statement), optional($._expression), "}"),

		block_statement: ($) => choice($.let_stmt, $.fn_stmt, $.expression_statement),

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
				$.identifier,
				$.string,
				$.constructor_pattern,
				$.record_pattern,
				$.tuple_pattern,
				$.parenthesized_pattern,
				$.list_pattern,
			),

		wildcard_pattern: ($) => "_",

		constructor_pattern: ($) =>
			seq(
				field("name", $.identifier),
				"(",
				field("binding", $.identifier),
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
			seq(
				"fn",
				field("parameters", $.parameters),
				choice(seq("->", field("body", $._expression)), field("body", $.block)),
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
			seq("fn", "(", sep($._type, ","), ")", "->", $._type),

		type_mut: ($) => seq("mut", field("type", $._type)),

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

		comment: ($) => token(seq("//", /.*/)),
	},
});

function sep(rule, separator) {
	return optional(sep1(rule, separator));
}

function sep1(rule, separator) {
	return seq(rule, repeat(seq(separator, rule)));
}
