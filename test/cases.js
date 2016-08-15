'use strict';

const PATH = require('path');
const {observable} = require('feliz');

class Tests extends Array { stream() { return observable.from(this); } }

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

const tests = module.exports = new Tests();

tests.push({
    desc: 'no route file is found',
    conf: { root:path.empty },
    pass: false
});

tests.push({
    desc: 'an empty route file is found',
    conf: { root:path.routesEmpty },
    pass: true
});

tests.push({
    desc: 'an non-object is used as routes',
    conf: { root: path.routesArray },
    pass: false
});

tests.push({
    desc: 'an unexisting bundle is declared',
    conf: { root: path.bundle404 },
    pass: false
});

tests.push({
    desc: 'an existent invalid bundle (file) is declared',
    conf: { root: path.bundleFileEmpty },
    pass: false
});

tests.push({
    desc: 'an existent valid bundle (file) is declared',
    conf: { root: path.bundleFile },
    pass: true
});

tests.push({
    desc: 'an existent invalid bundle bundle (dir) is declared',
    conf: { root: path.bundleDirEmpty },
    pass: false
});

tests.push({
    desc: 'an existent valid bundle (dir) is declared',
    conf: { root: path.bundleDir },
    pass: true
});

tests.push({
    desc: 'an existent valid bundle with invalid method is declared',
    conf: { root: path.methodInvalid },
    pass: false
});

tests.push({
    desc: 'an existent valid bundle with unknown method is declared',
    conf: { root: path.methodUnknown },
    pass: false
});
