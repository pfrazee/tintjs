Tint
====

Javascript templating system which makes builder objects from interfaces defined in templates.

## HTML template

```
<div id="container">
    <div id="nav">
        $nav{
        <ul class="nav-list">
            $item() {
                $header(label){<li class="nav-header">$label;</li>}header;
                $link(icon, label, uri){<li><a href="$uri;"><i class="icon-$icon;"></i> $label;</a></li>}link;
            }item;
        </ul>
        }nav;
    </div>
    <div id="content">
        <h3>$title;</h3>
        $table(){
        <table $class(){class="$add(class){$class;}add;"}class;>
            $message(serviceLabel, uri, author, title, date) {
                <tr><td><span class="label">$serviceLabel;</span></td><td><a href="$uri;"><strong>$author;</strong> $title;</a></td><td>$date;</td></tr>
            }message;
        </table>
        }table;
    </div>
</div>
```

## Javascript Usage

```javascript
// `templateString` contains the above template
var tmpl = new Tint.compile(templateString);

// nav
tmpl.nav.item().header('Inbox');
tmpl.nav.item().link('inbox', 'Inbox', '#');
tmpl.nav.item().link('cog', 'Settings', '#/settings');
tmpl.nav.item().header('Services');
tmpl.nav.item().link('folder', 'MyService', '#/myservice');

// content
tmpl.title = "Your Inbox";

var tmplTable = tmpl.table();
tmplTable.class().add('table table-condensed');
if (config.useborders) {
    tmplTable._class[0].add('bordered');
}
for (var i=0; i < messages.length; i++) {
    var message = messages[i];
    tmplTable.message(message.service, message.uri, message.author, message.summary, message.date);
}

// build output
var html = tmpl.toString();
```

## Usage

There are 3 template constructs: the variable, the block, and the function. **Variables** are direct substitutions within their block: they will be replaced with whatever string is assigned to them. **Blocks** contain bodies within brackets. The only create a new namespace in the template; their contents are included no matter what, and can't be altered without variables. **Functions** are blocks with parameter lists. Calling them instantiates a new copy of the block (with a new namespace) which will be added to the output. Thus, a function that is never called is never inserted, and a function that is called 5 times is inserted 5 times.

Tint uses those constructs to build a set of objects which produce the final output. The premise is to make the view layer a little smarter than variable binding while keeping logic out of the template file.