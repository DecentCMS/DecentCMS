title: Writing a layout template
number: 3

-8<------------------------------------------------------------------

The layout template is the most important file in a theme, with the
style sheet.
It is the file that defines the site layout's skeleton.

In order to help you build your own, this topic will examine the
details of the default theme's layout template.

The layout template can be found under
`/themes/name-of-the-theme/views/layout.tl`.

Declaring meta, style sheets, and scripts
------------------------------------------

The default layout template starts by registering meta tags, styles,
and scripts using special Dust tags.

```html
{@meta name="generator" value="DecentCMS"/}
{@meta charset="utf-8"/}
{@meta http-equiv="X-UA-Compatible" value="IE=edge"/}
{@meta name="viewport" value="width=device-width, initial-scale=1"/}
{@style name="style"/}
{@script name="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"/}
{@script name="script"/}
```

The reason why the template uses those special tags instead of
directly having HTML tags in the `head` section is that DecentCMS
is a collaborative environment, where many components collaborate to
compose the rendering of the page.

Going through registering APIs like this enables DecentCMS to remove
duplicates, and it enables other components to add and remove
resources.

The `head` section
------------------

The `head` section is where the actual rendering of the meta tags
and style sheet links are getting rendered.
This is also where the title is getting rendered.
In this default template, it is a combination of the site's name,
and of the actual title of the content item.

```html
<head>
  {@metas/}
  {@styles/}
  <title>{site.name} - {title}</title>
</head>
```

Zones
-----

Zones are special shapes under the layout that can be targeted by
content.
For example, the main content item on the page will send its shapes
to the "main" zone.
Widgets can be configured to be rendered into any of these zones.

Most of the code under the `body` tag deals with defining these
zones.
For example, the following code creates three zones: "leftSidebar",
"main", and "rightSidebar".

```html
{@shape shape=leftSidebar tag="div" class="left-sidebar layout-lmr"/}
{@shape shape=main tag="div" class="main layout-lmr"/}
{@shape shape=rightSidebar tag="div" class="right-sidebar layout-lmr"/}
```

Those zones get rendered each wrapped in a div tag, if they have any
content in them.
If no shape was ever added under them, no property with the name of
the zone will exist on the layout shape.
This is what makes conditional rendering based on the existence of
content in a zone as easy as checking it by name:

```html
{?leftSidebar}
...
{:else}
...
{/leftSidebar}
```

If all you want to do is conditionally render the zone based on
whether it has content, however, you don't even need to do that test,
as in that case the `shape` tag will not render anything, not even
a wrapper.

The last thing that the template renders, right before the
`&lt;/html&gt;` and `&lt;/html&gt;` tags, is the list of registered
scripts.

```html
    {@scripts/}
  </body>
</html>
```