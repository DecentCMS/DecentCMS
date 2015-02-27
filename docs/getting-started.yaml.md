title: Getting started with DecentCMS
number: 1

-8<------------------------------------------------------------------


Installation
------------

There is only an experimental installation procedure for the moment:

* Install the latest Node.js (it should come with npm, but make sure
  your `npm --version` is more than 2;
  if not, `npm install -g npm` should fix it)
* `npm install -g grunt-cli`
* Clone the repository `git clone https://github.com/DecentCMS/DecentCMS.git`
* From the root of the clone, `npm install`
* From the root of the clone, `grunt install`
* `cd modules/core/multi-tenancy`, then `npm install`. This step will
  disappear in the near future, but is necessary at this point.
* Create a web site or clone an existing one under `sites/default`
  (for example from [this sample site][decent-consulting-site]).

You can then run the server: node server, and navigate to localhost:1337.

Otherwise, you can manually install by cloning the repository,
adding a sites/default folder (for example from
[this sample site][decent-consulting-site]), and then `npm install`
from the root and from every single module and theme folder.
