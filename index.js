'use strict';

var uritemplate = require('uritemplate')
  , extend = require('extend')
  , has = hasOwnProperty

module.exports = function(){

  var links = []
    , adapters = {}
    , defaultType

  build.link = function(){
    links.push( parseLink.apply(null, arguments) ); 
    return this;
  }

  build.mediaType = function(type, fn){
    if (undefined === defaultType) defaultType = type;  // first is the default
    adapters[type] = fn; return this;
  }

  function build(instance, dynlinks){
    var target = {};
    dynlinks = (dynlinks || []).map( function(l){ return parseLink(l); } );
    dynlinks = links.concat( dynlinks );
    dynlinks.forEach( function(link){
      if (has.call(target, link.rel)) return;
      target[link.rel] = execMethod(link.rel, instance, dynlinks);
    });
    target.links = linksMethod(instance, dynlinks);
    target.link  = linkMethod(instance, dynlinks);
    target.template = templateMethod(dynlinks);
    return target;
  }

  // TODO either move these functions to top-level scope by dealing with
  // defaultType, or move them within build scope and drop the annoying
  // links parameter.

  function findLink(rel, type, links){
    return links.filter( function(link){
      return link.rel == rel && (
        ( type === undefined ) ||
        ( link.mediaType === undefined && type == defaultType ) ||
        ( link.mediaType == type )
      );
    })[0];
  }

  function linksMethod(instance, links){ 
    return function(){
      return links.map( function(link){ 
        return linkMethod(instance, links)(link.rel, link.mediaType); 
      });
    }
  }

  function linkMethod(instance, links){
    return function(rel,type){
      var link = findLink(rel,type,links);
      return resolveLink(link, instance);
    }
  }

  function templateMethod(links){
    return function(rel,type){
      var link = findLink(rel,type,links);
      return link;
    }
  }

  function execMethod(rel, instance, links){
    return function(data, type, fn){
      if (arguments.length == 1) { 
        fn = data; type = undefined; data = undefined;
      }
      if (arguments.length == 2) {
        fn = type; type = undefined;
      }
      var link = findLink(rel,type,links);      // error if not found
      link = resolveLink(link, instance);
      var adapter = adapters[link.mediaType || defaultType];       // error if not found
      return adapter(link, data, fn);
    };
  }

  return build;
}


function parseLink(rel, href, type){
  if (arguments.length == 1){ return extend({},rel); }
  var parts = href.split(' ')
    , href = parts.pop()
    , method = parts.pop() || 'GET';
  var link = {}
  if (rel) link.rel = rel;
  if (href) link.href = href;
  if (method) link.method = method;
  if (type) link.mediaType = type;
  return parseLink(link);
}

function resolveLink(link, instance){
  var resolved = extend({},link);
  resolved.href = uritemplate.parse(link.href).expand(instance);
  return resolved;
}


