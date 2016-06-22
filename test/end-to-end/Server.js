'use strict';

const path = require('path');
const glob = require('glob');
const restify = require('restify');
const Promise = require('bluebird');
const status = require('http-status');

const responsesDir = path.join(__dirname, 'responses');
const responseFiles = glob.sync('*.json', {
    cwd: responsesDir,
    nodir: true
});

const USERNAME = 'myuser';
const PASSWORD = 'mypass';
const AUTH_HASH = new Buffer(`${USERNAME}:${PASSWORD}`).toString('base64');
const BASIC_AUTH_HEADER = `Basic ${AUTH_HASH}`;

/* eslint-disable global-require */
module.exports = function createServer(port) {
    const server = restify.createServer();

    const responses = responseFiles.reduce(function (map, file) {
        const issueKey = path.basename(file, '.json');
        const response = require(path.join(responsesDir, file));

        return map.set(issueKey, response);
    }, new Map());

    server.get({ path: '/rest/api/2/issue/:issueKey' }, function (request, response, next) {
        if (request.headers.authorization !== BASIC_AUTH_HEADER) {
            return next(new restify.errors.UnauthorizedError());
        }

        if (!responses.has(request.params.issueKey)) {
            return next(new restify.errors.NotFoundError());
        }

        response.send(status.OK, responses.get(request.params.issueKey));
        return next();
    });

    return Promise
        .fromCallback(cb => server.listen(port, cb))
        .return(server);
};
