// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var UrlHelper = require('../services/url-helper');

describe('URL Helper', function() {
  var middleware1 = {
    priority: 1,
    getUrl: function(id) {
      if (id === 'both') return '/both1';
      if (id === 'foo') return '/foo';
      return null;
    }
  };
  var middleware2 = {
    priority: 2,
    getUrl: function(id) {
      if (id === 'both') return '/both2';
      if (id === 'bar') return '/bar';
      return null;
    },
    getId: function(url) {
      return 'id:' + url;
    }
  };
  var scope = {
    getServices: function() {return [middleware1, middleware2];}
  };

  it('can give the URL of content items', function() {
    var urlHelper = new UrlHelper(scope);

    expect(urlHelper.getUrl('null')).to.equal('/');
    expect(urlHelper.getUrl('foo')).to.equal('/foo');
    expect(urlHelper.getUrl('bar')).to.equal('/bar');
    expect(urlHelper.getUrl('both')).to.equal('/both1');
  });

  it('can give the ID for the main content item behind a URL', function() {
    var urlHelper = new UrlHelper(scope);

    expect(urlHelper.getId('/')).to.equal('id:/');
    expect(urlHelper.getId('/foo')).to.equal('id:/foo');
  });
});