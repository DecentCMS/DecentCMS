// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

var Markdown = require('../services/markdown-text-flavor');

describe('Markdown', function() {
  it('responds to markdown and md flavors', function() {
    var md = new Markdown();
    expect(md.matches('markdown')).to.be.true;
    expect(md.matches('md')).to.be.true;
  });

  it('formats markdown', function() {
    var md = new Markdown();
    expect(md.getHtml('foo *bar*.'))
      .to.equal('<p>foo <em>bar</em>.</p>\n');
  });

  it('passes options to Marked', function() {
    var md = new Markdown({}, {gfm: true});
    var markdown = 'foo_bar_baz';
    var html = md.getHtml(markdown);
    expect(html).to.equal('<p>' + markdown + '</p>\n');

    md = new Markdown({}, {gfm: false, pedantic: true});
    html = md.getHtml(markdown);
    expect(html).to.equal('<p>foo<em>bar</em>baz</p>\n');
  });
});