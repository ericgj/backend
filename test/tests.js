'use strict';

var assert = require('assert')
  , backend = require('backend')
  , Spy = require('minispy')
  , noop = function(){}

describe('link definition', function(){
  
  it('builds links by schema object', function(){
    var link = { rel: 'self', href: '/thing/{id}', mediaType: 'application/thing' };
    var expected = { rel: 'self', href: '/thing/123', mediaType: 'application/thing' };
    var subject = backend().link(link);
    var instance = {id: 123};
    var spy = Spy();
    subject.mediaType('application/thing', spy.watch.bind(spy));

    var built = subject(instance)
    built.self(noop);
    
    console.log('builds links by schema object: %o', spy.firstCall());
    assert( spy.calledWith( expected ) );
  })

  it('builds links by rel and href and mediaType', function(){
    var expected = { rel: 'update', href: '/thing/123', method: 'PUT', mediaType: 'some/thing' }
    var subject = backend().link('update', 'PUT /thing/{id}', 'some/thing');
    var instance = {id: 123};
    var spy = Spy();
    subject.mediaType('some/thing', spy.watch.bind(spy));

    subject(instance).update(noop);

    console.log('builds links by rel and href and mediaType: %o', spy.firstCall());
    assert( spy.calledWith( expected ) );
  })

  it('builds links by rel and href', function(){
    var expected = { rel: 'update', href: '/thing/123', method: 'PUT' }
    var subject = backend().link('update', 'PUT /thing/{id}');
    var instance = {id: 123};
    var spy = Spy();
    subject.mediaType('something/else', spy.watch.bind(spy));

    subject(instance).update(noop);

    console.log('builds links by rel and href: %o', spy.firstCall());
    assert( spy.calledWith( expected ) );
  })

  it('builds links by rel and href, method not given', function(){
    var expected = { rel: 'self', href: '/thing/123', method: 'GET' }
    var subject = backend().link('self', '/thing/{id}');
    var instance = {id: 123};
    var spy = Spy();
    subject.mediaType('something/else', spy.watch.bind(spy));

    subject(instance).self(noop);

    console.log('builds links by rel and href, method not given: %o', spy.firstCall());
    assert( spy.calledWith( expected ) );
  })

  it('builds static links when no instance', function(){
    var expected = { rel: 'create', href: '/thing', method: 'POST' }
    var subject = backend().link('create', 'POST /thing');
    var spy = Spy();
    subject.mediaType('whatever/plain', spy.watch.bind(spy));

    subject().create(noop);

    console.log('builds static links when no instance: %o', spy.firstCall());
    assert( spy.calledWith( expected ) );
  })

})

describe('mediaType definition', function(){

  it('binds to handler if mediaType explicitly given in link', function(){
    var subject = backend();
    var expected = {rel: 'list', href: '/things', mediaType: 'text/csv' };
    var instance = {};
    subject.link('list', 'GET /things')
           .link({rel: 'list', href: '/things', mediaType: 'text/csv' })

    var defaultSpy = Spy(), spy = Spy()
    subject.mediaType('application/json', defaultSpy.watch.bind(defaultSpy));
    subject.mediaType('text/csv', spy.watch.bind(spy));

    subject(instance).list({}, 'text/csv', noop);

    console.log('mediaType explicitly given in link: default: %o, spy: %o', 
                defaultSpy.firstCall(), spy.firstCall()
               );

    assert( spy.calledWith( expected ) );
    assert( defaultSpy.notCalled() );
  })

  it('binds to first handler if mediaType explicitly given in link but not in execution', function(){
    var subject = backend();
    var expected = {rel: 'list', href: '/things', mediaType: 'text/csv' };
    var instance = {};
    subject.link({rel: 'list', href: '/things', mediaType: 'text/csv' })
           .link('list', 'GET /things')

    var defaultSpy = Spy(), spy = Spy()
    subject.mediaType('application/json', defaultSpy.watch.bind(defaultSpy));
    subject.mediaType('text/csv', spy.watch.bind(spy));

    subject(instance).list(noop);

    console.log('mediaType explicitly given in link but not in execution: default: %o, spy: %o', 
                defaultSpy.firstCall(), spy.firstCall()
               );

    assert( spy.calledWith( expected ) );
    assert( defaultSpy.notCalled() );
  })


  it('binds to default handler if mediaType not explicitly given', function(){
    var subject = backend();
    var expected = {rel: 'list', href: '/things', method: 'GET' };
    var instance = {};
    subject.link('list', 'GET /things')
           .link({rel: 'list', href: '/things', mediaType: 'text/csv' })

    var defaultSpy = Spy(), spy = Spy()
    subject.mediaType('application/json', defaultSpy.watch.bind(defaultSpy));
    subject.mediaType('text/csv', spy.watch.bind(spy));

    subject(instance).list(noop);

    console.log('mediaType not explicitly given: default: %o, spy: %o', 
                defaultSpy.firstCall(), spy.firstCall()
               );

    assert( defaultSpy.calledWith( expected ) );
    assert( spy.notCalled() );
  })

  it('passes data to handler if given in execution', function(){
    var subject = backend();
    var expected = {rel: 'list', href: '/things', method: 'GET' };
    var data = { 'some': 'thing', 'passed': 'handler' }
    var instance = {};
    subject.link('list', 'GET /things')

    var spy = Spy()
    subject.mediaType('text/csv', spy.watch.bind(spy));

    subject(instance).list(data, noop);

    console.log('data given in execution: %o', spy.firstCall());

    assert( spy.calledWith( expected, data ) );
  })

})
