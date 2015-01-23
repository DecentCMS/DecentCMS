title: Structure of a site

-8<------------------------------------------------------------------

A Decent CMS site is described by a number of files under a
subdirectory of the /sites folder.
There can be more than one site (also called a tenant) under a single
Decent CMS instance.

The settings.json file
----------------------

The settings.json file contains the description of the site.

The content folder
------------------

The content folder is where files describing content items can be
found.

The media folder
----------------

The media folder contains all asset files for the site.
Those assets are served directly under the /media path.

The navigation folder
---------------------

The navigation folder contains a JSON file for each navigation menu
in the site.
It should at least contain one default.json file for the default
menu.

The widget folder
-----------------

The widget folder contains an index.json file that contains a
description of widget layers and pointers to the widgets that they
contain.
The folder also contains one file per widget, named with the widget's
id.

The logs folder
---------------

Depending on the site's logging configuration, the logs folder
typically contains one log file per day, that has records of events
and errors that the application went through.