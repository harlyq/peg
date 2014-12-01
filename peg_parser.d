# Hierarchical syntax
Grammar <- Spacing Definition+ EndOfFile

Definition <- identifier:Identifier LEFTARROW definition:Expression 
{ 
	definition.debug = "'" + identifier + "'";

	define[identifier] = definition;
	return definition;
}

Expression <- first:Sequence rest:(SLASH Sequence)* 
{
	var defintion = {};
	if (!rest) {
		definition.type = SEQUENCE;
		definition.children = [first];
	} else {
		definition.type = OR;
		definition.children = [].concat.apply(first, rest);
	}
	return definition;
}

Sequence <- Prefix*

Prefix <- (and:AND / not:NOT)? child: Suffix
{
	var type;
	if (and)
		type = AND;
	else if (not)
		type = NOT;

	if (type)
		return {type: type, child: child};
	else 
		return child;
}

Suffix <- child:Primary (question:QUESTION / start:STAR / plus:PLUS)?
{
	var type;
	if (question)
		type = OPTION;
	else if (star)
		type = ZERO_OR_MORE;
	else if (plus)
		type = ATLEAST_ONE;

	if (type)
		return {type: type, child: child};
	else
		return child;
}

Primary <- identifier:Identifier !LEFTARROW
{
	return {type: DEFINITION, defn: identifier};
}
/ OPEN Expression CLOSE
/ Literal 
/ Class 
/ DOT
{	
	return {type: ANY_CHAR}; 
}

# Lexical syntax
Identifier <- IdentStart IdentCont* Spacing
IdentStart <- [a-zA-Z_]
IdentCont <- IdentStart / [0-9]

Literal <- ['] value:(!['] Char)* ['] Spacing
{	
	return {type: LITERAL, value: value}; 
}
/ ["] value:(!["] Char)* ["] Spacing
{	
	return {type: LITERAL, value: value}; 
}

Class <- '[' chars:(!']' Range)* ']' Spacing
{	
	return {type: SET, chars: chars}; 
}

Range <- a:Char '-' b:Char 
{ 	
	var str = '';
	for (i = a.charCodeAt(0); i < b.charCodeAt(0); ++i)
		str += String.fromCharCode(i);
	return str;
}
/ c:Char 
{	
	return c; 
}

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
DOT <- '.' Spacing
Spacing <- (Space / Comment)*
Comment <- '#' (!EndOfLine .)* EndOfLine
Space <- ' ' / '\t' / EndOfLine
EndOfLine <- '\r\n' / '\n' / '\r'
EndOfFile <- !.
