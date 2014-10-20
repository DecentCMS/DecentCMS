// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: morph this so this enables sequential rendering while maintaining asynchronicity.

var stream = require('stream');
var Transform = stream.Transform;
var util = require('util');

util.inherits(RenderStream, Transform);

/**
 * @description
 * A transform stream for rendering shapes.
 * @param shell
 * @constructor
 */
function RenderStream(shell) {
  Transform.call(this, {
    objectMode: true
  });
  this.shell = shell;
};

RenderStream.prototype._transform = function(chunk, encoding, done) {
  this.push(chunk);
  done();
};

module.exports = RenderStream;