// DecentCMS (c) 2019 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
"use strict";

const expect = require("chai").expect;

// Some fakes
const contentManager = {
  getType: item => "post"
};

const shape = {
  meta: item => item.meta || {}
}

const scope = {
  "content-manager": contentManager,
  "shape": shape,

  settings: {
    name: "site-name",
    icon: "site-icon.png",
    favicon: "site-favicon.ico",
    copyright: "(c) foo",
    authors: ["Bertrand", "Claude"],
    email: "site@decentcms.org"
  },

  require: service => scope[service]
}

// Some test data
const post1 = {
  title: "first post",
  url: "first-post",
  summary: "first summary",
  body: { text: "first body" },
  authors: [ "Douglas", "Terry" ],
  email: "someone@decentcms.org",
  date: "2019-02-01T00:00:00.000Z",
  image: "first-image.png"
};

const post2 = {
  title: "second post",
  url: "second-post",
  summary: "second summary",
  body: { text: "second body" },
  authors: [ "Neil", "Nikhil" ],
  email: "someoneelse@decentcms.org",
  date: "2019-04-03T00:00:00.000Z",
  image: "second-image.png"
};

const blog = {
  id: "item-id",
  title: "item title",
  body: { text: "item body" },
  url: "/item",
  baseUrl: "http://decentcms.org",
  "query-results": {
    results: [ post1, post2 ]
  }
};

// Tests
const feedMapper = require("../services/feed-mapper");

describe("Feed mapper", () => {
  it("can use default mappings", () =>{
    const feed = feedMapper.map(scope, blog);

    expect(feed).to.deep.equal({
      title: blog.title,
      description: blog.body.text,
      id: blog.url,
      link: blog.url,
      image: "http://decentcms.org/site-icon.png",
      favicon: "http://decentcms.org/site-favicon.ico",
      copyright: scope.settings.copyright,
      generator: "DecentCMS",
      author: {
        name: "Bertrand, Claude",
        email: scope.settings.email
      },
      postsShapeName: "query-results",
      postsShapeProperty: "results",
      posts: [
        {
          title: post1.title,
          id: "http://decentcms.org/first-post",
          link: "http://decentcms.org/first-post",
          description: post1.summary,
          content: post1.body.text,
          author: {
            name: "Douglas, Terry",
            email: post1.email
          },
          date: new Date(Date.UTC(2019, 1, 1)),
          image: "http://decentcms.org/first-image.png"
        },
        {
          title: post2.title,
          id: "http://decentcms.org/second-post",
          link: "http://decentcms.org/second-post",
          description: post2.summary,
          content: post2.body.text,
          author: {
            name: "Neil, Nikhil",
            email: post2.email
          },
          date: new Date(Date.UTC(2019, 3, 3)),
          image: "http://decentcms.org/second-image.png"
        }
      ]
    });
  });
});