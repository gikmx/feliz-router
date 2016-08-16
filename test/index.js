'use strict';

const PATH = require('path');
const Test = require('feliz.test');
const Router = require('../lib/router');

const path           = {root: PATH.join(__dirname, 'app')};
path.empty           = PATH.join(path.root, 'empty');
path.routesEmpty     = PATH.join(path.root, 'routes-empty');
path.routesArray     = PATH.join(path.root, 'routes-array');
path.bundle404       = PATH.join(path.root, 'bundle-404');
path.bundleFile      = PATH.join(path.root, 'bundle-file');
path.bundleFileEmpty = PATH.join(path.root, 'bundle-file-empty');
path.bundleDir       = PATH.join(path.root, 'bundle-dir');
path.bundleDirEmpty  = PATH.join(path.root, 'bundle-dir-empty');
path.methodInvalid   = PATH.join(path.root, 'method-invalid');
path.methodUnknown   = PATH.join(path.root, 'method-unknown');

const conf = {
    plugins: [Router]
};

const test$ = Test([{
    desc : 'The feliz instance when using the router plugin',
    data : [
        {
            desc: 'no route file is found',
            conf: Object.assign({ root:path.empty }, conf),
            pass: false
        },
        {
            desc: 'an empty route file is found',
            conf: Object.assign({ root:path.routesEmpty }, conf),
            pass: true
        },
        {
            desc: 'an non-object is used as routes',
            conf: Object.assign({ root: path.routesArray }, conf),
            pass: false
        },
        {
            desc: 'an unexisting bundle is declared',
            conf: Object.assign({ root: path.bundle404 }, conf),
            pass: false
        },
        {
            desc: 'an existent invalid bundle (file) is declared',
            conf: Object.assign({ root: path.bundleFileEmpty }, conf),
            pass: false
        },
        {
            desc: 'an existent valid bundle (file) is declared',
            conf: Object.assign({ root: path.bundleFile }, conf),
            pass: true
        },
        {
            desc: 'an existent invalid bundle bundle (dir) is declared',
            conf: Object.assign({ root: path.bundleDirEmpty }, conf),
            pass: false
        },
        {
            desc: 'an existent valid bundle (dir) is declared',
            conf: Object.assign({ root: path.bundleDir }, conf),
            pass: true
        },
        {
            desc: 'an existent valid bundle with invalid method is declared',
            conf: Object.assign({ root: path.methodInvalid }, conf),
            pass: false
        },
        {
            desc: 'an existent valid bundle with unknown method is declared',
            conf: Object.assign({ root: path.methodUnknown }, conf),
            pass: false
        }
    ]
}]);

test$.subscribe();
