(function () {
    function PEGParser(definitions) {
        this.define = {};
        this.options = {
            verbose: false,
            useCache: false
        };
        this.best = 0;
        this.bestError = '';
        this.parses = [];

        this.addDefinition(definitions);
    }

    PEGParser.prototype.setOptions = function (options) {
        if (!options)
            return;

        for (var k in options)
            this.options[k] = options;
    };

    PEGParser.prototype.addDefinition = function (definitions) {
        if (!definitions)
            return;

        for (var k in definitions) {
            var defn = definitions[k];

            if (k === 'parse' && typeof defn === 'function') {
                this.parses.push(defn);
            } else {
                if (!this.initial)
                    this.initial = defn;

                this.define[k] = defn;
            }
        }
    };

    PEGParser.prototype.parse = function (str) {
        if (typeof str !== 'string')
            return 'error: input parameter is not a string - ' + str;

        if (str.length === 0)
            return 'error: input string is empty';

        if (!this.initial)
            return 'error: there are no definitions in this parser';

        this.best = 0;
        this.bestError = '';

        for (var i = 0; i < this.parses.length; ++i)
            this.parses[i]();

        var info = this.parseInternal(str, 0, this.initial);
        if (!info)
            return undefined;

        return info.result;
    };

    PEGParser.prototype.applyParams = function (definition, params, results) {
        if (typeof definition.action === 'function') {
            return definition.action.apply(this, params);
        } else {
            var isStringArray = Array.isArray(results);
            for (var i = 0; isStringArray && i < results.length; ++i)
                isStringArray = typeof results[i] === 'string';

            return isStringArray ? results.join('') : results;
        }
    };

    PEGParser.prototype.parseInternal = function (str, i, definition) {
        var debugStr = str.substr(i, 20);

        if (!definition) {
            debugger;
            return undefined;
        }

        if (!('type' in definition)) {
            debugger;
            return undefined;
        }

        if (this.options.verbose)
            console.log(definition.debug);

        if (definition.breakpoint)
            debugger;

        var info;

        switch (definition.type) {
            case 'definition':
                var childDefinition = this.define[definition.defn];
                if (!childDefinition) {
                    debugger;
                    break;
                }

                info = this.parseInternal(str, i, childDefinition);
                break;

            case 'sequence':
                var j = i;
                var result, params = [];

                for (var k = 0; k < definition.children.length; ++k) {
                    var childDefinition = definition.children[k];
                    var childInfo = this.parseInternal(str, j, childDefinition);

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
                        result: this.applyParams(definition, params, result)
                    };
                break;

            case 'or':
                for (var k = 0; k < definition.children.length; ++k) {
                    var childInfo = this.parseInternal(str, i, definition.children[k]);
                    if (childInfo) {
                        info = childInfo;
                        break;
                    }
                }
                break;

            case 'test':
                var childInfo = this.parseInternal(str, i, definition.child);

                if (childInfo)
                    info = {
                        start: i,
                        end: i,
                        result: childInfo.result
                    };
                break;

            case 'option':
                var childInfo = this.parseInternal(str, i, definition.child);

                if (!childInfo)
                    info = {
                        start: i,
                        end: i
                    };
                else
                    info = childInfo;
                break;

            case 'at least one':
            case 'zero or more':
                var k = i, result, params = [], childDefinition = definition.child;

                do {
                    childInfo = this.parseInternal(str, k, childDefinition);

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

                if (k !== i || definition.type !== 'at least one')
                    info = {
                        start: i,
                        end: k,
                        result: this.applyParams(definition, params, result)
                    };
                break;

            case 'not':
                var childInfo = this.parseInternal(str, i, definition.child);
                if (!childInfo)
                    info = {
                        start: i,
                        end: i
                    };
                break;

            case 'literal':
                var length = definition.value.length, literal = str.substr(i, length);

                if (definition.value === literal)
                    info = {
                        start: i,
                        end: i + length,
                        result: literal
                    };
                break;

            case 'set':
                var c = str[i];
                if (c && definition.chars.indexOf(c) !== -1)
                    info = {
                        start: i,
                        end: i + 1,
                        result: c
                    };
                break;

            case 'any char':
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
            if (info.end > this.best) {
                this.bestError = '';
                this.best = info.end;
            }
        } else if (!this.bestError && definition.error) {
            this.bestError = definition.error;
        }

        return info;
    };

    var parser = function (definitions) {
        return new PEGParser(definitions);
    };

    if (typeof module !== 'undefined') {
        module.exports = parser; // commonjs
    } else {
        window['PEGParser'] = parser; // html <script>
    }
})();
