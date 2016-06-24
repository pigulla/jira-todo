'use strict';

const util = require('util');

const assert = require('assert-plus');
const Promise = require('bluebird');
const JiraConnector = require('jira-connector');
const XRegExp = require('xregexp');

const analyze = require('./lib/analyze');
const getStatus = require('./lib/get-status');

/**
 * @class jt.Processor
 */
class Processor {
    /**
     * @param {Object} options
     * @param {Object} options.connector
     * @param {Array.<string>} options.keywords
     * @param {Object} options.parserOptions
     * @param {Bunyan} logger
     */
    constructor(options, logger) {
        assert.object(options, 'options');
        assert.object(logger, 'logger');
        assert.object(options.connector, 'options.connector');
        assert.object(options.parserOptions, 'options.parserOptions');
        assert.arrayOfString(options.keywords, 'options.keywords');

        this._logger = logger;
        this._connector = new JiraConnector(options.connector);
        this._cache = new Map();

        const asUser = options.connector.basic_auth ?
            `as user "${options.connector.basic_auth.username}"` :
            'anonymously';

        this._logger.debug(
            `Connecting ${asUser} to Jira at ` +
            `${options.connector.protocol}://${options.connector.host}:${options.connector.port}`
        );

        this._parserOptions = options.parserOptions;
        this._issuePattern = Processor.ISSUE_PATTERN;
        this._todoPattern = util.format(
            Processor.TODO_PATTERN_TEMPLATE,
            options.keywords.map(keyword => XRegExp.escape(keyword)).join('|')
        );
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

        this._logger.trace(`Requesting Jira data for issue(s) ${uncached.join(', ')}`);
        return getStatus(this._connector, new Set(uncached))
            .bind(this)
            .then(function (result) {
                this._logger.trace(`Received data for ${Array.from(result.keys()).join(', ')}`);
                result.forEach(function (data, key) {
                    if (data) {
                        this._logger.trace(
                            `Status for ${key} (${data.typeName}) is ${data.statusId} (${data.statusName})`
                        );
                    } else {
                        this._logger.trace(`Issue ${key} was not found`);
                    }
                    resolvers.get(key)(data);
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
            .try(() => analyze(input, this._todoPattern, this._issuePattern, this._parserOptions))
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
            })
            .then(() => result);
    }
}

Processor.ISSUE_PATTERN = '(?<key>(?<project>[A-Z][_A-Z0-9]*)-(?<number>\\d+))';
Processor.TODO_PATTERN_TEMPLATE = '(?:^|\\*|\\s|@)(?<keyword>%s)(?:(?:!|:|\\s)(?<text>.+))?';

module.exports = Processor;
