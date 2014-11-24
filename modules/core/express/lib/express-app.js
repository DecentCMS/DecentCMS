// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var t = require('decent-core-localization').t;

/**
 * @description
 * Wraps an Express application so prioritized middleware can be added.
 * @param app The Express app.
 * @constructor
 */
var ExpressApp = function(app) {
  this.app = app;
  this.registrations = [];
  this.locked = false;
};

/**
 * @description
 * Adds a prioritized registration function.
 * Registration functions will be added in order of growing priority.
 * @param {Number} priority The priority of the registration.
 * @param {Function} registration The function that does the registration.
 *                                Takes the Express app as its parameter.
 */
ExpressApp.prototype.register = function(priority, registration) {
  if (this.locked) throw new Error(t('Can\'t register middleware on a locked application.'));
  registration.routePriority = priority;
  this.registrations.push(registration);
};

/**
 * @description
 * Locks the application so no new registration can be done.
 * Executes all the registration functions in priority order.
 */
ExpressApp.prototype.lock = function() {
  var self = this;
  self.registrations
    .sort(function orderByRoutePriority(registrationA, registrationB) {
      return registrationA.routePriority - registrationB.routePriority;
    })
    .forEach(function registerWithApp(registration) {
      registration(self.app);
    });
  console.log(t('Registered Express middleware.'));
  self.locked = true;
};

module.exports = ExpressApp;