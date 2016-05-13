'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const http = require('http-status');

const test = require('../../setup');

const getStatus = test.requireSrc('lib/get-status');

describe('getStatus', function () {
    function makeIssueObject(options) {
        return {
            fields: {
                issuetype: {
                    id: String(options.typeId),
                    name: 'Defect'
                },
                status: {
                    id: String(options.statusId),
                    name: 'b0rked'
                }
            }
        };
    }

    it('honors concurrency setting', function (done) {
        const requests = new Map();
        const getIssue = sinon.spy(function (query, callback) {
            requests.set(query.issueKey, function () {
                requests.delete(query.issueKey);
                callback(null, makeIssueObject({ typeId: 1, statusId: 1 }), { statusCode: http.OK });
            });
        });
        const connectorStub = { issue: { getIssue } };

        getStatus(connectorStub, new Set(['PM-1', 'PM-2', 'PM-3', 'PM-4', 'PM-5', 'PM-6']))
            .then(result => done());

        expect(Array.from(requests.keys())).to.deep.equal(['PM-1', 'PM-2', 'PM-3', 'PM-4', 'PM-5']);
        requests.get('PM-2')();
        expect(Array.from(requests.keys())).to.deep.equal(['PM-1', 'PM-3', 'PM-4', 'PM-5', 'PM-6']);
        requests.get('PM-1')();
        requests.get('PM-3')();
        expect(Array.from(requests.keys())).to.deep.equal(['PM-4', 'PM-5', 'PM-6']);
        requests.get('PM-4')();
        requests.get('PM-5')();
        requests.get('PM-6')();
    });

    describe('with stubbed connector.getIssue', function () {
        const getIssue = sinon.stub();
        const connectorStub = {
            issue: { getIssue }
        };

        beforeEach(() => getIssue.reset());

        function run(keys) {
            return getStatus(connectorStub, new Set(keys), 1);
        }

        it('success', function () {
            getIssue.yields(null, makeIssueObject({ typeId: 42, statusId: 13 }));

            return run(['ABC-42'])
                .tap(result => expect(result).to.be.instanceof(Map))
                .then(test.objectify)
                .then(function (result) {
                    expect(getIssue).to.have.been.calledWith(sinon.match({ issueKey: 'ABC-42' }), sinon.match.func);
                    expect(result).to.deep.equal({
                        'ABC-42': {
                            typeId: 42,
                            typeName: 'Defect',
                            statusId: 13,
                            statusName: 'b0rked'
                        }
                    });
                });
        });

        it('getaddrinfo error', function () {
            const error = Object.assign(new Error('getaddrinfo ENOTFOUND host.invalid host.invalid:443'), {
                code: 'ENOTFOUND',
                errno: 'ENOTFOUND',
                syscall: 'getaddrinfo',
                hostname: 'host.invalid',
                host: 'host.invalid',
                port: '443'
            });

            getIssue.yields(error, null, null);
            return expect(run(['ABC-42'])).to.eventually.be.rejected;
        });

        it('HTTP error', function () {
            getIssue.yields(
                new Error('Request failed'),
                null,
                { statusCode: http.BAD_REQUEST, statusMessage: 'Bad Request' }
            );
            return expect(run(['ABC-42'])).to.eventually.be.rejected;
        });

        it('no data returned', function () {
            getIssue.yields(
                null,
                undefined,
                { statusCode: http.OK, statusMessage: 'OK' }
            );
            return expect(run(['ABC-42'])).to.eventually.be.rejected;
        });

        it('not found', function () {
            getIssue.yields(
                new Error('Request failed'),
                null,
                { statusCode: http.NOT_FOUND, statusMessage: 'Bad Request' }
            );
            return run(['ABC-42'])
                .tap(result => expect(result).to.be.instanceof(Map))
                .then(test.objectify)
                .then(function (result) {
                    expect(result).to.deep.equal({
                        'ABC-42': null
                    });
                });
        });

        it('successes and errors mixed', function () {
            getIssue
                .withArgs(sinon.match({ issueKey: 'ABC-XX' }), sinon.match.func)
                .yields(new Error('Request failed'), null, { statusCode: 400, statusMessage: 'Bad Request' });
            getIssue
                .withArgs(sinon.match({ issueKey: 'ABC-42' }), sinon.match.func)
                .yields(null, makeIssueObject({ typeId: 42, statusId: 13 }));

            return expect(run(['ABC-42', 'ABC-XX'])).to.eventually.be.rejected;
        });
    });
});