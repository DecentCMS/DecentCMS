title: Anatomy of a site
number: 1

-8<------------------------------------------------------------------

The default mechanism to store content items in Decent CMS is to use
files under the `/sites` directory.
This can be replaced with database storage, of course (the first
provider that will be implemented after the file-based one will be
CouchDB), but the file storage has some unique advantages.
While it's obviously not something you'd use on a big site, being
able to xcopy contents, and deploy contents with a simple ftp client
is very powerful.
Being able to look into subdirectories and find content items as
single files that can be modified with a simple text editor is
extremely comfortable.

If you look under the `/sites` directory that's at the root of a
DecentCMS instance, you'll find one or several subdirectories that
correspond to the tenants or sites running under the instance.
If there's only one site, it'll usually be called "default".
Under each of those tenant directories, you'll find the same
structure.

Notice that all the files that define a given web site, including
media and logs, can be found under a single directory.
That means that deploying a site is as simple as deploying the site's
directory.

The settings.json file
----------------------

The `settings.json` file contains contains the site's settings,
including its name, the host names to which it must respond,
the list of enabled features, and the settings for each of those
features, if they have any.

A complete description of this file can be found
[here](/docs/decent-core-multi-tenancy/the-settings-file).

The content directory
---------------------

The content directory is where files describing content items can be
found if the file content store feature is active.
The directory structure reflects the content item ids.
For example, an item accessible as `/path/to/item` has the id
`path/to/item`, and will be described by a `item.json`, `item.yaml`,
or `item.yaml.md` file in the `content/path/to` directory.

Landing pages can also be stored under the `index` name.
For example, the `/path/to` URL can be described by a `to.yaml.md`
file, as described in the previous paragraph, but it can also be
described by an `index.json`, `index.yaml`, or `index.yaml.md`
file under the `content/path/to` directory.

The widget directory
--------------------

The widget directory is where widgets and layers are defined.
It contains an `index.json` file that contains a JSON description of
widget layers and pointers to the widgets that they contain.
The directory also contains one file per widget, named with the
widget's id, and the `.json`, `.yaml`, or `.yaml.md` extension,
if the file content store feature is active.

The format for the `index.json` layer file is described in
[this topic](/docs/decent-core-widgets/layer-file).

The media directory
-------------------

The media directory contains all asset files that are specific to
the site (typically images).
Those assets are served directly under the `/media` path.
For example, `/sites/mysite/media/logos/logo.svg` will
be served when `/media/logos/logo.svg` is requested.

The navigation directory
------------------------

The navigation directory contains a JSON file for each navigation
menu in the site.
The name of the file without extension is the name of the menu.
The directory should at least contain one `default.json` file for
the default menu.

The format of the navigation file is described in
[this topic](/docs/decent-core-navigation/navigation-file).

The logs directory
------------------

Depending on the site's logging configuration, the logs directory
typically contains one log file per day, that has records of events
and errors that the application went through.
Logs can be configured in the site's `settings.json` file under
the `winston-logger` section.
You may have to manually create the `/sites/mysite/logs` directory.

Examples
========

Real examples of DecentCMS site directories can be found in the
following Github repositories:

* **Decent Consulting**:
  <https://github.com/DecentCMS/DecentConsulting>
* **DecentCMS**:
  <https://github.com/DecentCMS/DecentCMS-WebSite>

You can even clone those repositories into your DecentCMS
installation and experiment with them as sample sites.
