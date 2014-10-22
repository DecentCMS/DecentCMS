// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function TitlePart(shell, options) {
  this.shell = shell;
  this.item = options.item;
}

TitlePart.on = {
  'decent.core.handle-item': function(shell, options) {
    var content = options.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp
      || !content.temp.item
      || !content.temp.item.title) return;
    var temp = content.temp;
    var item = temp.item;
    var title = item.title;
    if (title && temp.displayType === 'main') {
      var renderer = options.renderStream;
      renderer.title = title;
    }
    temp.shapes.push({
      meta: {type: 'title'},
      temp: {displayType: temp.displayType},
      text: title
    });
  }
};

module.exports = TitlePart;