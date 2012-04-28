var Tint = (typeof module !== "undefined" && module.exports) || {};

(function(exports) {
    // :TODO:
    exports.compile = function(tmpl) {
        var builder = new TintBlock();
        builder.parse(tmpl);
        return builder;
    };

    // Block interface
    var TintBlock = function() {
        this._outVarNames = [];
        this._outParts = [];
    };
    TintBlock.prototype.parse = function(tmpl) {
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
                var blockPrototype = new TintBlock();
                blockPrototype.parse(tmpl.substring(readStart, blockEnd));
                
                // Create the constructor
                var BlockConstructor = function() {};
                BlockConstructor.prototype = blockPrototype;
                
                // Add function / block
                if (isFunc) {
                    this[curName] = TintFunction(curName, paramList, BlockConstructor);
                } else {
                    this[curName] = new BlockConstructor();
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
    TintBlock.prototype.toString = function() {
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
            parent = this;
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
})(Tint);

// Main template
/*var MyTmpl = function() {
    this.nav = new MyTmplNav();
    this.table = TintFunction('table', MyTmplTable);
};
MyTmpl.prototype = new TintBlock([
    '<div id="container"><div id="nav">',
    0,
    '</div><div id="content"><h3>',
    1,
    '</h3>',
    2,
    '</div></div>'
], ['nav','title','table']);

// Nav block
var MyTmplNav = function() {
};
MyTmplNav.prototype = new TintBlock([
    'nav title:', 0
], ['title']);

// Table block
var MyTmplTable = function() {
};
MyTmplTable.prototype = new TintBlock([
    'table title:', 0
], ['title']);

var tmpl = function() {
    var parts = [
        '<div id="container"><div id="nav">',
        0,
        '</div><div id="content"><h3>',
        1,
        '</h3>',
        2,
        '</div></div>'
    ];
    return arrayToString(parts, tmpl.nav(), 'The Title', tmpl.table());
};
tmpl.nav = function() {
    var parts = [
        '<ul class="nav-list">',
        0,
        '</ul>'
    ];
    return arrayToString(parts, tmpl.nav.item());
};
tmpl.nav.item = function() {
    var parts = [
        0,
        1
    ];
    return arrayToString(parts, tmpl.nav.item.header('header'), tmpl.nav.item.link('cog','Link','http://google.com'));
};
tmpl.nav.item.header = function(label) {
    var parts = [
        '<li class="nav-header">',
        0,
        '</li>'
    ];
    return arrayToString(parts, label);
};
tmpl.nav.item.link = function(icon, label, uri) {
    var parts = [
        '<li><a href="',
        0,
        '"><i class="icon-',
        1,
        '"></i> ',
        2,
        '</a></li>'
    ];
    return arrayToString(parts, uri, icon, label);
};
tmpl.table = function() {
    var parts = [
        '<table ',
        0,
        '>',
        1,
        '</table>'
    ];
    return arrayToString(parts, tmpl.table.clss(), tmpl.table.message('fixture','http://google.com', 'pfraze', 'hello world', 'today'));
};
tmpl.table.clss = function() {
    var parts = [
        'clss="',
        0,
        '"'
    ];
    return arrayToString(parts, tmpl.table.clss.add('condensed'));
};
tmpl.table.clss.add = function(clss) {
    var parts = [
        0
    ];
    return arrayToString(parts, clss);
};
tmpl.table.message = function(serviceLabel, uri, author, title, date) {
    var parts = [
        '<tr><td><span class="label">',
        0,
        '</span></td><td><a href="',
        1,
        '"><strong>',
        2,
        '</strong> ',
        3,
        '</a></td><td>',
        4,
        '</td></tr>'
    ];
    return arrayToString(parts, serviceLabel, uri, author, title, date);
};
*/