'use strict';

const PATH = require('path');
const {observable} = require('feliz');

class Tests extends Array { stream() { return observable.from(this); } }

const path = {root: PATH.join(__dirname, 'app')};
path.empty       = PATH.join(path.root, '00-empty');
path.routesEmpty = PATH.join(path.root, '01-routes-empty');
path.routesArray = PATH.join(path.root, '02-routes-array');
path.routes404   = PATH.join(path.root, '03-routes-404');
path.routesFile  = PATH.join(path.root, '04-routes-file');
path.routesDir   = PATH.join(path.root, '05-routes-dir');

const tests = module.exports = new Tests();

tests.push({
    desc: 'no route file is found',
    conf: { root:path.empty },
    pass: false
})
