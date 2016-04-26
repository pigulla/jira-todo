'use strict';

const fs = require('fs');

module.exports = {
    empty: fs.readFileSync(`${__dirname}/testing.empty.js`).toString(),
    es5: fs.readFileSync(`${__dirname}/testing.es5.js`).toString(),
    es6: fs.readFileSync(`${__dirname}/testing.es6.js`).toString(),
    jsx: fs.readFileSync(`${__dirname}/testing.jsx.js`).toString()
};