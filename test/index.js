'use strict';

const Tape  = require('tape');
const Feliz = require('feliz');
const Observable = Feliz.observable;

const Router = require('../lib/router');
const tests = require('./cases');

Tape('The returned feliz observable', t => {
    const onInstance = test => {
        const t1 = test.out instanceof Error;
        const t2 = test.out.constructor.name === 'Feliz';
        const m1 = `should ${test.pass? 'not':''} stream error when ${test.desc}`;
        const m2 = `should ${test.pass? '':'not'} resolve to instance when ${test.desc}`;
        if (test.pass){
            // should not stream errors and return a feliz instance
            t.equal(t1, false, m1);
            t.equal(t2, true, m2);
            // unexpected error
            if (t1 !== false) console.log(test.out);
        } else {
            // should stream and error and not return a feliz instance
            t.equal(t1, true, m1);
            t.equal(t2, false, m2);
            // unexpected instance
            if (t1 !== true) console.log(test.out.conf);
        }
        if (test.cbak) test.cbak(t, test);
    };
    const onError = error => {
        t.fail('should never show this message while testing');
        console.log(error);
    };
    const onEnd = () => t.end();
    const tests$ = tests
        .stream()
        .concatMap(test => (new Feliz(Object.assign({plugins:[Router]}, test.conf)))
            .map(feliz => Object.assign({out:feliz}, test))
            .catch(error => Observable.of(Object.assign({out: error}, test)))
        )
        .subscribe(onInstance, onError, onEnd);
});
