Tint
====

Javascript templating system which makes builder objects from interfaces defined in templates.

## HTML template

```html
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
        $table(){
        <table $class(){class="$add(class){$class;}add;"}class;>
            $message(serviceLabel, uri, author, title, date) {
                <tr $classes(classes){class="$classes;"}classes;><td><span class="label">$serviceLabel;</span></td><td><a href="$uri;"><strong>$author;</strong> $title;</a></td><td>$date;</td></tr>
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

// content table
var tmplTable = tmpl.table();
tmplTable.class().add('table').add('table-condensed');
if (config.useborders) {
    tmplTable.child('class', 0).add('bordered');
}
for (var i=0; i < messages.length; i++) {
    var tmplMsg = tmplTable.message(message.service, message.uri, message.author, message.summary, message.date);
    if (i%2 == 0) {
        tmplMsg.classes('zebra');
    }
}

// build output
var html = tmpl.toString();
```

