function peg(str) {
    if (typeof str !== 'string')
        return 'error: input parameter is not a string - ' + str;

    if (str.length === 0)
        return 'error: input string is empty';

    // note: ranges are auto expanded in the set
    var UNKNOWN = 'unknown', DEFINITION = 'definition', SEQUENCE = 'sequence', OR = 'or', TEST = 'test', OPTION = 'option', ATLEAST_ONE = 'at least one', ZERO_OR_MORE = 'zero or more', NOT = 'not', LITERAL = 'literal', SET = 'set', ANY_CHAR = 'any char';

    var stringToType = function (str) {
        var i = '*+/?&!'.indexOf(str.trim());
        if (i !== -1)
            return [ZERO_OR_MORE, ATLEAST_ONE, OR, OPTION, TEST, NOT][i];

        debugger;
        return UNKNOWN;
    };

    var outDefine = {};

    var define = {};

    define.peg$EndOfFile = {
        type: SEQUENCE,
        debug: 'EndOfFile',
        children: [{
                type: NOT,
                child: {
                    type: ANY_CHAR
                }
            }]
    };

    define.peg$EndOfLine = {
        type: SEQUENCE,
        debug: 'EndOfLine',
        children: [{
                type: OR,
                children: [
                    {
                        type: SEQUENCE,
                        children: [
                            {
                                type: LITERAL,
                                value: '\r'
                            }, {
                                type: LITERAL,
                                value: '\n'
                            }]
                    }, {
                        type: LITERAL,
                        value: '\n'
                    }, {
                        type: LITERAL,
                        value: '\r'
                    }]
            }]
    };

    define.peg$Space = {
        type: SEQUENCE,
        debug: 'Space',
        children: [{
                type: OR,
                children: [
                    {
                        type: LITERAL,
                        value: ' '
                    }, {
                        type: LITERAL,
                        value: '\t'
                    }, {
                        type: DEFINITION,
                        defn: 'EndOfLine'
                    }]
            }]
    };

    define.peg$Comment = {
        type: SEQUENCE,
        debug: 'Comment',
        children: [
            {
                type: LITERAL,
                value: '#'
            }, {
                type: ZERO_OR_MORE,
                child: {
                    type: SEQUENCE,
                    children: [
                        {
                            type: NOT,
                            child: {
                                type: DEFINITION,
                                defn: 'EndOfLine'
                            }
                        }, {
                            type: ANY_CHAR
                        }]
                }
            }, {
                type: DEFINITION,
                defn: 'EndOfLine'
            }],
        action: function () {
            return '';
        }
    };

    define.peg$Spacing = {
        type: ZERO_OR_MORE,
        debug: 'Spacing',
        child: {
            type: OR,
            children: [
                {
                    type: DEFINITION,
                    defn: 'Space'
                }, {
                    type: DEFINITION,
                    defn: 'Comment'
                }]
        }
    };

    define.peg$DOT = {
        type: SEQUENCE,
        debug: 'DOT',
        children: [
            {
                type: LITERAL,
                value: '.'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }],
        action: function () {
            return {
                type: ANY_CHAR
            };
        }
    };

    define.peg$CLOSE = {
        type: SEQUENCE,
        debug: 'CLOSE',
        children: [
            {
                type: LITERAL,
                error: 'expected )',
                value: ')'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$OPEN = {
        type: SEQUENCE,
        debug: 'OPEN',
        children: [
            {
                type: LITERAL,
                error: 'expected (',
                value: '('
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$PLUS = {
        type: SEQUENCE,
        debug: 'SEQUENCE',
        children: [
            {
                type: LITERAL,
                value: '+'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$STAR = {
        type: SEQUENCE,
        debug: 'STAR',
        children: [
            {
                type: LITERAL,
                value: '*'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$QUESTION = {
        type: SEQUENCE,
        debug: 'QUESTION',
        children: [
            {
                type: LITERAL,
                value: '?'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$NOT = {
        type: SEQUENCE,
        debug: 'NOT',
        children: [
            {
                type: LITERAL,
                value: '!'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$AND = {
        type: SEQUENCE,
        debug: 'AND',
        children: [
            {
                type: LITERAL,
                value: '&'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$SLASH = {
        type: SEQUENCE,
        debug: 'SLASH',
        children: [
            {
                type: LITERAL,
                error: 'expected /',
                value: '/'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$LEFTARROW = {
        type: SEQUENCE,
        debug: 'LEFTARROW',
        children: [
            {
                type: LITERAL,
                error: 'expected <-',
                value: '<-'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$Char = {
        type: OR,
        debug: 'Char',
        children: [
            {
                type: SEQUENCE,
                children: [
                    {
                        type: LITERAL,
                        value: '\\'
                    }, {
                        type: SET,
                        chars: 'nrt\'"[]\\'
                    }]
            }, {
                type: SEQUENCE,
                children: [
                    {
                        type: LITERAL,
                        value: '\\'
                    }, {
                        type: SET,
                        chars: '012'
                    }, {
                        type: SET,
                        chars: '01234567'
                    }, {
                        type: SET,
                        chars: '01234567'
                    }]
            }, {
                type: SEQUENCE,
                children: [
                    {
                        type: LITERAL,
                        value: '\\'
                    }, {
                        type: SET,
                        chars: '01234567'
                    }, {
                        type: OPTION,
                        child: {
                            type: SET,
                            chars: '01234567'
                        }
                    }]
            }, {
                type: SEQUENCE,
                children: [
                    {
                        type: NOT,
                        child: {
                            type: LITERAL,
                            value: '\\'
                        }
                    }, {
                        type: ANY_CHAR
                    }]
            }]
    };

    define.peg$Range = {
        type: OR,
        debug: 'Range',
        children: [
            {
                type: SEQUENCE,
                children: [
                    {
                        type: DEFINITION,
                        param: 'start',
                        defn: 'Char'
                    }, {
                        type: LITERAL,
                        value: '-'
                    }, {
                        type: DEFINITION,
                        param: 'end',
                        defn: 'Char'
                    }],
                action: function (start, end) {
                    // expand the range
                    var str = '';
                    for (var i = start.charCodeAt(0); i < end.charCodeAt(0); ++i)
                        str += String.fromCharCode(i);
                    return str;
                }
            }, {
                type: DEFINITION,
                defn: 'Char'
            }]
    };

    define.peg$Class = {
        type: SEQUENCE,
        debug: 'Class',
        children: [
            {
                type: LITERAL,
                value: '['
            }, {
                type: ZERO_OR_MORE,
                param: 'chars',
                child: {
                    type: SEQUENCE,
                    children: [
                        {
                            type: NOT,
                            child: {
                                type: LITERAL,
                                value: ']'
                            }
                        }, {
                            type: DEFINITION,
                            defn: 'Range'
                        }]
                }
            }, {
                type: LITERAL,
                value: ']'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }],
        action: function (chars) {
            return {
                type: SET,
                chars: chars.replace(/"/g, "\\\"")
            };
        }
    };

    define.peg$Literal = {
        type: OR,
        debug: 'Literal',
        children: [
            {
                type: SEQUENCE,
                children: [
                    {
                        type: LITERAL,
                        value: '\''
                    }, {
                        type: ZERO_OR_MORE,
                        param: 'chars',
                        child: {
                            type: SEQUENCE,
                            children: [
                                {
                                    type: NOT,
                                    child: {
                                        type: LITERAL,
                                        value: '\''
                                    }
                                }, {
                                    type: DEFINITION,
                                    defn: 'Char'
                                }]
                        }
                    }, {
                        type: LITERAL,
                        error: 'expected \'',
                        value: '\''
                    }, {
                        type: DEFINITION,
                        defn: 'Spacing'
                    }],
                action: function (chars) {
                    return {
                        type: LITERAL,
                        value: chars.replace(/"/g, "\\\"")
                    };
                }
            }, {
                type: SEQUENCE,
                children: [
                    {
                        type: LITERAL,
                        value: '"'
                    }, {
                        type: ZERO_OR_MORE,
                        param: 'chars',
                        child: {
                            type: SEQUENCE,
                            children: [
                                {
                                    type: NOT,
                                    child: {
                                        type: LITERAL,
                                        value: '"'
                                    }
                                }, {
                                    type: DEFINITION,
                                    defn: 'Char'
                                }]
                        }
                    }, {
                        type: LITERAL,
                        error: 'expected \"',
                        value: '"'
                    }, {
                        type: DEFINITION,
                        defn: 'Spacing'
                    }],
                action: function (chars) {
                    return {
                        type: LITERAL,
                        value: chars.replace(/"/g, "\\\"")
                    };
                }
            }]
    };

    define.peg$IdentStart = {
        type: SET,
        debug: 'IdentStart',
        chars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    };

    define.peg$IdentCont = {
        type: OR,
        debug: 'IdentCont',
        children: [
            {
                type: DEFINITION,
                defn: 'IdentStart'
            }, {
                type: SET,
                chars: '0123456789'
            }]
    };

    define.peg$Identifier = {
        type: SEQUENCE,
        debug: 'Identifier',
        children: [
            {
                type: DEFINITION,
                param: 'first',
                defn: 'IdentStart'
            }, {
                type: ZERO_OR_MORE,
                param: 'rest',
                child: {
                    type: DEFINITION,
                    defn: 'IdentCont'
                }
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }],
        action: function (first, rest) {
            if (rest)
                return first + rest;
            else
                return first;
        }
    };

    define.peg$NestedCodeBlock = {
        type: SEQUENCE,
        debug: 'CodeBlock',
        children: [
            {
                type: LITERAL,
                value: '{'
            }, {
                type: ZERO_OR_MORE,
                param: 'codeparts',
                child: {
                    type: OR,
                    children: [
                        {
                            type: DEFINITION,
                            defn: 'NestedCodeBlock'
                        }, {
                            type: SEQUENCE,
                            children: [
                                {
                                    type: NOT,
                                    child: {
                                        type: LITERAL,
                                        value: '}'
                                    }
                                }, {
                                    type: ANY_CHAR
                                }]
                        }]
                }
            }, {
                type: LITERAL,
                value: '}'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$CodeBlock = {
        type: SEQUENCE,
        debug: 'CodeBlock',
        children: [
            {
                type: LITERAL,
                value: '{'
            }, {
                type: ZERO_OR_MORE,
                param: 'codeparts',
                child: {
                    type: OR,
                    children: [
                        {
                            type: DEFINITION,
                            defn: 'NestedCodeBlock'
                        }, {
                            type: SEQUENCE,
                            children: [
                                {
                                    type: NOT,
                                    child: {
                                        type: LITERAL,
                                        value: '}'
                                    }
                                }, {
                                    type: ANY_CHAR
                                }]
                        }]
                }
            }, {
                type: LITERAL,
                value: '}'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }],
        action: function (codeparts) {
            return codeparts;
        }
    };

    define.peg$Parameter = {
        type: SEQUENCE,
        debug: 'Parameter',
        children: [
            {
                type: DEFINITION,
                param: 'param',
                defn: 'Identifier'
            }, {
                type: LITERAL,
                value: ':'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }],
        action: function (param) {
            return param.trim();
        }
    };

    define.peg$Primary = {
        type: OR,
        debug: 'Primary',
        error: 'expected identifier, (...), \'...\', "...", [...] or .',
        children: [
            {
                type: SEQUENCE,
                children: [
                    {
                        type: DEFINITION,
                        param: 'identifier',
                        defn: 'Identifier'
                    }, {
                        type: NOT,
                        child: {
                            type: DEFINITION,
                            defn: 'LEFTARROW'
                        }
                    }],
                action: function (identifier) {
                    return {
                        type: DEFINITION,
                        defn: identifier.trim()
                    };
                }
            }, {
                type: SEQUENCE,
                children: [
                    {
                        type: DEFINITION,
                        defn: 'OPEN'
                    }, {
                        type: DEFINITION,
                        param: 'expression',
                        defn: 'Expression'
                    }, {
                        type: DEFINITION,
                        defn: 'CLOSE'
                    }],
                action: function (expression) {
                    return expression;
                }
            }, {
                type: DEFINITION,
                defn: 'Literal'
            }, {
                type: DEFINITION,
                defn: 'Class'
            }, {
                type: DEFINITION,
                defn: 'DOT'
            }]
    };

    define.peg$Suffix = {
        type: SEQUENCE,
        debug: 'Suffix',
        children: [
            {
                type: DEFINITION,
                param: 'part',
                defn: 'Primary'
            }, {
                type: OPTION,
                param: 'option',
                child: {
                    type: OR,
                    children: [
                        {
                            type: DEFINITION,
                            defn: 'QUESTION'
                        }, {
                            type: DEFINITION,
                            defn: 'STAR'
                        }, {
                            type: DEFINITION,
                            defn: 'PLUS'
                        }]
                }
            }],
        action: function (part, option) {
            if (option)
                return {
                    type: stringToType(option),
                    child: part
                };
            else
                return part;
        }
    };

    define.peg$Prefix = {
        type: SEQUENCE,
        debug: 'Prefix',
        children: [
            {
                type: OPTION,
                param: 'option',
                child: {
                    type: OR,
                    children: [
                        {
                            type: DEFINITION,
                            defn: 'AND'
                        }, {
                            type: DEFINITION,
                            defn: 'NOT'
                        }]
                }
            }, {
                type: DEFINITION,
                param: 'part',
                defn: 'Suffix'
            }],
        action: function (option, part) {
            if (option)
                return {
                    type: stringToType(option),
                    child: part
                };
            else
                return part;
        }
    };

    define.peg$Sequence = {
        type: SEQUENCE,
        debug: 'Sequence',
        children: [
            {
                type: ZERO_OR_MORE,
                param: 'children',
                child: {
                    type: SEQUENCE,
                    children: [
                        {
                            type: OPTION,
                            param: 'param',
                            child: {
                                type: DEFINITION,
                                defn: 'Parameter'
                            }
                        }, {
                            type: DEFINITION,
                            param: 'expression',
                            defn: 'Prefix'
                        }],
                    action: function (param, expression) {
                        if (param)
                            expression.param = param;

                        return expression;
                    }
                }
            }, {
                type: OPTION,
                param: 'action',
                child: {
                    type: DEFINITION,
                    defn: 'CodeBlock'
                }
            }],
        action: function (children, action) {
            if (typeof children === 'undefined' || children.length === 0)
                return undefined;

            var definition;
            if (children.length === 1)
                definition = children[0];
            else
                definition = {
                    type: SEQUENCE,
                    children: children
                };

            var trimmedAction = action ? action.trim() : '';
            if (trimmedAction)
                definition.action = trimmedAction;

            return definition;
        }
    };

    define.peg$Expression = {
        type: SEQUENCE,
        debug: 'Expression',
        children: [
            {
                type: DEFINITION,
                param: 'first',
                defn: 'Sequence'
            }, {
                type: ZERO_OR_MORE,
                param: 'rest',
                child: {
                    type: SEQUENCE,
                    // param: 'parts',
                    children: [
                        {
                            type: DEFINITION,
                            defn: 'SLASH'
                        }, {
                            type: DEFINITION,
                            param: 'part',
                            defn: 'Sequence'
                        }],
                    action: function (part) {
                        return part;
                    }
                }
            }],
        action: function (first, rest) {
            if (first && !rest)
                return first;
            else if (first && rest)
                return {
                    type: OR,
                    children: [].concat.apply(first, rest)
                };
        }
    };

    define.peg$Definition = {
        type: SEQUENCE,
        debug: 'Definition',
        children: [
            {
                type: DEFINITION,
                param: 'identifier',
                defn: 'Identifier'
            }, {
                type: DEFINITION,
                defn: 'LEFTARROW'
            }, {
                type: DEFINITION,
                param: 'definition',
                defn: 'Expression'
            }],
        action: function (identifier, definition) {
            definition.debug = identifier;

            outDefine[identifier] = definition;
            return definition;
        }
    };

    define.peg$Prologue = {
        type: SEQUENCE,
        debug: 'Prologue',
        children: [
            {
                type: DEFINITION,
                defn: 'CodeBlock'
            }, {
                type: DEFINITION,
                defn: 'Spacing'
            }]
    };

    define.peg$Grammar = {
        type: SEQUENCE,
        debug: 'Grammar',
        children: [
            {
                type: DEFINITION,
                defn: 'Spacing'
            }, {
                type: OPTION,
                param: 'prologue',
                child: {
                    type: DEFINITION,
                    defn: 'CodeBlock'
                }
            }, {
                type: ATLEAST_ONE,
                child: {
                    type: DEFINITION,
                    defn: 'Definition'
                }
            }, {
                type: OPTION,
                param: 'epilogue',
                child: {
                    type: DEFINITION,
                    defn: 'CodeBlock'
                }
            }, {
                type: DEFINITION,
                defn: 'EndOfFile'
            }],
        action: function (prologue, epilogue) {
            return {
                prologue: prologue,
                definitions: outDefine,
                epilogue: epilogue
            };
        }
    };

    var best = 0, bestError = '', options = {
        verbose: false
    };

    function applyParams(definition, params, results) {
        if (typeof definition.action === 'function') {
            return definition.action.apply(this, params);
        } else {
            var isStringArray = Array.isArray(results);
            for (var i = 0; isStringArray && i < results.length; ++i)
                isStringArray = typeof results[i] === 'string';

            return isStringArray ? results.join('') : results;
        }
    }

    function parse(str, i, definition) {
        var debugStr = str.substr(i, 20);

        if (!definition)
            debugger;

        if (!('type' in definition))
            debugger;

        if (options.verbose)
            console.log(definition.debug);

        if (definition.breakpoint)
            debugger;

        var info;

        switch (definition.type) {
            case DEFINITION:
                var childDefinition = define['peg$' + definition.defn];
                info = parse(str, i, childDefinition);
                break;

            case SEQUENCE:
                var j = i;
                var result, params = [];

                for (var k = 0; k < definition.children.length; ++k) {
                    var childDefinition = definition.children[k];
                    var childInfo = parse(str, j, childDefinition);

                    if (!childInfo)
                        break;

                    // always push params, even when undefined, as order must be maintained
                    if (childDefinition.param)
                        params.push(childInfo.result);

                    j = childInfo.end;
                    if (childInfo.result) {
                        if (!result)
                            result = [];

                        result.push(childInfo.result);
                    }
                }

                if (k === definition.children.length)
                    info = {
                        start: i,
                        end: j,
                        result: applyParams(definition, params, result)
                    };
                break;

            case OR:
                for (var k = 0; k < definition.children.length; ++k) {
                    var childInfo = parse(str, i, definition.children[k]);
                    if (childInfo) {
                        info = childInfo;
                        break;
                    }
                }
                break;

            case TEST:
                var childInfo = parse(str, i, definition.child);

                if (childInfo)
                    info = {
                        start: i,
                        end: i,
                        result: childInfo.result
                    };
                break;

            case OPTION:
                var childInfo = parse(str, i, definition.child);

                if (!childInfo)
                    info = {
                        start: i,
                        end: i
                    };
                else
                    info = childInfo;
                break;

            case ATLEAST_ONE:
            case ZERO_OR_MORE:
                var k = i, result, params = [], childDefinition = definition.child;

                do {
                    childInfo = parse(str, k, childDefinition);

                    if (childInfo) {
                        k = childInfo.end;
                        if (!result)
                            result = [];

                        result.push(childInfo.result);
                    }
                } while(childInfo);

                // each element in the params array represents a parameter, in this case there is
                // only ever one parameter
                if (childDefinition.param)
                    params = [result];

                if (k !== i || definition.type !== ATLEAST_ONE)
                    info = {
                        start: i,
                        end: k,
                        result: applyParams(definition, params, result)
                    };
                break;

            case NOT:
                var childInfo = parse(str, i, definition.child);
                if (!childInfo)
                    info = {
                        start: i,
                        end: i
                    };
                break;

            case LITERAL:
                var length = definition.value.length, literal = str.substr(i, length);

                if (definition.value === literal)
                    info = {
                        start: i,
                        end: i + length,
                        result: literal
                    };
                break;

            case SET:
                var c = str[i];
                if (c && definition.chars.indexOf(c) !== -1)
                    info = {
                        start: i,
                        end: i + 1,
                        result: c
                    };
                break;

            case ANY_CHAR:
                var c = str[i];
                if (c)
                    info = {
                        start: i,
                        end: i + 1,
                        result: c
                    };
                break;

            default:
                info = "error - unknown definition - " + definition;
        }

        if (info) {
            if (info.end > best) {
                bestError = '';
                best = info.end;
            }
        } else if (!bestError && definition.error) {
            bestError = definition.error;
        }

        return info;
    }

    var tab = '    ';

    function resultsToCode(results) {
        var code = 'function peg() {\n';

        if (results.prologue)
            code += results.prologue;

        for (var k in results.definitions) {
            code += tab + 'define.peg$' + k + ' = ';
            code += structToCode(results.definitions[k], tab) + '\n\n';
        }

        if (results.epilogue)
            code += results.epilogue;

        code += '}';

        return code;
    }

    // outputs a string of formatted code
    function structToCode(definition, prefix) {
        if (typeof prefix === "undefined") { prefix = ''; }
        var code = '{', prefixTab = prefix + tab;

        var i = 0;
        for (var key in definition) {
            if (!definition[key])
                continue;

            // var trimmedAction = '';
            // if (key === 'action') {
            //     // removed trailing spaces, and the surrounding {}
            //     trimmedAction = definition.action.trim();
            //     trimmedAction = trimmedAction.substr(1, trimmedAction.length - 2).trim();
            //     if (trimmedAction === '')
            //         continue; // nothing in the action, ignore
            // }
            code += (i++ === 0) ? '\n' : ',\n';

            switch (key) {
                case 'children':
                    code += prefixTab + 'children: [';

                    for (var i = 0; i < definition.children.length; ++i) {
                        if (i > 0)
                            code += ', ';

                        code += structToCode(definition.children[i], prefixTab);
                    }
                    code += ']';
                    break;

                case 'child':
                    code += prefixTab + 'child: ' + structToCode(definition.child, prefixTab);
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
                    code += definition.action.replace(/^.*$/gm, function (match) {
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

    var initial = define.peg$Grammar;

    var info = parse(str, 0, initial);
    if (!info) {
        console.log('Error at - ' + str.substr(0, best));
        console.log(bestError);
        debugger;
    } else {
        console.log(resultsToCode(info.result));
    }
}
