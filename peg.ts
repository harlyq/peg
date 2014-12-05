declare
var module: any;

(function(window) {
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

    var outDefine: any = {};

    var tab = '    ';

    var stringToType = function(str) {
        var i = '*+/?&!'.indexOf(str.trim());
        if (i !== -1)
            return ['zero or more', 'at least one', 'or', 'option', 'test', 'not'][i];

        debugger; // unknown type
        return UNKNOWN;
    }

    function resultsToCode(results) {
        var code = '(function(window) {\n';

        var name = results.name;

        code += tab + 'var define = {};\n\n';

        if (results.prologue)
            code += results.prologue;

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

        code += '})(window);\n';

        return code;
    }

    // outputs a string of formatted code
    function structToCode(name, definition, prefix = '') {
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
                        return prefixTab + tab + match
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

    var define: any = {};

    define.peg$Grammar = {
        type: SEQUENCE,
        debug: 'Grammar',
        children: [{
            type: DEFINITION,
            defn: 'peg$Spacing'
        }, {
            type: OPTION,
            param: 'prologue',
            child: {
                type: DEFINITION,
                defn: 'peg$CodeBlock'
            }
        }, {
            type: ATLEAST_ONE,
            child: {
                type: DEFINITION,
                defn: 'peg$Definition'
            }
        }, {
            type: OPTION,
            param: 'epilogue',
            child: {
                type: DEFINITION,
                defn: 'peg$CodeBlock'
            }
        }, {
            type: DEFINITION,
            defn: 'peg$EndOfFile'
        }],
        action: function(prologue, epilogue) {
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
    };

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
                defn: 'peg$EndOfLine'
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
                        defn: 'peg$EndOfLine'
                    }
                }, {
                    type: ANY_CHAR
                }]
            }
        }, {
            type: DEFINITION,
            defn: 'peg$EndOfLine'
        }],
        action: function() {
            return ''; // remove all comments from the final output
        }
    };

    define.peg$Spacing = {
        type: ZERO_OR_MORE,
        debug: 'Spacing',
        child: {
            type: OR,
            children: [{
                type: DEFINITION,
                defn: 'peg$Space'
            }, {
                type: DEFINITION,
                defn: 'peg$Comment'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
            defn: 'peg$Spacing'
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
                defn: 'peg$Char'
            }, {
                type: LITERAL,
                value: '-'
            }, {
                type: DEFINITION,
                param: 'end',
                defn: 'peg$Char'
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
            defn: 'peg$Char'
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
                    defn: 'peg$Range'
                }]
            }
        }, {
            type: LITERAL,
            value: ']'
        }, {
            type: DEFINITION,
            defn: 'peg$Spacing'
        }],
        action: function(chars) {
            return {
                type: SET,
                chars: chars.replace(/"/g, "\\\"")
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
                        defn: 'peg$Char'
                    }]
                }
            }, {
                type: LITERAL,
                error: 'expected \'',
                value: '\''
            }, {
                type: DEFINITION,
                defn: 'peg$Spacing'
            }],
            action: function(chars) {
                return {
                    type: LITERAL,
                    value: chars.replace(/"/g, "\\\"")
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
                        defn: 'peg$Char'
                    }]
                }
            }, {
                type: LITERAL,
                error: 'expected \"',
                value: '"'
            }, {
                type: DEFINITION,
                defn: 'peg$Spacing'
            }],
            action: function(chars) {
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
        children: [{
            type: DEFINITION,
            defn: 'peg$IdentStart'
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
            defn: 'peg$IdentStart'
        }, {
            type: ZERO_OR_MORE,
            param: 'rest',
            child: {
                type: DEFINITION,
                defn: 'peg$IdentCont'
            }
        }, {
            type: DEFINITION,
            defn: 'peg$Spacing'
        }],
        action: function(first, rest) {
            if (rest)
                return first + rest;
            else
                return first;
        }
    };

    define.peg$NestedCodeBlock = {
        type: SEQUENCE,
        debug: 'CodeBlock',
        children: [{
            type: LITERAL,
            value: '{'
        }, {
            type: ZERO_OR_MORE,
            param: 'codeparts',
            child: {
                type: OR,
                children: [{
                    type: DEFINITION,
                    defn: 'peg$NestedCodeBlock'
                }, {
                    type: SEQUENCE,
                    children: [{
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
            defn: 'peg$Spacing'
        }]
    }

    define.peg$CodeBlock = {
        type: SEQUENCE,
        debug: 'CodeBlock',
        children: [{
            type: LITERAL,
            value: '{'
        }, {
            type: ZERO_OR_MORE,
            param: 'codeparts',
            child: {
                type: OR,
                children: [{
                    type: DEFINITION,
                    defn: 'peg$NestedCodeBlock'
                }, {
                    type: SEQUENCE,
                    children: [{
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
            defn: 'peg$Spacing'
        }],
        action: function(codeparts) {
            return codeparts;
        }
    }

    define.peg$Parameter = {
        type: SEQUENCE,
        debug: 'Parameter',
        children: [{
            type: DEFINITION,
            param: 'param',
            defn: 'peg$Identifier'
        }, {
            type: LITERAL,
            value: ':'
        }, {
            type: DEFINITION,
            defn: 'peg$Spacing'
        }],
        action: function(param) {
            return param.trim();
        }
    };

    define.peg$Primary = {
        type: OR,
        debug: 'Primary',
        error: 'expected identifier, (...), \'...\', "...", [...] or .',
        children: [{
            type: SEQUENCE,
            children: [{
                type: DEFINITION,
                param: 'identifier',
                defn: 'peg$Identifier'
            }, {
                type: NOT,
                child: {
                    type: DEFINITION,
                    defn: 'peg$LEFTARROW'
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
                defn: 'peg$OPEN'
            }, {
                type: DEFINITION,
                param: 'expression',
                defn: 'peg$Expression'
            }, {
                type: DEFINITION,
                defn: 'peg$CLOSE'
            }],
            action: function(expression) {
                return expression;
            }
        }, {
            type: DEFINITION,
            defn: 'peg$Literal'
        }, {
            type: DEFINITION,
            defn: 'peg$Class'
        }, {
            type: DEFINITION,
            defn: 'peg$DOT'
        }]
    };

    define.peg$Suffix = {
        type: SEQUENCE,
        debug: 'Suffix',
        children: [{
            type: DEFINITION,
            param: 'part',
            defn: 'peg$Primary'
        }, {
            type: OPTION,
            param: 'option',
            child: {
                type: OR,
                children: [{
                    type: DEFINITION,
                    defn: 'peg$QUESTION'
                }, {
                    type: DEFINITION,
                    defn: 'peg$STAR'
                }, {
                    type: DEFINITION,
                    defn: 'peg$PLUS'
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
                    defn: 'peg$AND'
                }, {
                    type: DEFINITION,
                    defn: 'peg$NOT'
                }]
            }
        }, {
            type: DEFINITION,
            param: 'part',
            defn: 'peg$Suffix'
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
                        defn: 'peg$Parameter'
                    }
                }, {
                    type: DEFINITION,
                    param: 'expression',
                    defn: 'peg$Prefix'
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
                defn: 'peg$CodeBlock'
            }
        }],
        action: function(children, action) {
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

            var trimmedAction = action ? action.trim() : '';
            if (trimmedAction)
                definition.action = trimmedAction;

            return definition;
        }
    };

    define.peg$Expression = {
        type: SEQUENCE,
        debug: 'Expression',
        children: [{
            type: DEFINITION,
            param: 'first',
            defn: 'peg$Sequence'
        }, {
            type: ZERO_OR_MORE,
            param: 'rest',
            child: {
                type: SEQUENCE,
                // param: 'parts',
                children: [{
                    type: DEFINITION,
                    defn: 'peg$SLASH'
                }, {
                    type: DEFINITION,
                    param: 'part',
                    defn: 'peg$Sequence'
                }],
                action: function(part) {
                    return part;
                }
            },
        }],
        action: function(first, rest) {
            if (first && !rest)
                return first;
            else if (first && rest)
                return {
                    type: OR,
                    children: [].concat.apply(first, rest)
                };
        }
    }

    define.peg$Definition = {
        type: SEQUENCE,
        debug: 'Definition',
        children: [{
            type: DEFINITION,
            param: 'identifier',
            defn: 'peg$Identifier'
        }, {
            type: DEFINITION,
            defn: 'peg$LEFTARROW'
        }, {
            type: DEFINITION,
            param: 'definition',
            defn: 'peg$Expression'
        }],
        action: function(identifier, definition) {
            definition.debug = identifier;

            outDefine[identifier] = definition;
            return definition;
        }
    };

    define.peg$Prologue = {
        type: SEQUENCE,
        debug: 'Prologue',
        children: [{
            type: DEFINITION,
            defn: 'peg$CodeBlock'
        }, {
            type: DEFINITION,
            defn: 'peg$Spacing'
        }]
    }

    // called at the beginning of every PEGParser.parse()
    define.parse = function() {
        outDefine = {};
    }

    if (typeof module !== 'undefined') {
        module.exports = define; // commonjs
    } else {
        window.peg = {};
        window.peg.define = define; // html <script>
    }
})(window);
