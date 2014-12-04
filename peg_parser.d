#Prologue code
{
    // note: ranges are auto expanded in the set
    var UNKNOWN = 'unknown',
        DEFINITION = 'definition', // a -> b
        SEQUENCE = 'sequence', // a b c
        OR = 'or', // /
        TEST = 'test', // &
        OPTION = 'option', // ?
        ATLEAST_ONE = 'at least one', // +
        ZERO_OR_MORE = 'zero or more', // *
        NOT = 'not', // !
        LITERAL = 'literal', // 'x'
        SET = 'set', // []
        ANY_CHAR = 'any char'; // .

    var stringToType = function(str) {
        var i = '*+/?&!'.indexOf(str.trim());
        if (i !== -1)
            return [ZERO_OR_MORE, ATLEAST_ONE, OR, OPTION, TEST, NOT][i];

        debugger; // unknown type
        return UNKNOWN;
    }

    var define: any = {};
    var outDefine: any = {};
}

# Hierarchical syntax
Grammar <- Spacing prologue:CodeBlock? definitions:Definition+ epilogue:CodeBlock? EndOfFile
{
    return {
        prologue: prologue,
        definitions: outDefine,
        epilogue: epilogue
    };
}

Definition <- identifier:Identifier LEFTARROW definition:Expression 
{ 
    definition.debug = identifier;

    outDefine[identifier] = definition;
    return definition;
}

Expression <- first:Sequence rest:(SLASH part:Sequence {return part;})* 
{
    if (first && !rest)
        return first;
    else if (first && rest)
        return {
            type: OR,
            children: [].concat.apply(first, rest)
        };
}


Sequence <- children:(param:Parameter expression:Prefix { if (param) expression.param = param; return param; } )* action:CodeBlock?
{
    if (typeof children === 'undefined' || children.length === 0)
        return undefined;

    var definition: any;
    if (children.length === 1)
        definition = children[0];
    else
        definition = {
            type: SEQUENCE,
            children: children
        };

    if (action)
        definition.action = action;

    return definition;
}

Prefix <- option:(AND / NOT)? part:Suffix
{
    if (option)
        return {
            type: stringToType(option),
            child: part
        };
    else
        return part;
}

Suffix <- part:Primary option:(QUESTION / STAR / PLUS)?
{
    if (option)
        return {
            type: stringToType(option),
            child: part
        };
    else
        return part;
}

Primary <- identifier:Identifier !LEFTARROW
{
    return {
        type: DEFINITION,
        defn: identifier.trim()
    };
}
/ OPEN expression:Expression CLOSE { return expression; }
/ Literal 
/ Class 
/ DOT

# Lexical syntax
Parameter <- param:Identifer ':' Spacing
{
    return param.trim();
}

CodeBlock <- '{' (CodeBlock / ![}] .)* '}' Spacing

Identifier <- first:IdentStart rest:IdentCont* Spacing
{
    if (rest)
        return first + rest;
    else
        return first;
}
IdentStart <- [a-zA-Z_]
IdentCont <- IdentStart / [0-9]

Literal <- ['] chars:(!['] Char)* ['] Spacing
{	
    return { type: LITERAL, value: chars };
}
/ ["] chars:(!["] Char)* ["] Spacing
{	
    return { type: LITERAL, value: chars };
}

Class <- '[' chars:(!']' Range)* ']' Spacing
{	
	return {type: SET, chars: chars}; 
}

Range <- a:Char '-' b:Char 
{ 	
	var str = '';
	for (var i = a.charCodeAt(0); i < b.charCodeAt(0); ++i)
		str += String.fromCharCode(i);
	return str;
}
/ c:Char 

Char <- '\\' [nrt'"\[\]\\]
/ '\\' [0-2][0-7][0-7]
/ '\\' [0-7][0-7]?
/ !'\\' .
LEFTARROW <- '<-' Spacing
SLASH <- '/' Spacing
AND <- '&' Spacing
NOT <- '!' Spacing
QUESTION <- '?' Spacing
STAR <- '*' Spacing
PLUS <- '+' Spacing
OPEN <- '(' Spacing
CLOSE <- ')' Spacing
DOT <- '.' Spacing { return { type: ANY_CHAR }; }
Spacing <- (Space / Comment)*
Comment <- '#' (!EndOfLine .)* EndOfLine { return ''; }
Space <- ' ' / '\t' / EndOfLine
EndOfLine <- '\r\n' / '\n' / '\r'
EndOfFile <- !. {}

#Epilogue code
{
    // this is a test
}
