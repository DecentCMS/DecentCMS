title: Getting started with DecentCMS
number: 1

-8<------------------------------------------------------------------


Installation
------------

There is only an experimental installation procedure for the moment:

* Install the latest Node.js (it should come with npm, but make sure
  your `npm --version` is more than 2;
  if not, `npm install -g npm` should fix it)
* Clone the repository `git clone https://github.com/DecentCMS/DecentCMS.git`
* From the root of the clone, `npm install`
* Create a web site or clone an existing one under `sites/default`
  (for example from [this sample site][decent-consulting-site],
  or from [the DecentCMS web site][decent-cms-site]).

You can then run the server: node server, and navigate to localhost:1337.

  [decent-consulting-site]: https://github.com/DecentCMS/DecentConsulting
  [decent-cms-site]: https://github.com/DecentCMS/DecentCMS-WebSite
