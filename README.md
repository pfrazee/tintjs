Tint JS
=======

Tint uses templates which specify an interface of variables, namespaces, and functions. That interface is used to compile a prototype for objects which build the output.

The template:

```HTML
<div id="container">
    <div id="nav">
        $nav{
        <ul class="nav-list">
            $item() {
                $header(label){<li class="nav-header">$label;</li>}header;
                $link(label, uri){<li><a href="$uri;">$label;</a></li>}link;
            }item;
        </ul>
        }nav;
    </div>
    <div id="content">
        <h3>$title;</h3>
        <table>
            $message(uri, author, title, date) {
                <tr>
                    <td>$author;</td>
                    <td><a href="$uri;">$title;</a></td>
                    <td>$date;</td>
                </tr>
            }message;
        </table>
    </div>
</div>
```

The javascript:

```javascript
// Compile the prototype
// `templateString` contains the above template
var Tmpl = Tint.compile(templateString);

// ...

// Instantiate the builder object
var tmpl = new Tmpl();

// nav
tmpl.nav.item().header('Inbox');
tmpl.nav.item().link('Inbox', '/');
tmpl.nav.item().link('Settings', '/settings');
tmpl.nav.item().header('Services');
tmpl.nav.item().link('MyService', '/myservice');

// content
tmpl.title = "Your Inbox";
for (var i=0; i < messages.length; i++) {
    var message = messages[i];
    tmpl.message(message.uri, message.author, message.summary, message.date);
}

// Generate output
var html = tmpl.toString();
```

You can also extend the prototype, if you like:

```javascript
// Add a custom constructor
var Tmpl = new Tint.compile(templateString, function(services) {
    this.nav.item().header('Inbox');
    this.nav.item().link('Inbox', '');
    this.nav.item().link('Settings', '/settings');
    this.nav.item().header('Services');
    for (var i=0; i < services.length; i++) {
        this.nav.item().link(services[i].name, services[i].uri);
    }
});
Tmpl.prototype.addMessage = function(message) {
    this.message(message.uri, message.author, message.summary, message.date);
};

// ...

// Instantiate the builder object
var tmpl = new Tmpl(my_services);
tmpl.title = "Your Inbox";
for (var i=0; i < messages.length; i++) {
    tmpl.addMessage(messages[i]);
}
var html = tmpl.toString();
```

## How it works

Tint's templates use 3 different constructs:

 - Blocks
 - Variables
 - Functions

**Blocks** are just namespaces for parts of the template. They don't change the output.

`$block_name{ whatever }block_name;`

**Variables** are direct substitutions. They're replaced with whatever value they're assigned.

`$variable_name;`

**Functions** are blocks which can be added multiple times, and which take parameter lists.

`$func_name(param1, param2) { whatever $param1; whatever $param2; }func_name;`

That's it; those building blocks are enough to generate your output. Any logic you need (like conditionals, escaping, or lists with commas on all but the last item) is added to the prototype, by you, using a language that's designed for it (Javascript).

## A few additional notes

Function calls generate blocks which are stored in an array with a prefix added to the name. That is, if my template has a `$profile(username)` function, then I can access the blocks it creates at `_profile[]`. Function parameters are stored as variables with the same name as the parameter itself: `_profile[0].username`.