var options = {
    verbose: false,
    useCache: false
};


function peg(str) {
    if (typeof str !== 'string')
        return 'error: input parameter is not a string - ' + str;

    if (str.length === 0)
        return 'error: input string is empty';

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
        switch (str.trim()) {
            case '*':
                return ZERO_OR_MORE;
            case '+':
                return ATLEAST_ONE;
            case '/':
                return OR;
            case '?':
                return OPTION;
            case '&':
                return TEST;
            case '!':
                return NOT;
        }
        debugger; // unknown type;
        return UNKNOWN;
    }

    var define: any = {};

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
            children: [{
                type: SEQUENCE,
                children: [{
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
            children: [{
                type: LITERAL,
                value: ' '
            }, {
                type: LITERAL,
                value: '\t'
            }, {
                type: DEFINITION,
                defn: define.peg$EndOfLine
            }]
        }]
    };

    define.peg$Comment = {
        type: SEQUENCE,
        debug: 'Comment',
        children: [{
            type: LITERAL,
            value: '#'
        }, {
            type: ZERO_OR_MORE,
            child: {
                type: SEQUENCE,
                children: [{
                    type: NOT,
                    child: {
                        type: DEFINITION,
                        defn: define.peg$EndOfLine
                    }
                }, {
                    type: ANY_CHAR
                }]
            }
        }, {
            type: DEFINITION,
            defn: define.peg$EndOfLine
        }]
    };

    define.peg$Spacing = {
        type: ZERO_OR_MORE,
        debug: 'Spacing',
        child: {
            type: OR,
            children: [{
                type: DEFINITION,
                defn: define.peg$Space
            }, {
                type: DEFINITION,
                defn: define.peg$Comment
            }]
        }
    };

    define.peg$DOT = {
        type: SEQUENCE,
        debug: 'DOT',
        children: [{
            type: LITERAL,
            value: '.'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }],
        action: function() {
            return {
                type: ANY_CHAR
            };
        }
    };

    define.peg$CLOSE = {
        type: SEQUENCE,
        debug: 'CLOSE',
        children: [{
            type: LITERAL,
            error: 'expected )',
            value: ')'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$OPEN = {
        type: SEQUENCE,
        debug: 'OPEN',
        children: [{
            type: LITERAL,
            error: 'expected (',
            value: '('
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$PLUS = {
        type: SEQUENCE,
        debug: 'SEQUENCE',
        children: [{
            type: LITERAL,
            value: '+'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$STAR = {
        type: SEQUENCE,
        debug: 'STAR',
        children: [{
            type: LITERAL,
            value: '*'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$QUESTION = {
        type: SEQUENCE,
        debug: 'QUESTION',
        children: [{
            type: LITERAL,
            value: '?'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$NOT = {
        type: SEQUENCE,
        debug: 'NOT',
        children: [{
            type: LITERAL,
            value: '!'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$AND = {
        type: SEQUENCE,
        debug: 'AND',
        children: [{
            type: LITERAL,
            value: '&'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$SLASH = {
        type: SEQUENCE,
        debug: 'SLASH',
        children: [{
            type: LITERAL,
            error: 'expected /',
            value: '/'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$LEFTARROW = {
        type: SEQUENCE,
        debug: 'LEFTARROW',
        children: [{
            type: LITERAL,
            error: 'expected <-',
            value: '<-'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }]
    };

    define.peg$Char = {
        type: OR,
        debug: 'Char',
        children: [{
            type: SEQUENCE,
            children: [{
                type: LITERAL,
                value: '\\'
            }, {
                type: SET,
                chars: 'nrt\'"[]\\'
            }]
        }, {
            type: SEQUENCE,
            children: [{
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
            children: [{
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
            children: [{
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
        children: [{
            type: SEQUENCE,
            children: [{
                type: DEFINITION,
                param: 'start',
                defn: define.peg$Char
            }, {
                type: LITERAL,
                value: '-'
            }, {
                type: DEFINITION,
                param: 'end',
                defn: define.peg$Char
            }],
            action: function(start, end) {
                // expand the range
                var str = '';
                for (var i = start.charCodeAt(0); i < end.charCodeAt(0); ++i)
                    str += String.fromCharCode(i);
                return str;
            }
        }, {
            type: DEFINITION,
            defn: define.peg$Char
        }]
    };

    define.peg$Class = {
        type: SEQUENCE,
        debug: 'Class',
        children: [{
            type: LITERAL,
            value: '['
        }, {
            type: ZERO_OR_MORE,
            param: 'chars',
            child: {
                type: SEQUENCE,
                children: [{
                    type: NOT,
                    child: {
                        type: LITERAL,
                        value: ']'
                    }
                }, {
                    type: DEFINITION,
                    defn: define.peg$Range
                }]
            }
        }, {
            type: LITERAL,
            value: ']'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }],
        action: function(chars) {
            return {
                type: SET,
                chars: chars.join('')
            };
        }
    };

    define.peg$Literal = {
        type: OR,
        debug: 'Literal',
        children: [{
            type: SEQUENCE,
            children: [{
                type: LITERAL,
                value: '\''
            }, {
                type: ZERO_OR_MORE,
                param: 'chars',
                child: {
                    type: SEQUENCE,
                    children: [{
                        type: NOT,
                        child: {
                            type: LITERAL,
                            value: '\''
                        }
                    }, {
                        type: DEFINITION,
                        defn: define.peg$Char
                    }]
                }
            }, {
                type: LITERAL,
                error: 'expected \'',
                value: '\''
            }, {
                type: DEFINITION,
                defn: define.peg$Spacing
            }],
            action: function(chars) {
                return {
                    type: LITERAL,
                    value: chars
                };
            }
        }, {
            type: SEQUENCE,
            children: [{
                type: LITERAL,
                value: '"'
            }, {
                type: ZERO_OR_MORE,
                param: 'chars',
                child: {
                    type: SEQUENCE,
                    children: [{
                        type: NOT,
                        child: {
                            type: LITERAL,
                            value: '"'
                        }
                    }, {
                        type: DEFINITION,
                        defn: define.peg$Char
                    }]
                }
            }, {
                type: LITERAL,
                error: 'expected \"',
                value: '"'
            }, {
                type: DEFINITION,
                defn: define.peg$Spacing
            }],
            action: function(chars) {
                return {
                    type: LITERAL,
                    value: "'" + chars + "'"
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
        children: [{
            type: DEFINITION,
            defn: define.peg$IdentStart
        }, {
            type: SET,
            chars: '0123456789'
        }]
    };

    define.peg$Identifier = {
        type: SEQUENCE,
        debug: 'Identifier',
        children: [{
            type: DEFINITION,
            param: 'first',
            defn: define.peg$IdentStart
        }, {
            type: ZERO_OR_MORE,
            param: 'rest',
            child: {
                type: DEFINITION,
                defn: define.peg$IdentCont
            }
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }],
        action: function(first, rest) {
            return first + rest;
        }
    };

    define.peg$CodeBlock = {};
    define.peg$CodeBlock.type = SEQUENCE;
    define.peg$CodeBlock.debug = 'CodeBlock';
    define.peg$CodeBlock.children = [{
            type: LITERAL,
            value: '{'
        }, {
            type: ZERO_OR_MORE,
            param: 'codeparts',
            child: {
                type: SEQUENCE,
                children: [{
                    type: NOT,
                    child: {
                        type: SET,
                        chars: '{}'
                    }
                }, {
                    type: ANY_CHAR
                }]
            }
        }, {
            type: ZERO_OR_MORE,
            param: 'nestedcode',
            child: {
                type: DEFINITION,
                defn: define.peg$CodeBlock
            }
        }
        /*, {
                type: ZERO_OR_MORE,
                param: 'codeparts',
                child: {
                    type: SEQUENCE,
                    children: [{
                        type: NOT,
                        child: {
                            type: SET,
                            chars: '{}'
                        }
                    }, {
                        type: ANY_CHAR
                    }]
                }
            }*/
        , {
            type: LITERAL,
            value: '}'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }
    ];
    define.peg$CodeBlock.action = function(codeparts, nestedcode) {
        if (!nestedcode)
            return codeparts;
        else
            return codeparts + nestedcode;
    }

    define.peg$Parameter = {
        type: SEQUENCE,
        debug: 'Parameter',
        children: [{
            type: DEFINITION,
            param: 'param',
            defn: define.peg$Identifier
        }, {
            type: LITERAL,
            value: ':'
        }, {
            type: DEFINITION,
            defn: define.peg$Spacing
        }],
        action: function(param) {
            return param.trim();
        }
    };

    define.peg$Expression = {}; // pre-declare

    define.peg$Primary = {
        type: OR,
        debug: 'Primary',
        error: 'expected identifier, (...), \'...\', "...", [...] or .',
        children: [{
            type: SEQUENCE,
            children: [{
                type: DEFINITION,
                param: 'identifier',
                defn: define.peg$Identifier
            }, {
                type: NOT,
                child: {
                    type: DEFINITION,
                    defn: define.peg$LEFTARROW
                }
            }],
            action: function(identifier) {
                return {
                    type: DEFINITION,
                    defn: identifier.trim()
                };
            }
        }, {
            type: SEQUENCE,
            children: [{
                type: DEFINITION,
                defn: define.peg$OPEN
            }, {
                type: DEFINITION,
                param: 'expression',
                defn: define.peg$Expression
            }, {
                type: DEFINITION,
                defn: define.peg$CLOSE
            }],
            action: function(expression) {
                return expression;
            }
        }, {
            type: DEFINITION,
            defn: define.peg$Literal
        }, {
            type: DEFINITION,
            defn: define.peg$Class
        }, {
            type: DEFINITION,
            defn: define.peg$DOT
        }]
    };

    define.peg$Suffix = {
        type: SEQUENCE,
        debug: 'Suffix',
        children: [{
            type: DEFINITION,
            param: 'part',
            defn: define.peg$Primary
        }, {
            type: OPTION,
            param: 'option',
            child: {
                type: OR,
                children: [{
                    type: DEFINITION,
                    defn: define.peg$QUESTION
                }, {
                    type: DEFINITION,
                    defn: define.peg$STAR
                }, {
                    type: DEFINITION,
                    defn: define.peg$PLUS
                }]
            }
        }],
        action: function(part, option) {
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
        children: [{
            type: OPTION,
            param: 'option',
            child: {
                type: OR,
                children: [{
                    type: DEFINITION,
                    defn: define.peg$AND
                }, {
                    type: DEFINITION,
                    defn: define.peg$NOT
                }]
            }
        }, {
            type: DEFINITION,
            param: 'part',
            defn: define.peg$Suffix
        }],
        action: function(option, part) {
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
        children: [{
            type: ZERO_OR_MORE,
            param: 'children',
            child: {
                type: SEQUENCE,
                children: [{
                    type: OPTION,
                    param: 'param',
                    child: {
                        type: DEFINITION,
                        defn: define.peg$Parameter
                    }
                }, {
                    type: DEFINITION,
                    param: 'expression',
                    defn: define.peg$Prefix
                }],
                action: function(param, expression) {
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
                defn: define.peg$CodeBlock
            }
        }],
        action: function(children, action) {
            // TODO params
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
    };

    define.peg$Expression.type = SEQUENCE;
    define.peg$Expression.debug = 'Expression';
    define.peg$Expression.children = [{
        type: DEFINITION,
        param: 'first',
        defn: define.peg$Sequence
    }, {
        type: ZERO_OR_MORE,
        param: 'rest',
        child: {
            type: SEQUENCE,
            param: 'parts',
            children: [{
                type: DEFINITION,
                defn: define.peg$SLASH
            }, {
                type: DEFINITION,
                param: 'part',
                defn: define.peg$Sequence
            }],
            action: function(part) {
                return part;
            }
        },
        action: function(parts) {
            if (typeof parts === 'undefined' || parts.length === 0)
                return undefined;
            else if (parts.length > 1)
                return {
                    type: OR,
                    children: parts
                };
            else if (parts.length == 1)
                return parts;
        }
    }];
    define.peg$Expression.action = function(first, rest) {
        if (first && !rest)
            return first;
        else if (first && rest)
            return {
                type: OR,
                children: [].concat.apply(first, rest)
            };
    }

    define.peg$Definition = {
        type: SEQUENCE,
        debug: 'Definition',
        children: [{
            type: DEFINITION,
            param: 'identifier',
            defn: define.peg$Identifier
        }, {
            type: DEFINITION,
            defn: define.peg$LEFTARROW
        }, {
            type: DEFINITION,
            param: 'definition',
            defn: define.peg$Expression
        }],
        action: function(identifier, definition) {
            definition.debug = identifier;

            //define[identifier] = definition;
            return definition;
        }
    };

    define.peg$Grammar = {
        type: SEQUENCE,
        debug: 'Grammar',
        children: [{
            type: DEFINITION,
            defn: define.peg$Spacing
        }, {
            type: ATLEAST_ONE,
            param: 'definitions',
            child: {
                type: DEFINITION,
                defn: define.peg$Definition
            }
        }, {
            type: DEFINITION,
            defn: define.peg$EndOfFile
        }],
        action: function(definitions) {
            return definitions;
        }
    };

    var best = 0,
        bestError = '',
        cache = []; // cache takes twice the time of non-cached

    // function parse(str, i, definition) {
    //     // if (options.useCache) {
    //     //     var cachedResults = cache[i];
    //     //     if (cachedResults) {
    //     //         for (var j = 0; j < cachedResults.length; ++j) {
    //     //             if (cachedResults[j].definition === definition)
    //     //                 return cachedResults[j].result;
    //     //         }
    //     //     }
    //     // }

    //     var info = parseInternal(str, i, definition);
    //     if (info) {
    //         if (info.end > best) {
    //             bestError = '';
    //             best = info.end;
    //         }
    //     } else if (!bestError && definition.error) {
    //         bestError = definition.error;
    //     }

    //     // if (options.useCache) {
    //     //     var entry = {
    //     //         definition: definition,
    //     //         result: result
    //     //     };

    //     //     if (!cache[i])
    //     //         cache[i] = [entry];
    //     //     else
    //     //         cache[i].push(entry);
    //     // }

    //     return info;
    // }

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
            debugger; // break

        var info;

        switch (definition.type) {
            case DEFINITION:
                info = parse(str, i, definition.defn);
                break;

            case SEQUENCE:
                var j = i;
                var result: any[],
                    params = [];

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
                var k: number = i,
                    result: any[],
                    params = [],
                    childDefinition = definition.child;

                do {
                    childInfo = parse(str, k, childDefinition);

                    if (childInfo) {
                        k = childInfo.end;
                        if (!result)
                            result = [];

                        result.push(childInfo.result);
                    }
                } while (childInfo);

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
                var length = definition.value.length,
                    literal = str.substr(i, length);

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

    var initial = define.peg$Grammar;

    var info = parse(str, 0, initial);
    if (!info) {
        console.log('Error at - ' + str.substr(0, best));
        console.log(bestError);
        debugger;
    } else {
        console.log('Success - ', definitionsToCode(info.result));
    }

    function definitionsToCode(definitions) {
        var code = '';
        for (var i = 0; i < definitions.length; ++i) {
            code += structToCode(definitions[i]) + '\n\n';
        }
        return code;
    }

    // outputs a string of formatted code
    function structToCode(definition, prefix = '') {
        var code = '{',
            tab = '    ',
            prefixTab = prefix + tab;

        var i = 0;
        for (var key in definition) {
            if (!definition[key])
                continue; // parameter should never be undefined

            code += (i++ === 0) ? '\n' : ',\n';

            switch (key) {
                case 'children':
                    code += prefixTab + 'children: [';

                    for (var i = 0; i < definition.children.length; ++i) {
                        if (i > 0)
                            code += ', ';

                        code += structToCode(definition.children[i], prefixTab);
                    }
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
                    code += definition.action.replace(/^.*$/g, function(match) {
                        return prefixTab + tab + match.trim() + '\n'
                    });
                    code += prefixTab + '}';
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
