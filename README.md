# PEG Parser
Parsing Expression Grammar (PEG) can be used to define a grammar for a language see http://en.wikipedia.org/wiki/Parsing_expression_grammar

PEGParser is new'ed with a definition structure in the form:

```
interface PEGDefinition {
    type: string;
    children ? : PEGDefinition[];
    child ? : PEGDefinition;
    defn ? : string;
    chars ? : string;
    value ? : string;
    param ? : string;
    action ? : any;
    error ? : string;
    debug ? : string;
    breakpoint ? : boolean;
}
```

and calling the **parse(input: string)** function will return the result of the definition file *execute* on the input string.

## Usage
### Node.js example

```
var peg_to_javascript = require('./peg_to_javascript');
var PEGParser = require('./pegparser');

var simpleGrammar = "\
Comment <- '(*' comment:(Comment / ! '*)' .)* '*)' { return comment; } \n\
Definition <- param: 'a' 'b' 'c' { return param; }";

var myParser = PEGParser(peg_to_javascript);
console.log(myParser.parse(simpleGrammar));
```

### HTML example
```
<script src="pegparser.js" type="text/javascript"></script>
<script src="peg_to_javascript.js" type="text/javascript"></script>
<script>
    var simpleGrammar = "\
Comment <- '(*' comment:(Comment / ! '*)' .)* '*)' { return comment; } \n\
Definition <- param: 'a' 'b' 'c' { return param; }";
    var pegParser = PEGParser(peg_to_javascript.define);
    console.log(pegParser.parse(simpleGrammar));
</script>
```

An interactive example is available in **peg.html**

## Files
**peg.d** - definition file for the PEG

**peg.html** - interactive example, uses peg_to_javascript.js to generate a javascript parser from the input text

**peg_codeblock.d** - basic definition file for the PEG, but with support for codeblocks

**peg_node.js** - node.js example

**peg_to_javascript.d** - definition file for the PEG which includes code to output to javascript

**peg_to_javascript.js** - a javascript version of peg_parser.d. The definition structure (peg_to_javascript.define) is suitable for use in pegparser.js

**pegparser.js** - a framework for parsing PEGs. Given a definition structure and an input string, it will *run* the definition on the input string, returning the result of the top-most definition (generated from pegparser.ts).

**pegparser.ts** - typescript source for pegparser.js
