function peg(str) {
    if (typeof str !== 'string')
        return 'error: input parameter is not a string - ' + str;

    if (str.length === 0)
        return 'error: input string is empty';

    // note: ranges are auto expanded in the set
    var DEFINITION = 1, SEQUENCE = 2, OR = 3, TEST = 4, OPTION = 5, ATLEAST_ONE = 6, ZERO_OR_MORE = 7, NOT = 8, LITERAL = 9, SET = 10, ANY_CHAR = 12;

    // var extend = function(base, other) {
    //     if (typeof other !== 'object')
    //         return other;
    //     for (var key in other) {
    //         var value = other[key];
    //         if (typeof value === 'object') {
    //             base[key] = Array.isArray(value) ? [] : {};
    //             extend(base[key], value);
    //         } else {
    //             base[key] = value;
    //         }
    //     }
    // }
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
                        defn: define.peg$EndOfLine
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
            children: [
                {
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
        children: [
            {
                type: LITERAL,
                value: '.'
            }, {
                type: DEFINITION,
                defn: define.peg$Spacing
            }]
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
                defn: define.peg$Spacing
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
                defn: define.peg$Spacing
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
                defn: define.peg$Spacing
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
                defn: define.peg$Spacing
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
                defn: define.peg$Spacing
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
                defn: define.peg$Spacing
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
                defn: define.peg$Spacing
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
                defn: define.peg$Spacing
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
                defn: define.peg$Spacing
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
                        defn: define.peg$Char
                    }, {
                        type: LITERAL,
                        value: '-'
                    }, {
                        type: DEFINITION,
                        defn: define.peg$Char
                    }]
            }, {
                type: DEFINITION,
                defn: define.peg$Char
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
                            defn: define.peg$Range
                        }]
                }
            }, {
                type: LITERAL,
                value: ']'
            }, {
                type: DEFINITION,
                defn: define.peg$Spacing
            }]
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
                    }]
            }, {
                type: SEQUENCE,
                children: [
                    {
                        type: LITERAL,
                        value: '"'
                    }, {
                        type: ZERO_OR_MORE,
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
                    }]
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
                defn: define.peg$IdentStart
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
                defn: define.peg$IdentStart
            }, {
                type: ZERO_OR_MORE,
                child: {
                    type: DEFINITION,
                    defn: define.peg$IdentCont
                }
            }, {
                type: DEFINITION,
                defn: define.peg$Spacing
            }]
    };

    define.peg$Expression = {}; // pre-declare

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
                        defn: define.peg$Identifier
                    }, {
                        type: NOT,
                        child: {
                            type: DEFINITION,
                            defn: define.peg$LEFTARROW
                        }
                    }]
            }, {
                type: SEQUENCE,
                children: [
                    {
                        type: DEFINITION,
                        defn: define.peg$OPEN
                    }, {
                        type: DEFINITION,
                        defn: define.peg$Expression
                    }, {
                        type: DEFINITION,
                        defn: define.peg$CLOSE
                    }]
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
        children: [
            {
                type: DEFINITION,
                defn: define.peg$Primary
            }, {
                type: OPTION,
                child: {
                    type: OR,
                    children: [
                        {
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
            }]
    };

    define.peg$Prefix = {
        type: SEQUENCE,
        debug: 'Prefix',
        children: [
            {
                type: OPTION,
                child: {
                    type: OR,
                    children: [
                        {
                            type: DEFINITION,
                            defn: define.peg$AND
                        }, {
                            type: DEFINITION,
                            defn: define.peg$NOT
                        }]
                }
            }, {
                type: DEFINITION,
                defn: define.peg$Suffix
            }]
    };

    define.peg$Sequence = {
        type: ZERO_OR_MORE,
        debug: 'Sequence',
        child: {
            type: DEFINITION,
            defn: define.peg$Prefix
        }
    };

    define.peg$Expression.type = SEQUENCE;
    define.peg$Expression.debug = 'Expression';
    define.peg$Expression.children = [
        {
            type: DEFINITION,
            defn: define.peg$Sequence
        }, {
            type: ZERO_OR_MORE,
            child: {
                type: SEQUENCE,
                children: [
                    {
                        type: DEFINITION,
                        defn: define.peg$SLASH
                    }, {
                        type: DEFINITION,
                        defn: define.peg$Sequence
                    }]
            }
        }];

    define.peg$Definition = {
        type: SEQUENCE,
        debug: 'Definition',
        children: [
            {
                type: DEFINITION,
                ref: 'identifier',
                defn: define.peg$Identifier
            }, {
                type: DEFINITION,
                defn: define.peg$LEFTARROW
            }, {
                type: DEFINITION,
                defn: define.peg$Expression
            }]
    };

    define.peg$Grammar = {
        type: SEQUENCE,
        debug: 'Grammar',
        children: [
            {
                type: DEFINITION,
                defn: define.peg$Spacing
            }, {
                type: ATLEAST_ONE,
                child: {
                    type: DEFINITION,
                    defn: define.peg$Definition
                }
            }, {
                type: DEFINITION,
                defn: define.peg$EndOfFile
            }]
    };

    var options = {
        verbose: true
    };

    var best = 0, bestError = '';

    function parse(str, i, definition) {
        var result = parseInternal(str, i, definition);
        if (result) {
            if (result.end > best) {
                bestError = '';
                best = result.end;
            }
        } else if (!bestError && definition.error) {
            bestError = definition.error;
        }

        return result;
    }

    function parseInternal(str, i, definition) {
        if (!definition)
            debugger;

        if (!('type' in definition))
            debugger;

        if (options.verbose)
            console.log(definition.debug);

        if (definition.breakpoint)
            debugger;

        switch (definition.type) {
            case DEFINITION:
                return parse(str, i, definition.defn);

            case SEQUENCE:
                var j = i;
                var result = '';
                for (var k = 0; k < definition.children.length; ++k) {
                    var childResult = parse(str, j, definition.children[k]);
                    if (!childResult)
                        return undefined;

                    j = childResult.end;
                    if (childResult.result)
                        result += childResult.result;
                }

                return {
                    start: i,
                    end: j,
                    result: result
                };

            case OR:
                for (var k = 0; k < definition.children.length; ++k) {
                    var childResult = parse(str, i, definition.children[k]);
                    if (childResult)
                        return childResult;
                }
                return undefined;

                break;

            case TEST:
                var childResult = parse(str, i, definition.child);

                if (childResult)
                    return {
                        start: i,
                        end: i,
                        result: childResult.result
                    };
                else
                    return undefined;

            case OPTION:
                var childResult = parse(str, i, definition.child);

                if (!childResult)
                    return {
                        start: i,
                        end: i
                    };
                else
                    return childResult;

            case ATLEAST_ONE:
            case ZERO_OR_MORE:
                var k = i;

                do {
                    childResult = parse(str, k, definition.child);
                    if (childResult)
                        k = childResult.end;
                } while(childResult);

                if (k === i && definition.type === ATLEAST_ONE)
                    return undefined;

                return {
                    start: i,
                    end: k,
                    result: str.substr(i, k - i)
                };

            case NOT:
                var childResult = parse(str, i, definition.child);
                if (!childResult)
                    return {
                        start: i,
                        end: i
                    };
                else
                    return undefined;

            case LITERAL:
                var length = definition.value.length, literal = str.substr(i, length);

                if (definition.value === literal)
                    return {
                        start: i,
                        end: i + length,
                        result: literal
                    };
                else
                    return undefined;

            case SET:
                var c = str[i];
                if (c && definition.chars.indexOf(c) !== -1)
                    return {
                        start: i,
                        end: i + 1,
                        result: c
                    };
                else
                    return undefined;

            case ANY_CHAR:
                var c = str[i];
                if (c)
                    return {
                        start: i,
                        end: i + 1,
                        result: c
                    };
                else
                    return undefined;
        }

        return "error - unknown definition - " + definition;
    }

    var initial = define.peg$Grammar;

    var result = parse(str, 0, initial);
    if (!result) {
        console.log('Error at - ' + str.substr(0, best));
        console.log(bestError);
        debugger;
    } else {
        console.log('Success');
    }
}
