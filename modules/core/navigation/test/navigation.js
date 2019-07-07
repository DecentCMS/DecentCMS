// DecentCMS (c) 2019 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
"use strict";

const expect = require("chai").expect;

const Navigation = require("../services/navigation");

const site = {};

const menuItem1 = {"name": "item1", "title": "title 1", "href": "/item1"};
const menuItem2 = {"name": "item2", "title": "title 2", "href": "/item2"};

const nav = new Navigation({
  callService: (service, method, options, done) => {
    options.items.push(menuItem1, menuItem2);
    done();
  },
  require: service => site
});

describe("Navigation", () =>
  it("adds menu items to site navigation", done => {
    const context = {
      menu: "some-menu"
    };

    nav.query(context, () => {
      expect(site.navigation["some-menu"])
        .to.deep.equal([menuItem1, menuItem2]);
      done();
    });
  })
);