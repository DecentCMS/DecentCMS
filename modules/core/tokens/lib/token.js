// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';

/**
 * @description
 * String token interpolation service for DecentCMS.
 *
 * @param {Shell} shell The DecentCMS shell.
 * @constructor
 */
var Token = function(shell) {
  this.shell = shell;
  this.Mark = require('markup-js');
  this.pipes = this.Mark.pipes;
  this.shell.emit(Token.registerPipesEvent, this.pipes);
};

/**
 * @describe
 * The name of the shell event triggered when a token service
 * calls for pipe extensions to register themselves.
 * @type {String}
 */
Token.registerPipesEvent = 'decentcms.core.token.register-pipes';

/**
 * @description
 * Injects token values using the provided context.
 * The method uses Markup.js as the templating engine
 * (see https://github.com/adammark/Markup.js).
 *
 * @param {String} str     The string in which tokens must be evaluated
 * @param {Object} context The context object against which tokens are evaluated
 * @returns {String} The interpolated string where tokens have been replaced with their values
 */
Token.prototype.interpolate = function(str, context) {
  return this.Mark.up(str, context);
};

module.exports = Token;