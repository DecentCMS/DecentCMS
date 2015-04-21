title: The settings file

-8<------------------------------------------------------------------

The `settings.json` file at the root of each site's folder defines
the site's settings, such as its name, enabled features, feature
configuration, etc.

Structure
---------

Top-level properties of the settings object described by the file
can include:

* **name**: the friendly name of the site.
  This is often used by the theme to be included in the site's header
  or to build the title of the site's pages.
* **host**: a string or an array of strings describing all the host
  names that the site must respond to.
* **debugHost** a string or an array of strings describing the host
  names that the site must respond to, but do so in debug mode.
  In debug mode, `shell.debug` and `request.debug` are true.
* **port**: the port number for the site, or `"*"` if it must respond
  on any port.
* **cert**: the path to the SSL certificate file.
* **key**: the path to the SSL key file.
* **pfx**: the path to the pfx SSL certificate file.
* **setup**: unused for now, this Boolean flag indicates if the site
  has gone through the setup process.
* **features**: an object that has one property for each enabled
  feature.
  The name of the property is the name of the feature, as
  defined in the module manifest, and the value is an object giving
  the settings of the feature for this site.
  If the feature has no settings, a `{}` empty object is used.
  Please refer to each feature's documentation for details about
  what settings are available.