(function() {
    // Set up namespace
    var Tint;
    if (typeof exports != 'undefined') {
        Tint = exports;
    } else {
        Tint = this.Tint = {};
    }

    // Creates a string-builder prototype using the interface described in the template
    // - `tmpl` must be a string
    var compile = function(tmpl, opt_constructor) {
        // Parse the definition
        var builder = new TintBlockPrototype();
        builder.parse(tmpl);
        
        // Create the type
        var TintTmpl = function() {
            tintBlockConstructor.call(this);
            opt_constructor && opt_constructor.apply(this, arguments);
        };
        TintTmpl.prototype = builder;
        
        return TintTmpl;
    };

    var tintBlockConstructor = function() {
        for (var bname in this._blocks) {
            this[bname] = new (this._blocks[bname])();
        }
    };

    var TintBlockPrototype = function _TintBlockPrototype() {
        this._outVarNames = [];
        this._outParts = [];
        this._blocks = {};
    };
    TintBlockPrototype.prototype.parse = function(tmpl) {
        var isParsing = false
        ,   readStart = 0
        ,   curName = null
        ,   tmplLen = tmpl.length
        ;
        for (var i = 0; i < tmplLen; i++) {
            var charAt = tmpl.charAt(i);
            if (!isParsing) {
                // Start construct?
                if (charAt == '$') {
                    // Add what we've read up till this point
                    var part = tmpl.substring(readStart, i);
                    if (part) { this._outParts.push(part); }
                    isParsing = true;
                    readStart = i + 1;
                }
            } else {
                // Escaped $?
                if (charAt == '$') {
                    if (readStart == i) { // first char we read after $?
                        this._outParts.push('$');
                        readStart = i + 1;
                        isParsing = false;
                        continue;
                    }
                    // Parse error -- cant have a $ in the name
                    throw "Invalid '$' found while reading variable name: "  + tmpl.substring(readStart, i);
                }
                // End of name?
                if (charAt == '(' || charAt == '{' || charAt == ';') {
                    // Add the construct to our list of variables
                    curName = tmpl.substring(readStart, i).trim();
                    if (!curName) { throw "Invalid name at char "+i+": variable names cannot be blank"; }
                    this._outParts.push(this._outVarNames.length);
                    this._outVarNames.push(curName);
                    readStart = i + 1;
                    isParsing = false;
                } else {
                    // keep reading
                    continue;
                }
                // Variable?
                if (charAt == ';') {
                    this[curName] = ''; // default value
                    continue;
                }
                // Function?
                var paramList = [], isFunc = false;
                if (charAt == '(') {
                    isFunc = true;
                    // Read param list
                    var paramsEnd = readStart;
                    for (i; i < tmplLen; i++, paramsEnd++) {
                        if (tmpl.charAt(i) == ')') { break; }
                    }
                    var paramParts = tmpl.substring(readStart, paramsEnd-1).split(',');
                    for (var j=0; j < paramParts.length; j++) {
                        if (!paramParts[j]) {
                            // empty param is only okay if it's the only one-- but ignore it
                            if (paramParts.length != 1) { throw "Empty parameter name in " + curName; }
                            break;
                        }
                        paramList.push(paramParts[j].trim());
                    }
                    // Move past param list-- now in the block
                    for (i = i+1; i < tmplLen; i++) {
                        charAt = tmpl.charAt(i);
                        if (charAt == '{') { break; }
                        // make sure we only get whitespace btwn params and block start
                        if (!/\s/.test(charAt)) { throw "Function block expected after params"; }
                    }
                    readStart = ++i; // move past '{'
                }
                
                //`Block-- find the end, then recursively parse
                var blockEnd = tmpl.indexOf('}' + curName + ';', readStart);
                if (blockEnd == -1) { throw "Block '"+curName+"' must be ended by a '}"+curName+";"; }
                var blockPrototype = new TintBlockPrototype();
                blockPrototype.parse(tmpl.substring(readStart, blockEnd));
                
                // Create the constructor
                var TintBlock = function() {
                    tintBlockConstructor.call(this);
                };
                TintBlock.prototype = blockPrototype;
                
                // Add function / block
                if (isFunc) {
                    this[curName] = TintFunction(curName, paramList, TintBlock);
                } else {
                    if (!this._blocks) { this._blocks = {}; }
                    this._blocks[curName] = TintBlock;
                }
                
                // Move past the block
                i = readStart = (blockEnd + 1 + curName.length + 1);
                curName = false;
            }
        }
        // Add whatever remains
        var part = tmpl.substring(readStart, tmplLen);
        if (part) { this._outParts.push(part); }
    };
    TintBlockPrototype.prototype.toString = function() {
        // Stringify our variables
        var params = [];
        for (var i=0; i < this._outVarNames.length; i++) {
            var varName = this._outVarNames[i];
            var param = this[varName];
            if (!param) { param = ''; }
            if (Array.isArray(param)) {
                param = arrayToString(param);
            }
            if (typeof(param) == 'object') {
                param = param.toString();
            }
            if (typeof(param) == 'function') {
                if (this['_' + varName]) {
                    param = arrayToString(this['_' + varName]);
                } else {
                    param = '';
                }
            }
            params.push(param);
        }
        if (!params) { return ''; }
        // Run arrayToString using our children as params
        params.unshift(this._outParts);
        return arrayToString.apply(null, params);
    };

    var TintFunction = function(name, paramList, BlockDef) {
        return function() {
            // `this` should be the parent block
            // Create this function's blocklist, if dne
            if (!this['_' + name]) {
                this['_' + name] = [];
            }
            // Create the new block and assign its variables via this call's params
            var newBlock = new BlockDef();
            for (var i=0; i < arguments.length; i++) {
                var varName = paramList[i];
                if (!varName) { break; }
                newBlock[varName] = arguments[i];
            }
            // Add the new block
            this['_' + name].push(newBlock);
            return newBlock;
        };
    };

    // Takes an array of strings and an arbitrary number of arguments
    //  - if the array element is a number, will replace that element with the argument in that position
    //  - recurses any elements which are arrays
    var arrayToString = function(arr) {
        var str = '', args = Array.prototype.splice.call(arguments, 1);
        for (var i=0; i < arr.length; i++) {
            if (typeof(arr[i]) == 'string') {
                str += arr[i];
            } else if (typeof(arr[i]) == 'number') {
                str += args[arr[i]];
            } else if (Array.isArray(arr[i])) {
                args.unshift(arr[i]);
                str += arrayToString.apply(null, args);
                args.shift();
            } else {
                str += arr[i].toString();
            }
        }
        return str;
    };

    // Exports
    Tint.compile = compile;
}).call(this);