// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var filenameToString = require('../services/filename-to-string');

describe('File Name To String', function() {
  it('transforms a path to a human-readable string with a capitalized first letter', function() {
    var path = 'path/to/some-file-to-test.json';
    var str = filenameToString.transform(path);

    expect(str).to.equal('Some file to test');
  });
});