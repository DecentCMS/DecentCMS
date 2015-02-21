title: UI

-8<------------------------------------------------------------------

The UI module provides a number of core services used to compose UI
in DecentCMS.

* The code and Dust view engines provides different ways to build
templates for shapes (which are nuggets of data to be rendered).
* The default theme selector enables sites to specify what theme to use
by default.
* The file placement strategy is used to dispatch shapes to different
zones, based on files that can be written by module and theme
authors.
* The render stream is the basic API used by all view engines to send
rendered HTML to the user's browser. It's a fluent and asynchronous
API.
* Shape provides basic shape handling services.
* Template rendering strategy figures out what template file to use
for a given shape.
* Zone handler handles the life cycle of a zone, which is a bag of
shapes to which other shapes can be dispatched, typically using
placement.