'use strict';

const Tape  = require('tape');
const Feliz = require('feliz');

const router     = require('../lib/router');
const tests      = require('./cases');
const observable = Feliz.observable;

const Conf = {
    plugins: [router],
    // Tape executable (mainModule) doesn't have an extension,
    // So feliz doesn't get one by default. fixed it.
    path : { ext: { type:'extname', args:[__filename] } }
};

Tape('The returned feliz observable', t => {

    const test$ = tests.stream().concatMap(test => {
        const conf = Object.assign({}, test.conf, Conf);
        const feliz$ =  new Feliz(conf);

        return feliz$
            .catch(err => observable.of(err))
            .map(out => Object.assign({out}, test))
    });

    test$.subscribe(onInstance, onError, () => t.end());

    function onInstance(test){
        const t1 = test.out instanceof Error;
        const t2 = test.out.constructor.name === 'Feliz';
        const m1 = `should ${test.pass? 'not':''} stream error when ${test.desc}`;
        const m2 = `should ${test.pass? '':'not'} resolve to instance when ${test.desc}`;
        if (test.pass){
            // should not stream errors and return a feliz instance
            t.equal(t1, false, m1);
            t.equal(t2, true, m2);
            // unexpected error
            if (t1 !== false) console.error(test.out);
        } else {
            // should stream and error and not return a feliz instance
            t.equal(t1, true, m1);
            t.equal(t2, false, m2);
        }
        if (test.cbak) test.cbak(t, test);
    };

    function onError(error){
        t.fail('should never show this message while testing');
        console.error(error);
    };
});
