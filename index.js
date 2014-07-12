'use strict';

var uritemplate = require('uritemplate')
  , extend = require('extend')
  , has = hasOwnProperty

module.exports = function(){

  var links = []
    , adapters = {}
    , defaultType

  build.link = function(rel, href){
    if (arguments.length == 1){ links.push(extend({},rel)); return this; }
    var parts = href.split(' ')
      , href = parts.pop()
      , method = parts.pop() || 'GET'
    links.push({ rel: rel, href: href, method: method }); 
    return this;
  }

  build.mediaType = function(type, fn){
    if (undefined === defaultType) defaultType = type;  // first is the default
    adapters[type] = fn; return this;
  }

  function build(instance){
    var target = {};
    links.forEach( function(link){
      if (has.call(target, link.rel)) return;
      buildMethod(target, link.rel, instance);
    });
    return target;
  }

  function findLink(rel, type){
    return links.filter( function(link){
      return link.rel == rel && (
        ( link.mediaType === undefined && type == defaultType ) ||
        ( link.mediaType == type )
      );
    })[0];
  }

  function resolveLink(link, instance){
    var resolved = extend({},link);
    resolved.href = uritemplate.parse(link.href).expand(instance);
    return resolved;
  }

  function buildMethod(target, rel, instance){
    target[rel] = function(type, fn){
      if (arguments.length == 1) { 
        fn = type; type = defaultType;
      }
      var link = findLink(rel,type);      // error if not found
      link = resolveLink(link, instance);
      var adapter = adapters[type];       // error if not found
      return adapter(link, instance, fn);
    };
  }

  return build;
}

