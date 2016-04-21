'use strict';

const assert = require('assert-plus');
const XRegExp = require('xregexp');

/**
 * Parse a string using the given regular expressions and return all found todos and the issues referenced within.
 *
 * @param {string} string
 * @param {XRegExp} todoRegex
 * @param {XRegExp} issueRegex
 * @return {{ todos: Array.<jt.Todo>, issues: Map.<string, jt.Issue> }}
 */
module.exports = function extractTodos(string, todoRegex, issueRegex) {
    assert.string(string, 'string');
    assert.object(todoRegex, 'todoRegex');
    assert.object(issueRegex, 'issueRegex');

    /**
     * Returns all todos from the given string along with the keyword that triggered the match.
     *
     * @param {string} str
     * @return {{ keyword: string, text: string }}
     */
    function getTodosFromString(str) {
        const result = [];

        XRegExp.forEach(str, todoRegex, match => result.push({
            keyword: match.keyword,
            text: match.text
        }));

        return result;
    }

    /**
     * Returns all the issues referenced in the given string.
     *
     * @param {string} string
     * @param {Map.<string, jt.Issue>} issues
     * @return {Set.<string>}
     */
    function parseIssuesFromString(string, issues) {
        const result = new Set();

        XRegExp.forEach(string, issueRegex, function (match) {
            result.add(match.key);
            issues.set(match.key, {
                key: match.key,
                project: match.project,
                number: parseInt(match.number, 10),
                status: null
            });
        });

        return result;
    }

    const allIssues = new Map();
    const todos = getTodosFromString(string);
    todos.forEach(todo => todo.issues = parseIssuesFromString(todo.text, allIssues));
    
    return { todos, issues: allIssues };
};