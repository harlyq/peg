#Prologue code
{
    var outDefine = {},
        tab = '    ';

    // called at the beginning of every PEGParser.parse()
    define.parse = function() {
        outDefine = {};
    }

    var stringToType = function(str) {
        var i = '*+/?&!'.indexOf(str.trim());
        if (i !== -1)
            return ['zero or more', 'at least one', 'or', 'option', 'test', 'not'][i];

        debugger; // unknown type
        return 'unknown';
    }

    function resultsToCode(results) {
        var code = '(function() {\n';

        var name = results.name;

        code += tab + 'var define = {};\n\n';

        if (results.prologue) {
            code += '// PROLOGUE';
            code += results.prologue;
        }

        for (var k in results.definitions) {
            code += tab + 'define.' + name + '$' + k + ' = ';
            code += structToCode(name, results.definitions[k], tab) + '\n\n';
        }

        if (results.epilogue)
            code += results.epilogue;

        code += tab + 'if (typeof module !== \'undefined\') {\n';
        code += tab + tab + 'module.exports = define; // commonjs\n';
        code += tab + '} else {\n';
        code += tab + tab + 'window.' + name + ' = {}; // html <script>\n';
        code += tab + tab + 'window.' + name + '.define = define;\n';
        code += tab + '}\n';

        code += '})();\n';

        return code;
    }

    // outputs a string of formatted code
    function structToCode(name, definition, prefix) {
        if (typeof prefix === 'undefined')
            prefix = '';

        var code = '{',
            prefixTab = prefix + tab;

        var i = 0;
        for (var key in definition) {
            if (!definition[key])
                continue; // parameter should never be undefined

            code += (i++ === 0) ? '\n' : ',\n';

            switch (key) {
                case 'defn':
                    // definitions are in the form [<grammar>$]<defn>
                    var defn = definition[key];
                    if (defn.indexOf('$') === -1)
                        defn = name + '$' + defn; // prepend <grammar>$

                    code += prefixTab + key + ': "' + defn + '"';
                    break;

                case 'children':
                    code += prefixTab + 'children: [';

                    for (var i = 0; i < definition.children.length; ++i) {
                        if (i > 0)
                            code += ', ';

                        code += structToCode(name, definition.children[i], prefixTab);
                    }
                    code += ']';
                    break;

                case 'child':
                    code += prefixTab + 'child: ' + structToCode(name, definition.child, prefixTab);
                    break;

                case 'action':
                    var params = [];
                    if ('child' in definition) {
                        params = [definition.child.param];
                    } else if ('children' in definition) {
                        for (var i = 0; i < definition.children.length; ++i) {
                            var child = definition.children[i];
                            if (child.param)
                                params.push(child.param);
                        }
                    }
                    code += prefixTab + 'action: function(' + params.join(',') + ') {\n';
                    code += definition.action.replace(/^.*$/gm, function(match) {
                        return prefixTab + tab + match;
                    });
                    code += '\n' + prefixTab + '}';
                    break;

                default:
                    code += prefixTab + key + ': "' + definition[key] + '"';
                    break;
            }
        }

        code += '\n' + prefix + '}';
        return code;
    }
}

# Hierarchical syntax
peg_to_javascript <- Spacing prologue:CodeBlock? definitions:Definition+ epilogue:CodeBlock? EndOfFile
{
    var names = Object.keys(outDefine);
    if (names.length === 0)
        return undefined; // no definitions

    return resultsToCode({
        name: names[0],
        prologue: prologue,
        definitions: outDefine,
        epilogue: epilogue
    });
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
            type: 'or',
            children: [].concat.apply(first, rest)
        };
}


Sequence <- children:(param:Parameter? expression:Prefix { if (param) expression.param = param; return expression; } )* action:CodeBlock?
{
    if (typeof children === 'undefined' || children.length === 0)
        return undefined;

    var definition;
    if (children.length === 1)
        definition = children[0];
    else
        definition = {
            type: 'sequence',
            children: children
        };

    var trimmedAction = action ? action.trim() : '';
    if (trimmedAction)
        definition.action = trimmedAction;

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
        type: 'definition',
        defn: identifier.trim()
    };
}
/ OPEN expression:Expression CLOSE { return expression; }
/ Literal 
/ Class 
/ DOT

# Lexical syntax
Parameter <- param:Identifier ':' Spacing
{
    return param.trim();
}

CodeBlock <- '{' codeparts:(NestedCodeBlock / ![}] .)* '}' Spacing
{
    return codeparts;
}

NestedCodeBlock <- '{' (NestedCodeBlock / ![}] .)* '}' Spacing


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
    return { type: 'literal', value: chars.replace(/"/g, "\\\"") };
}
/ ["] chars:(!["] Char)* ["] Spacing
{	
    return { type: 'set', value: chars.replace(/"/g, "\\\"") };
}

Class <- '[' chars:(!']' Range)* ']' Spacing
{	
	return {type: 'set', chars: chars.replace(/"/g, "\\\"")}; 
}

Range <- a:Char '-' b:Char 
{ 	
	var str = '';
	for (var i = a.charCodeAt(0); i < b.charCodeAt(0); ++i)
		str += String.fromCharCode(i);
	return str;
}
/ Char 

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
DOT <- '.' Spacing { return { type: 'any char' }; }
Spacing <- (Space / Comment)*
Comment <- '#' (!EndOfLine .)* EndOfLine { return ''; // no comments in output }
Space <- ' ' / '\t' / EndOfLine
EndOfLine <- '\r\n' / '\n' / '\r'
EndOfFile <- !. {} # empty action is needed so that the epilogue is not used as this action

#Epilogue code
{
}
