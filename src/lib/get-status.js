'use strict';

const assert = require('assert-plus');
const async = require('async');
const http = require('http-status');
const Promise = require('bluebird');

const DEFAULT_CONCURRENCY = 5;

/**
 * @param {JiraConnector} jiraConnector
 * @param {string} issueKey
 * @param {function(?Error, jt.IssueStatus)} cb
 */
function getSingleStatus(jiraConnector, issueKey, cb) {
    assert.object(jiraConnector, 'jiraConnector');
    assert.string(issueKey, 'issueKey');
    assert.func(cb, 'cb');

    const query = {
        issueKey,
        fields: ['status', 'issuetype']
    };

    jiraConnector.issue.getIssue(query, function (error, result, response) {
        if (error) {
            if (!response) {
                const msg = `Request to Jira server for issue ${issueKey} failed: ${error.message}`;
                return cb(null, new Error(msg));
            } else if (response.statusCode === http.NOT_FOUND) {
                return cb(null, { issueKey, data: null });
            } else {
                const msg = `Request to Jira server for issue ${issueKey} failed ` +
                    `with status code ${response.statusCode} (${response.statusMessage})`;
                return cb(null, new Error(msg));
            }
        }

        if (!result) {
            const msg = `Request to Jira server returned no data. Maybe you are lacking permissions?`;
            return cb(null, new Error(msg));
        }

        cb(null, {
            issueKey,
            data: {
                typeId: parseInt(result.fields.issuetype.id, 10),
                typeName: result.fields.issuetype.name,
                statusId: parseInt(result.fields.status.id, 10),
                statusName: result.fields.status.name
            }
        });
    });
}

/**
 * Retrieve the status of the given Jira issues.
 *
 * @param {JiraConnector} jiraConnector
 * @param {Set.<string>} issueKeys
 * @param {number=} concurrency
 * @return {Promise.<Map.<string, jt.IssueStatus>>}
 */
module.exports = function getStatus(jiraConnector, issueKeys, concurrency) {
    assert.object(jiraConnector, 'jiraConnector');
    assert.ok(issueKeys instanceof Set, 'issueKeys must be a set of strings');
    assert.optionalFinite(concurrency, 'concurrency');
    
    const limit = arguments.length < 3 ? DEFAULT_CONCURRENCY : concurrency;
    const keys = Array.from(issueKeys);

    return Promise
        .fromCallback(cb => async.mapLimit(keys, limit, getSingleStatus.bind(null, jiraConnector), cb))
        .each(function (result) {
            if (result instanceof Error) {
                throw result;
            }
        })
        .reduce((map, result) => map.set(result.issueKey, result.data), new Map());
};