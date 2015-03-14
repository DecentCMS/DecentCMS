title: Adding settings to a theme
number: 4

-8<------------------------------------------------------------------

In DecentCMS, themes are just modules that are under the "themes"
directory.
The convention is that they should only contain "theme-y" things,
such as template overrides, stylesheets, icons, etc., but essentially
they are modules (and modules could in principle do theme-y things,
as themes can do module-y things).
One of the things a module can do is expose features, and those
features can have settings that can be defined at the level of
the site.
 
The first thing we'll want to do, then, is to define a feature on
our theme: open the theme's `package.json` file and add the following
section...

```json
"features": {
  "default-theme-settings": {
    "name": "Default theme settings",
    "description": "Settings for the default theme"
  }
},
```

In the `/sites/name-of-the-site/settings.json` file for your site,
under the features section, add the following settings definition
(I'm only defining a background color here, but you can define any
number of settings you want, and they don't have to be limited to
string values):

```json
"default-theme-settings": {
  "background-color": "#c0c0c0"
},
```

Finally, edit any of the templates under the "views" subdirectory
of your theme (we're changing '/themes/default/views/layout.tl'
here), and add code that uses the settings we added, that can be
found under the `site.features.default-theme-settings` object:

```html
<body role="document"
  style="background-color: {site.features.default-theme-settings.background-color};">
```

And that's it: the background color of the site now reflects the
site settings.