var peg_to_javascript = require('./peg_to_javascript');
var PEGParser = require('./pegparser');

var simpleGrammar = "\
Comment <- '(*' comment:(Comment / ! '*)' .)* '*)' { return comment; } \n\
Definition <- param: 'a' 'b' 'c' { return param; }";

var myParser = PEGParser(peg_to_javascript);
console.log(myParser.parse(simpleGrammar));
