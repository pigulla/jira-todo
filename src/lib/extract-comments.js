'use strict';

const assert = require('assert-plus');
const espree = require('espree');

const ESPREE_OPTIONS = {
    range: true,
    loc: true,
    comments: true,
    attachComment: true
};

/**
 * Extract all comments from the given source.
 *
 * @param {string} source
 * @param {Object} parserOptions
 * @return {Array.<jt.Comment>}
 */
module.exports = function extractComments(source, parserOptions) {
    assert.string(source, 'source');
    assert.object(parserOptions, 'parserOptions');
    assert.string(parserOptions.sourceType, 'parserOptions.sourceType');
    assert.finite(parserOptions.ecmaVersion, 'parserOptions.ecmaVersion');
    assert.object(parserOptions.ecmaFeatures, 'parserOptions.ecmaFeatures');

    const src = source.replace(/^#!([^\r\n]+)/, (match, captured) => `//${captured}`);
    const options = Object.assign({}, ESPREE_OPTIONS, {
        sourceType: parserOptions.sourceType,
        ecmaVersion: parserOptions.ecmaVersion,
        ecmaFeatures: parserOptions.ecmaFeatures
    });
    const ast = espree.parse(src, options);

    return ast.comments.map(comment => ({
        line: comment.loc.start.line,
        column: comment.loc.start.column,
        value: comment.value
    }));
};
