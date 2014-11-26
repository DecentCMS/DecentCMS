// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var t = require('../services/t');

describe('t', function() {
  it('should return the string when there are no additional parameters', function() {
    var msg = t('msg');
    expect(msg).to.equal('msg');
  });

  it('should return the formatted string when there are additional arguments', function() {
    var msg = t('msg %s and %s.', 42, 'foo');
    expect(msg).to.equal('msg 42 and foo.');
  });

  it('should let strings be resolved through the event bus', function() {
    t.translationProviders.push(function(eventPayload) {
      eventPayload.translation = eventPayload.defaultString
        + ' translated to ' + eventPayload.culture;
    });
    var msg = t('msg %s', 'foo');
    expect(msg).to.equal('msg foo translated to en-US');
  });
});