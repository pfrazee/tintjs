Tint
====

Javascript templating system which makes builder objects from interfaces defined in templates.

## HTML template

```
<div id="container">
    <div id="nav">
        $nav{
        <ul class="nav-list">
            $header(label){<li class="nav-header">$label;</li>}header;
            $item(icon, label, uri){<li><a href="$uri;"><i class="icon-$icon;"></i> $label;</a></li>}item;
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
var tmpl = new Tint(templateString);

// nav
tmpl.nav.header('Inbox');
tmpl.nav.item('inbox', 'Inbox', '#');
tmpl.nav.item('cog', 'Settings', '#/settings');
tmpl.nav.header('Services');
tmpl.nav.item('folder', 'MyService', '#/myservice');

// content
tmpl.title = "Your Inbox";

var tmplTable = tmpl.table();
tmplTable.class().add('table').add('table-condensed');
if (config.useborders) {
    tmplTable.children('class')[0].add('bordered');
}
for (var i=0; i < messages.length; i++) {
    tmplTable.message(message.service, message.uri, message.author, message.summary, message.date);
}

// build output
var html = tmpl.toString();
```

## Usage

There are 3 template constructs: the variable, the block, and the function. **Variables** are direct substitutions within their block: they will be replaced with whatever string is assigned to them. **Blocks** contain bodies within brackets. The only create a new namespace in the template; their contents are included no matter what, and can't be altered without variables. **Functions** are blocks with parameter lists. Calling them instantiates a new copy of the block (with a new namespace) which will be added to the output. Thus, a function that is never called is never inserted, and a function that is called 5 times is inserted 5 times.

Tint uses those constructs to build a set of objects which produce the final output. The premise is to make the view layer a little smarter than variable binding while keeping logic out of the template file.