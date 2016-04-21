'use strict';

const fs = require('fs');

module.exports = {
    es5: fs.readFileSync(`${__dirname}/testing.es5.js`).toString(),
    es6: fs.readFileSync(`${__dirname}/testing.es6.js`).toString(),
    jsx: fs.readFileSync(`${__dirname}/testing.jsx.js`).toString()
};