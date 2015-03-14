title: Building a theme
number: 2

-8<------------------------------------------------------------------

A theme in DecentCMS is a packaged set of files that can customize
the look and feel of the site.

It usually consists of a stylesheet, a few images and scripts, and of
template overrides.

The default theme
-----------------

The default theme for DecentCMS is built on [Bootstrap][bootstrap].
This makes it immediately familiar to anyone who's worked with
Bootstrap, and also makes it possible to take advantage of the many
Bootstrap themes that are available and that should be extremely
easy to adapt to DecentCMS.

The default theme doesn't include just a built version of Bootstrap.
Instead, it includes the source for Bootstrap, along with [a
`Gruntfile.js` file][grunt] that contains the logic to build the
Bootstrap files.
This means that is is easy to customize the default theme to add
your own styles, and select exactly what you need to include.

In fact, the default theme comes with a few customizations.
To look at these customizations, modify them, and add your own, open
the `/themes/default/less/style.less` file.
Once you've modified `style.less`, run `grunt less` from a Node
command-line aimed at the theme's root directory (`/themes/default`
if you're modifying the default theme).

Before you modify the default theme, you should consider making a
copy under a different name, in order to make future updates of
DecentCMS easier.

Anatomy of a theme
------------------

Themes are a special kind of DecentCMS module, that is meant to be
specialized in rendering shapes using templates, and in exposing
static files such as stylesheets, fonts, and icons.
Themes are the subdirectories under `/themes`.

A theme will typically contain the following directories and files:

* **css**: This directory will be exposed under the `/css` path.
  If you're building your CSS files from Less or Sass files, like
  you should, you're never going to modify the files in this
  directory directly.
  This directory is meant to be a build target.
* **fonts**: If your theme is using custom fonts, they will be served
  from this directory, under the path `/fonts`.
* **img**: Images (jpg, gif, png, svg, etc.) that are part of the
  theme, including sprite sheets, should be placed under this
  directory.
  They will be served under the `/img` path.
* **js**: JavaScript files for the theme are served from this
  directory under the path `/js`.
* **less**: Files in this directory are not served, but are compiled
  into the `css` directory.
  If the theme is using Sass instead of Less, of course, this
  directory would be called `sass`.
* **views**: Template overrides should be put in that directory.
  Any format corresponding to the active view engines can be used.
  Typically, [Dust][dust] templates, with the `.tl` extension, are
  used.
  The filename for a template is the name of the shape it's
  rendering.
  Most themes will contains as the bare minimum a `layout.tl`
  template that renders the `html`, `head`, and `body`.
  Inside the `body` tag, structural markup can usually be found,
  with zone definitions inside.
  See the "[writing a layout template][layout]" topic for more
  information.
* **Gruntfile.js**: This file contains the [Grunt][grunt] scripts
  that build the files in the theme that need building (such as
  the Less files).
  This file is not mandatory, but if you don't have one, you're
  probably missing out.
* **package.json**: This is [the NPM package manifest][npm] for
  the theme.

  [bootstrap]: http://getbootstrap.com/
  [dust]: https://github.com/linkedin/dustjs/wiki/Dust-Tutorial
  [grunt]: http://gruntjs.com/
  [npm]: https://docs.npmjs.com/files/package.json
  [layout]: /docs/building-sites/writing-a-layout-template
