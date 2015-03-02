title: Anatomy of a site
number: 3

-8<------------------------------------------------------------------

The default mechanism to store content items in Decent CMS is to use
files under the `/sites` directory.
This can be replaced with database storage, of course (the first
provider that will be implemented after the file-based one will be
CouchDB), but the file storage has some unique advantages.
While it's obviously not something you'd use on a big site, being
able to xcopy contents, and deploy contents with a simple ftp client
is very powerful.
Being able to look into folders and find content items as single
files that can be modified with a simple text editor is extremely
comfortable.

If you look under the `/sites` directory that's at the root of a
DecentCMS instance, you'll find one or several subdirectories that
correspond to the tenants or sites running under the instance.
If there's only one site, it'll usually be called "default".
Under each of those tenant folders, you'll find the same structure.

* **settings.json** contains the site's settings, including its name,
  the host names to which it must respond, the list of enabled
  features, and the settings for each of those features,
  if they have any.
* **content** is where the content items are defined.
  The subdirectory structure and file names define the ids of the
  content items.
  For example, `/foo/bar/baz` can be defined by a `baz.yaml.md` file
  under a `foo` and a `bar` directories.
* **widget** is where widgets and layers are defined.
  The `index.json` file defines the layers, with the ids of the
  widgets they contain.
  The widgets are content item files that are stored in the same
  folder as the `index.json` file.
* **media** is where the assets that are specific to the site
  (typically images) can be found.
  The files under this directory will be served under the `/media`
  URL.
* **navigation** is where navigation menus are defined.
  Typically, you'll find at least a menu file named `default.json`
  under this directory, but there may be others, as needed.
* **logs** is where logs are written by the system, if configured
  this way in the site's `settings.json` file under the
  `winston-logger` section, with a new file per day.
  You may have to manually create that folder.
* **index** is where index files get stored, if the site uses any
  search indexes, and if the indexing provider is the file index
  provider.

Real examples of DecentCMS site folders can be found in the following
Github repositories:

* **Decent Consulting**:
  <https://github.com/DecentCMS/DecentConsulting>
* **DecentCMS**:
  <https://github.com/DecentCMS/DecentCMS-WebSite>

You can even clone those repositories into your DecentCMS
installation and experiment with them as sample sites.

Notice that all the files that define a given web site, including
media and logs, can be found under a single folder.
That means that deploying a site is as simple as deploying the site's
folder.