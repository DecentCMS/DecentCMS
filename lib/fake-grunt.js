// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var EventEmitter = require('events').EventEmitter;
var path = require('path');

module.exports =
/**
 * Used to harvest task names and eventually verify whether a task exists
 */
  function fakeGrunt(modulePath) {
    this.tasks = {};

    this.config = {};
    this.task = {};
    this.fail = {};
    this.file = {
      defaultEncoding: 'utf8',
      preserveBOM: false
    };
    this.log = this.verbose = {};
    this.option = {};
    this.template = {};
    this.util = {linefeed: '\n'}

    this.loadTasks = this.loadNpmTasks =
    this.initConfig = this.config.init =
    this.warn = this.fail.warn =
    this.fatal = this.fail.fatal =
    this.option = this.config.get = this.config.set =
    this.config.process = this.config.getRaw =
    this.config.escape = this.config.merge = this.config.requires =
    this.file.read = this.file.readYAML =
    this.file.copy = this.file.delete = this.file.mkdir =
    this.file.recurse = this.file.expandMapping = this.file.match =
    this.file.isMatch = this. file.exists = this.file. isLink =
    this.file.isDir = this.file.isFile = this.file.isPathAbsolute =
    this.file.arePathsEquivalent = this.file.doesPathContain =
    this.file.isPathCwd = this.file.isPathInCwd = this.file.setBase =
    this.log.write = this.log.writeln = this.log.error = this.log.errorlns =
    this.log.ok =  this.log.oklns = this.log.subhead = this.log.writeflags =
    this.log.debug = this.option.init = this.option.flags = this.task.require =
    this.task.exists = this.tasks.loadTasks = this.task.loadNpmTasks =
    this.task.run = this.task.clearQueue = this.task.normalizeMultiTaskFiles =
    this.template.process = this.template.setDelimiters =
    this.template.addDelimiters = this.template.today = this.template.date =
    this.util.kindOf = this.util.error = this.util.normalizelf =
    this.util.recurse = this.util.repeat = this.util.pluralize = this.util.spawn =
    this.util.toArray = this.util.callbackify =
      function() {return [];};

    this.file.readJSON = function(fileName) {
      return require(path.join(modulePath, fileName));
    };

    this.event = new EventEmitter();

    this.registerTask =
    this.task.registerTask =
    this.registerMultiTask =
    this.task.registerMultiTask =
      function(taskName) {
        this.tasks[taskName] = true;
      };

    this.renameTask = this.task.renameTask = function(oldName, newName) {
      delete this.tasks[oldName];
      this.tasks[newName] = true;
    };
  };
