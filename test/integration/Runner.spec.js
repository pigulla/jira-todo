'use strict';

const expect = require('chai').expect;
const nock = require('nock');
const Glob = require('glob').Glob;
const streamBuffers = require('stream-buffers');

const test = require('../setup');

const JsonFormatter = test.requireSrc('formatter/Json');
const JiraTodo = test.requireSrc('JiraTodo');
const runner = test.requireSrc('cli/Runner');

describe('Integration test for cli runner', function () {
    this.timeout(4000);
    this.slow(2000);

    afterEach(() => nock.cleanAll());

    it('works', function () {
        test.addIssueToNock('PM-42', { statusId: 5, statusName: 'Resolved', typeId: 3, typeName: 'Task' });

        const glob = new Glob('../fixtures/testing.es6.js', { cwd: __dirname });
        const logger = test.nullLogger();
        const stream = new streamBuffers.WritableStreamBuffer();
        const jsonFormatter = new JsonFormatter(stream);

        const jt = new JiraTodo({
            logger,
            allowTodosWithoutIssues: false,
            processor: {
                keywords: [],
                connector: {
                    host: 'jira.host.invalid',
                    protocol: 'https',
                    basic_auth: {
                        username: 'myusername',
                        password: 'mypassword'
                    }
                },
                parserOptions: {
                    ecmaVersion: 6,
                    sourceType: 'module',
                    ecmaFeatures: {
                        jsx: false,
                        impliedStrict: false,
                        globalReturn: false,
                        experimentalObjectRestSpread: false
                    }
                }
            },
            validator: {
                projects: {
                    default: 'excluded',
                    filter: ['PM']
                },
                issueTypes: {
                    default: 'excluded',
                    filter: []
                },
                issueStatus: {
                    default: 'excluded',
                    filter: []
                }
            }
        });

        return runner(glob, jt, jsonFormatter)
            .then(function (errorCount) {
                const result = JSON.parse(stream.getContents());

                expect(errorCount).to.deep.equal({ files: 1, errors: 1 });
                expect(result).to.deep.equal([
                    {
                        file: '../fixtures/testing.es6.js',
                        errors: [
                            {
                                issue: 'PM-42',
                                message: 'Type "Task" (id 3) is not allowed',
                                line: 6,
                                column: 4
                            }
                        ]
                    }
                ]);
            });
    });
});
