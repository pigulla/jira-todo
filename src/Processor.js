'use strict';

const assert = require('assert-plus');
const Promise = require('bluebird');
const JiraConnector = require('jira-connector');

const analyze = require('./lib/analyze');
const getStatus = require('./lib/get-status');

/**
 * @class jt.Processor
 */
class Processor {
    /**
     * @param {Object} options
     * @param {Object} options.connector
     * @param {string} options.todoPattern
     * @param {string} options.issuePattern
     * @param {Bunyan} logger
     */
    constructor(options, logger) {
        assert.object(options, 'options');
        assert.object(logger, 'logger');

        this._logger = logger;
        this._opts = options;
        this._connector = new JiraConnector(this._opts.connector);
        this._cache = new Map();
    }

    /**
     * @private
     * @param {Set.<string>} keys
     * @return {Promise}
     */
    _fetchIntoCache(keys) {
        const uncached = Array.from(keys).filter(key => !this._cache.has(key));
        const resolvers = new Map();

        // Add new promises for each issue not already in the cache
        uncached.forEach(key => this._cache.set(key, new Promise(resolve => resolvers.set(key, resolve))));

        // Construct the promise that the client of the function needs to wait for
        const clientPromise = Promise.all(Array.from(keys).map(key => this._cache.get(key)));

        // Exit early if there's nothing to do
        if (uncached.length === 0) {
            return clientPromise;
        }

        this._logger.trace(`Requesting Jira status for issue(s) ${uncached.join(', ')}`);
        return getStatus(this._connector, new Set(uncached))
            .bind(this)
            .then(function (statuses) {
                this._logger.trace(`Received status for ${Array.from(statuses.keys()).join(', ')}`);
                statuses.forEach(function (status, key) {
                    resolvers.get(key)(status);
                    resolvers.delete(key);
                }, this);
                return clientPromise;
            });
    }

    /**
     * Process the given input.
     *
     * @param {string} input
     * @return {Promise.<jt.Result>}
     */
    process(input) {
        assert.string(input, 'input');

        let result;

        return Promise
            .try(() => analyze(input, this._opts.todoPattern, this._opts.issuePattern))
            .bind(this)
            .then(function (commentsAndIssues) {
                result = commentsAndIssues;
                const issueKeys = new Set(commentsAndIssues.issues.keys());
                return this._fetchIntoCache(issueKeys);
            })
            .then(function () {
                result.issues.forEach(function (issue, issueKey, map) {
                    map.get(issueKey).status = this._cache.get(issueKey).value();
                }, this);
                return result;
            });
    }

    /**
     * Process a comment and add all found issue keys (and the objects referenced by them) to the given data structures.
     *
     * @private
     * @param {Object} comment
     * @param {Set.<string>} issueKeys
     */
    _processComment(comment, issueKeys) {
        comment.todos.forEach(function (todo) {
            todo.issues.forEach(issue => issueKeys.add(issue.key));
        });
    }
}

module.exports = Processor;