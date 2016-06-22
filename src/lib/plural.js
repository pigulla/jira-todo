'use strict';

const assert = require('assert-plus');

/**
 * Return the singular or plural form depending on the given number.
 * Intended for english only (or languages with identical semantics with respect to plural forms).
 *
 * @param {string} singulerForm
 * @param {string} pluralForm
 * @param {number} n
 * @return {string}
 */
module.exports = function plural(singulerForm, pluralForm, n) {
    assert.string(singulerForm, 'singular');
    assert.string(pluralForm, 'plural');
    assert.finite(n, 'n');

    return n === 1 ? singulerForm : pluralForm;
};
