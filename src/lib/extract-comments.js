'use strict';

const espree = require('espree');

const ESPREE_OPTIONS = {
    range: true,
    loc: true,
    comments: true,
    attachComment: true,
    ecmaVersion: 6,
    ecmaFeatures: {
        jsx: true,
        impliedStrict: true
    }
};

/**
 * Extract all comments from the given source.
 *
 * @param {string} source
 * @return {Array.<jt.Comment>}
 */
module.exports = function extractComments(source) {
    const ast = espree.parse(source, ESPREE_OPTIONS);

    return ast.comments.map(comment => ({
        line: comment.loc.start.line,
        column: comment.loc.start.column,
        value: comment.value
    }));
};