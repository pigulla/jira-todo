'use strict';

const assert = require('assert-plus');
const XRegExp = require('xregexp');

const mergeMaps = require('./merge-maps');
const extractComments = require('./extract-comments');
const extractTodos = require('./extract-todos');

/**
 * Parse a source string, find all comments that match the given todoPattern and extract the issues referenced by the
 * issuePattern. If a comment contains no todos, it is ignored.
 *
 * @param {string} source
 * @param {string} todoPattern
 * @param {string} issuePattern
 * @param {Object} parserOptions
 * @return {jt.Result}
 */
module.exports = function analyze(source, todoPattern, issuePattern, parserOptions) {
    assert.string(source, 'source');
    assert.string(todoPattern, 'todoPattern');
    assert.string(issuePattern, 'issuePattern');
    assert.object(parserOptions, 'parserOptions');

    const todoRegex = XRegExp.cache(todoPattern, 'gi');
    const issueRegex = XRegExp.cache(issuePattern, 'gi');

    const issueMaps = [];
    const comments = extractComments(source, parserOptions)
        .map(function (comment) {
            /** @type {{ todos: Array.<jt.Todo>, issues: Map.<string, jt.Issue> }} */
            const data = extractTodos(comment.value, todoRegex, issueRegex);

            issueMaps.push(data.issues);
            return Object.assign(comment, { todos: data.todos });
        }, this)
        .filter(comment => comment.todos.length > 0);

    return {
        comments,
        issues: mergeMaps(issueMaps)
    };
};
