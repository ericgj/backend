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
    dynlinks = (dynlinks || []).map( function(l){ return parseLink(l); } );
    dynlinks = links.concat( dynlinks );
    return Compiler(instance, dynlinks)
             .defaultType(defaultType)
             .compile(adapters);
  }

  return build;
}


function Compiler(instance,links){
  if (!(this instanceof Compiler)) return new Compiler(instance,links);
  this.instance = instance;
  this.links = [];
  this._defaultType = undefined;
  for (var i=0; i<links.length; ++i) this.link(links[i]);
  return this;
}

Compiler.prototype.defaultType = function(_){
  this._defaultType = _; return this;
}

Compiler.prototype.link = function(_){
  this.links.push(_); return this;
}

Compiler.prototype.compile = function(adapters){
  var target = {};
  var links = this.links;
  for (var i=0; i<links.length; ++i){
    var link = links[i];
    if (has.call(target, link.rel)) continue;
    target[link.rel] = execMethod.call(this, link.rel, adapters);
  }
  target.links = linksMethod.call(this);
  target.link  = linkMethod.call(this);
  target.template = templateMethod.call(this);
  return target;
}

// compiler private methods

function findLink(rel, type){
  var links = this.links; var defaultType = this._defaultType;
  return links.filter( function(link){
    return link.rel == rel && (
      ( type === undefined ) ||
      ( link.mediaType === undefined && type == defaultType ) ||
      ( link.mediaType == type )
    );
  })[0];
}

function linksMethod(){
  var instance = this.instance; var links = this.links; var self = this;
  return function(){
    return links.map( function(link){ 
      return linkMethod.call(self, instance, links)(link.rel, link.mediaType); 
    });
  }
}

function linkMethod(){
  var instance = this.instance; var links = this.links; var self = this;
  return function(rel,type){
    var link = findLink.call(self,rel,type,links);
    return resolveLink(link, instance);
  }
}

function templateMethod(){
  var links = this.links; var self = this;
  return function(rel,type){
    var link = findLink.call(self, rel,type,links);
    return link;
  }
}

function execMethod(rel, adapters){
  var instance = this.instance; var links = this.links; var defaultType = this._defaultType;
  var self = this;
  return function(data, type, fn){
    if (arguments.length == 1) { 
      fn = data; type = undefined; data = undefined;
    }
    if (arguments.length == 2) {
      fn = type; type = undefined;
    }
    var link = findLink.call(self, rel,type,links);      // error if not found
    link = resolveLink(link, instance);
    var adapter = adapters[link.mediaType || defaultType];       // error if not found
    return adapter(link, data, fn);
  };
}


// utils

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


