(function(window) {
    var define = {};


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
        var code = '(function(window) {\n';

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

        code += '})(window);\n';

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
    define.peg$peg = {
        type: "sequence",
        children: [{
            type: "definition",
            defn: "peg$Spacing"
        }, {
            type: "option",
            child: {
                type: "definition",
                defn: "peg$CodeBlock"
            },
            param: "prologue"
        }, {
            type: "at least one",
            child: {
                type: "definition",
                defn: "peg$Definition"
            },
            param: "definitions"
        }, {
            type: "option",
            child: {
                type: "definition",
                defn: "peg$CodeBlock"
            },
            param: "epilogue"
        }, {
            type: "definition",
            defn: "peg$EndOfFile"
        }],
        action: function(prologue, definitions, epilogue) {
            var names = Object.keys(outDefine);
            if (names.length === 0)
                return undefined; // no definitions

            return resultsToCode({
                name: names[0],
                prologue: prologue,
                definitions: outDefine,
                epilogue: epilogue
            });
        },
        debug: "peg"
    }

    define.peg$Definition = {
        type: "sequence",
        children: [{
            type: "definition",
            defn: "peg$Identifier",
            param: "identifier"
        }, {
            type: "definition",
            defn: "peg$LEFTARROW"
        }, {
            type: "definition",
            defn: "peg$Expression",
            param: "definition"
        }],
        action: function(identifier, definition) {
            definition.debug = identifier;

            outDefine[identifier] = definition;
            return definition;
        },
        debug: "Definition"
    }

    define.peg$Expression = {
        type: "sequence",
        children: [{
            type: "definition",
            defn: "peg$Sequence",
            param: "first"
        }, {
            type: "zero or more",
            child: {
                type: "sequence",
                children: [{
                    type: "definition",
                    defn: "peg$SLASH"
                }, {
                    type: "definition",
                    defn: "peg$Sequence",
                    param: "part"
                }],
                action: function(part) {
                    return part;
                }
            },
            param: "rest"
        }],
        action: function(first, rest) {
            if (first && !rest)
                return first;
            else if (first && rest)
                return {
                    type: 'or',
                    children: [].concat.apply(first, rest)
                };
        },
        debug: "Expression"
    }

    define.peg$Sequence = {
        type: "sequence",
        children: [{
            type: "zero or more",
            child: {
                type: "sequence",
                children: [{
                    type: "option",
                    child: {
                        type: "definition",
                        defn: "peg$Parameter"
                    },
                    param: "param"
                }, {
                    type: "definition",
                    defn: "peg$Prefix",
                    param: "expression"
                }],
                action: function(param, expression) {
                    if (param) expression.param = param;
                    return expression;
                }
            },
            param: "children"
        }, {
            type: "option",
            child: {
                type: "definition",
                defn: "peg$CodeBlock"
            },
            param: "action"
        }],
        action: function(children, action) {
            if (typeof children === 'undefined' || children.length === 0)
                return undefined;

            var definition;
            if (children.length === 1)
                definition = children[0];
            else
                definition = {
                    type: 'SEQUENCE',
                    children: children
                };

            var trimmedAction = action ? action.trim() : '';
            if (trimmedAction)
                definition.action = trimmedAction;

            return definition;
        },
        debug: "Sequence"
    }

    define.peg$Prefix = {
        type: "sequence",
        children: [{
            type: "option",
            child: {
                type: "or",
                children: [{
                    type: "definition",
                    defn: "peg$AND"
                }, {
                    type: "definition",
                    defn: "peg$NOT"
                }]
            },
            param: "option"
        }, {
            type: "definition",
            defn: "peg$Suffix",
            param: "part"
        }],
        action: function(option, part) {
            if (option)
                return {
                    type: stringToType(option),
                    child: part
                };
            else
                return part;
        },
        debug: "Prefix"
    }

    define.peg$Suffix = {
        type: "sequence",
        children: [{
            type: "definition",
            defn: "peg$Primary",
            param: "part"
        }, {
            type: "option",
            child: {
                type: "or",
                children: [{
                    type: "definition",
                    defn: "peg$QUESTION"
                }, {
                    type: "definition",
                    defn: "peg$STAR"
                }, {
                    type: "definition",
                    defn: "peg$PLUS"
                }]
            },
            param: "option"
        }],
        action: function(part, option) {
            if (option)
                return {
                    type: stringToType(option),
                    child: part
                };
            else
                return part;
        },
        debug: "Suffix"
    }

    define.peg$Primary = {
        type: "or",
        children: [{
            type: "sequence",
            children: [{
                type: "definition",
                defn: "peg$Identifier",
                param: "identifier"
            }, {
                type: "not",
                child: {
                    type: "definition",
                    defn: "peg$LEFTARROW"
                }
            }],
            action: function(identifier) {
                return {
                    type: 'definition',
                    defn: identifier.trim()
                };
            }
        }, {
            type: "sequence",
            children: [{
                type: "definition",
                defn: "peg$OPEN"
            }, {
                type: "definition",
                defn: "peg$Expression",
                param: "expression"
            }, {
                type: "definition",
                defn: "peg$CLOSE"
            }],
            action: function(expression) {
                return expression;
            }
        }, {
            type: "definition",
            defn: "peg$Literal"
        }, {
            type: "definition",
            defn: "peg$Class"
        }, {
            type: "definition",
            defn: "peg$DOT"
        }],
        debug: "Primary"
    }

    define.peg$Parameter = {
        type: "sequence",
        children: [{
            type: "definition",
            defn: "peg$Identifier",
            param: "param"
        }, {
            type: "literal",
            value: ":"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        action: function(param) {
            return param.trim();
        },
        debug: "Parameter"
    }

    define.peg$CodeBlock = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "{"
        }, {
            type: "zero or more",
            child: {
                type: "or",
                children: [{
                    type: "definition",
                    defn: "peg$NestedCodeBlock"
                }, {
                    type: "sequence",
                    children: [{
                        type: "not",
                        child: {
                            type: "set",
                            chars: "}"
                        }
                    }, {
                        type: "any char"
                    }]
                }]
            },
            param: "codeparts"
        }, {
            type: "literal",
            value: "}"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        action: function(codeparts) {
            return codeparts;
        },
        debug: "CodeBlock"
    }

    define.peg$NestedCodeBlock = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "{"
        }, {
            type: "zero or more",
            child: {
                type: "or",
                children: [{
                    type: "definition",
                    defn: "peg$NestedCodeBlock"
                }, {
                    type: "sequence",
                    children: [{
                        type: "not",
                        child: {
                            type: "set",
                            chars: "}"
                        }
                    }, {
                        type: "any char"
                    }]
                }]
            }
        }, {
            type: "literal",
            value: "}"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "NestedCodeBlock"
    }

    define.peg$Identifier = {
        type: "sequence",
        children: [{
            type: "definition",
            defn: "peg$IdentStart",
            param: "first"
        }, {
            type: "zero or more",
            child: {
                type: "definition",
                defn: "peg$IdentCont"
            },
            param: "rest"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        action: function(first, rest) {
            if (rest)
                return first + rest;
            else
                return first;
        },
        debug: "Identifier"
    }

    define.peg$IdentStart = {
        type: "set",
        chars: "abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXY_",
        debug: "IdentStart"
    }

    define.peg$IdentCont = {
        type: "or",
        children: [{
            type: "definition",
            defn: "peg$IdentStart"
        }, {
            type: "set",
            chars: "012345678"
        }],
        debug: "IdentCont"
    }

    define.peg$Literal = {
        type: "or",
        children: [{
            type: "sequence",
            children: [{
                type: "set",
                chars: "'"
            }, {
                type: "zero or more",
                child: {
                    type: "sequence",
                    children: [{
                        type: "not",
                        child: {
                            type: "set",
                            chars: "'"
                        }
                    }, {
                        type: "definition",
                        defn: "peg$Char"
                    }]
                },
                param: "chars"
            }, {
                type: "set",
                chars: "'"
            }, {
                type: "definition",
                defn: "peg$Spacing"
            }],
            action: function(chars) {
                return {
                    type: 'literal',
                    value: chars.replace(/"/g, "\\\"")
                };
            }
        }, {
            type: "sequence",
            children: [{
                type: "set",
                chars: "\""
            }, {
                type: "zero or more",
                child: {
                    type: "sequence",
                    children: [{
                        type: "not",
                        child: {
                            type: "set",
                            chars: "\""
                        }
                    }, {
                        type: "definition",
                        defn: "peg$Char"
                    }]
                },
                param: "chars"
            }, {
                type: "set",
                chars: "\""
            }, {
                type: "definition",
                defn: "peg$Spacing"
            }],
            action: function(chars) {
                return {
                    type: 'set',
                    value: chars.replace(/"/g, "\\\"")
                };
            }
        }],
        debug: "Literal"
    }

    define.peg$Class = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "["
        }, {
            type: "zero or more",
            child: {
                type: "sequence",
                children: [{
                    type: "not",
                    child: {
                        type: "literal",
                        value: "]"
                    }
                }, {
                    type: "definition",
                    defn: "peg$Range"
                }]
            },
            param: "chars"
        }, {
            type: "literal",
            value: "]"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        action: function(chars) {
            return {
                type: 'set',
                chars: chars.replace(/"/g, "\\\"")
            };
        },
        debug: "Class"
    }

    define.peg$Range = {
        type: "or",
        children: [{
            type: "sequence",
            children: [{
                type: "definition",
                defn: "peg$Char",
                param: "a"
            }, {
                type: "literal",
                value: "-"
            }, {
                type: "definition",
                defn: "peg$Char",
                param: "b"
            }],
            action: function(a, b) {
                var str = '';
                for (var i = a.charCodeAt(0); i < b.charCodeAt(0); ++i)
                    str += String.fromCharCode(i);
                return str;
            }
        }, {
            type: "definition",
            defn: "peg$Char"
        }],
        debug: "Range"
    }

    define.peg$Char = {
        type: "or",
        children: [{
            type: "sequence",
            children: [{
                type: "literal",
                value: "\\"
            }, {
                type: "set",
                chars: "nrt'\"\[\]\\"
            }]
        }, {
            type: "sequence",
            children: [{
                type: "literal",
                value: "\\"
            }, {
                type: "set",
                chars: "01"
            }, {
                type: "set",
                chars: "0123456"
            }, {
                type: "set",
                chars: "0123456"
            }]
        }, {
            type: "sequence",
            children: [{
                type: "literal",
                value: "\\"
            }, {
                type: "set",
                chars: "0123456"
            }, {
                type: "option",
                child: {
                    type: "set",
                    chars: "0123456"
                }
            }]
        }, {
            type: "sequence",
            children: [{
                type: "not",
                child: {
                    type: "literal",
                    value: "\\"
                }
            }, {
                type: "any char"
            }]
        }],
        debug: "Char"
    }

    define.peg$LEFTARROW = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "<-"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "LEFTARROW"
    }

    define.peg$SLASH = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "/"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "SLASH"
    }

    define.peg$AND = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "&"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "AND"
    }

    define.peg$NOT = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "!"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "NOT"
    }

    define.peg$QUESTION = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "?"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "QUESTION"
    }

    define.peg$STAR = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "*"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "STAR"
    }

    define.peg$PLUS = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "+"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "PLUS"
    }

    define.peg$OPEN = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "("
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "OPEN"
    }

    define.peg$CLOSE = {
        type: "sequence",
        children: [{
            type: "literal",
            value: ")"
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        debug: "CLOSE"
    }

    define.peg$DOT = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "."
        }, {
            type: "definition",
            defn: "peg$Spacing"
        }],
        action: function() {
            return {
                type: 'any char'
            };
        },
        debug: "DOT"
    }

    define.peg$Spacing = {
        type: "zero or more",
        child: {
            type: "or",
            children: [{
                type: "definition",
                defn: "peg$Space"
            }, {
                type: "definition",
                defn: "peg$Comment"
            }]
        },
        debug: "Spacing"
    }

    define.peg$Comment = {
        type: "sequence",
        children: [{
            type: "literal",
            value: "#"
        }, {
            type: "zero or more",
            child: {
                type: "sequence",
                children: [{
                    type: "not",
                    child: {
                        type: "definition",
                        defn: "peg$EndOfLine"
                    }
                }, {
                    type: "any char"
                }]
            }
        }, {
            type: "definition",
            defn: "peg$EndOfLine"
        }],
        action: function() {
            return ''; // no comments in output
        },
        debug: "Comment"
    }

    define.peg$Space = {
        type: "or",
        children: [{
            type: "literal",
            value: " "
        }, {
            type: "literal",
            value: "\t"
        }, {
            type: "definition",
            defn: "peg$EndOfLine"
        }],
        debug: "Space"
    }

    define.peg$EndOfLine = {
        type: "or",
        children: [{
            type: "literal",
            value: "\r\n"
        }, {
            type: "literal",
            value: "\n"
        }, {
            type: "literal",
            value: "\r"
        }],
        debug: "EndOfLine"
    }

    define.peg$EndOfFile = {
        type: "not",
        child: {
            type: "any char"
        },
        debug: "EndOfFile"
    }


    if (typeof module !== 'undefined') {
        module.exports = define; // commonjs
    } else {
        window.peg = {}; // html <script>
        window.peg.define = define;
    }
})(window);
