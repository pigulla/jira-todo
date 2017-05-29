'use strict';

const fs = require('fs');

const expect = require('chai').expect;
const Promise = require('bluebird');
const nock = require('nock');
const tmp = require('tmp');
const streamBuffers = require('stream-buffers');

const test = require('../setup');

const Cli = test.requireSrc('cli/Cli');

function cli(proc) {
    return new Cli(proc).run();
}

describe('Integration for cli wrapper', function () {
    this.timeout(5000);
    this.slow(4000);

    function getProcessMock(args) {
        const argv = [
            '/usr/local/bin/node',
            __filename
        ].concat(args);

        return {
            argv,
            stdout: new streamBuffers.WritableStreamBuffer(),
            stderr: new streamBuffers.WritableStreamBuffer()
        };
    }

    describe('directs output properly', function () {
        it('when writing to a file and logging', function () {
            const tmpFile = tmp.fileSync();
            const proc = getProcessMock([
                '--logFormat', 'long',
                '--verbose', '--verbose', '--verbose',
                '--jiraUsername', 'myusername',
                '--jiraPassword', 'mypassword',
                '--jiraHost', 'jira.host.invalid',
                '--pattern', '**/fixtures/testing.empty.js',
                '--output', tmpFile.name
            ]);

            return cli(proc)
                .then(exitCode => expect(exitCode).to.equal(0))
                .then(function () {
                    expect(proc.stderr.getContents()).to.not.be.false;
                    expect(proc.stdout.getContents()).to.be.false;
                });
        });

        it('when writing to stdout and not logging', function () {
            const proc = getProcessMock([
                '--logFormat', 'null',
                '--withModules',
                '--jiraUsername', 'myusername',
                '--jiraPassword', 'mypassword',
                '--jiraHost', 'jira.host.invalid',
                '--jiraPort', '1234',
                '--pattern', '**/fixtures/testing.empty.js'
            ]);

            return cli(proc)
                .then(exitCode => expect(exitCode).to.equal(0))
                .then(function () {
                    expect(proc.stderr.getContents()).to.be.false;
                    expect(proc.stdout.getContents()).to.not.be.false;
                });
        });
    });

    describe('works', function () {
        afterEach(() => nock.cleanAll());

        it('for testing nothing', function () {
            const tmpFile = tmp.fileSync();
            const proc = getProcessMock([
                '--monochrome',
                '--logFormat', 'bunyan',
                '--verbose', '--verbose', '--verbose',
                '--jiraUsername', 'myusername',
                '--jiraPassword', 'mypassword',
                '--jiraHost', 'jira.host.invalid',
                '--pattern', '**/does-not-exist',
                '--projectsDefault', 'excluded',
                '--projectsFilter', 'PM',
                '--projectsFilter', 'ABC',
                '--issueStatusDefault', 'included',
                '--issueStatusFilter', '5',
                '--issueTypesDefault', 'excluded',
                '--issueTypesFilter', '2',
                '--issueTypesFilter', '3',
                '--issueTypesFilter', '4',
                '--format', 'json',
                '--output', tmpFile.name
            ]);

            return cli(proc)
                .then(exitCode => expect(exitCode).to.equal(0))
                .then(() => Promise.fromCallback(cb => fs.readFile(tmpFile.name, cb)))
                .then(contents => JSON.parse(contents.toString()))
                .then(result => expect(result).to.deep.equal([]));
        });

        it('for testing files that are ok', function () {
            const tmpFile = tmp.fileSync();
            const proc = getProcessMock([
                '--monochrome',
                '--logFormat', 'simple',
                '--verbose', '--verbose', '--verbose',
                '--jiraUsername', 'myusername',
                '--jiraPassword', 'mypassword',
                '--jiraHost', 'jira.host.invalid',
                '--pattern', '**/fixtures/index.js',
                '--projectsDefault', 'included',
                '--issueStatusDefault', 'included',
                '--issueTypesDefault', 'included',
                '--format', 'json',
                '--output', tmpFile.name
            ]);

            return cli(proc)
                .then(exitCode => expect(exitCode).to.equal(0))
                .then(() => Promise.fromCallback(cb => fs.readFile(tmpFile.name, cb)))
                .then(contents => JSON.parse(contents.toString()))
                .then(result => expect(result).to.deep.equal([
                    {
                        file: 'test/fixtures/index.js',
                        reports: []
                    }
                ]));
        });

        it('for testing.es5.js', function () {
            test.addIssueToNock('PM-42', {
                statusId: 5,
                statusName: 'Resolved',
                typeId: 2,
                typeName: 'Task'
            });
            test.addIssueToNock('PM-1234', {
                statusId: 2,
                statusName: 'In Progress',
                typeId: 4,
                typeName: 'Bug'
            });
            test.addIssueToNock('ABC-13', {
                statusId: 2,
                statusName: 'In Progress',
                typeId: 9,
                typeName: 'Story'
            });
            test.addIssueToNock('ABC-99', {
                statusId: 5,
                statusName: 'Resolved',
                typeId: 3,
                typeName: 'Subtask'
            });
            test.addIssueToNock('ABC-1000', {
                statusId: 1,
                statusName: 'Open',
                typeId: 9,
                typeName: 'Story'
            });
            test.addIssueToNock('X-99', {
                statusId: 1,
                statusName: 'Open',
                typeId: 3,
                typeName: 'Subtask'
            });
            test.addNotFoundIssueToNock('TK-4711');

            const tmpFile = tmp.fileSync();
            const proc = getProcessMock([
                '--monochrome',
                '--logFormat', 'short',
                '--includeValid',
                '--verbose', '--verbose', '--verbose',
                '--jiraUsername', 'myusername',
                '--jiraPassword', 'mypassword',
                '--jiraHost', 'jira.host.invalid',
                '--pattern', '**/testing.es5.js',
                '--projectsDefault', 'excluded',
                '--projectsFilter', 'PM',
                '--projectsFilter', 'ABC',
                '--issueStatusDefault', 'included',
                '--issueStatusFilter', '5',
                '--issueTypesDefault', 'excluded',
                '--issueTypesFilter', '2',
                '--issueTypesFilter', '3',
                '--issueTypesFilter', '4',
                '--format', 'json',
                '--output', tmpFile.name
            ]);

            return cli(proc)
                .then(exitCode => expect(exitCode).to.equal(1))
                .then(() => Promise.fromCallback(cb => fs.readFile(tmpFile.name, cb)))
                .then(contents => JSON.parse(contents.toString()))
                .then(function (result) {
                    expect(result).to.deep.equal([
                        {
                            reports: [
                                {
                                    valid: true,
                                    issue: 'PM-1234',
                                    column: 4,
                                    line: 7,
                                    message: 'Issue is valid'
                                },
                                {
                                    valid: false,
                                    issue: 'X-99',
                                    column: 4,
                                    line: 7,
                                    message: 'Project "X" is not allowed'
                                },
                                {
                                    valid: false,
                                    issue: 'PM-42',
                                    column: 4,
                                    line: 7,
                                    message: 'Status "Resolved" (id 5) is not allowed'
                                },
                                {
                                    valid: false,
                                    issue: 'TK-4711',
                                    column: 4,
                                    line: 9,
                                    message: 'Issue was not found'
                                },
                                {
                                    valid: false,
                                    issue: 'ABC-13',
                                    column: 8,
                                    line: 17,
                                    message: 'Type "Story" (id 9) is not allowed'
                                },
                                {
                                    valid: false,
                                    issue: 'ABC-99',
                                    column: 4,
                                    line: 21,
                                    message: 'Status "Resolved" (id 5) is not allowed'
                                },
                                {
                                    valid: false,
                                    issue: null,
                                    column: 4,
                                    line: 27,
                                    message: 'No issue key given'
                                },
                                {
                                    valid: false,
                                    issue: 'ABC-99',
                                    column: 4,
                                    line: 31,
                                    message: 'Status "Resolved" (id 5) is not allowed'
                                },
                                {
                                    valid: false,
                                    issue: 'ABC-1000',
                                    column: 4,
                                    line: 34,
                                    message: 'Type "Story" (id 9) is not allowed'
                                }
                            ],
                            'file': 'test/fixtures/testing.es5.js'
                        }
                    ]);
                });
        });

        it('for testing.es6.js', function () {
            test.addIssueToNock('PM-42', {
                statusId: 5,
                statusName: 'Resolved'
            });

            const tmpFile = tmp.fileSync();
            const proc = getProcessMock([
                '--monochrome',
                '--logFormat', 'long',
                '--verbose', '--verbose', '--verbose',
                '--jiraUsername', 'myusername',
                '--jiraPassword', 'mypassword',
                '--jiraHost', 'jira.host.invalid',
                '--pattern', '**/testing.es6.js',
                '--projectsDefault', 'included',
                '--issueStatusDefault', 'excluded',
                '--issueStatusFilter', '1',
                '--format', 'json',
                '--output', tmpFile.name
            ]);

            return cli(proc)
                .then(exitCode => expect(exitCode).to.equal(1))
                .then(() => Promise.fromCallback(cb => fs.readFile(tmpFile.name, cb)))
                .then(contents => JSON.parse(contents.toString()))
                .then(function (result) {
                    expect(result).to.deep.equal([
                        {
                            reports: [
                                {
                                    valid: false,
                                    issue: 'PM-42',
                                    column: 4,
                                    line: 6,
                                    message: 'Status "Resolved" (id 5) is not allowed'
                                }
                            ],
                            file: 'test/fixtures/testing.es6.js'
                        }
                    ]);
                });
        });

        it('for testing.es8.js', function () {
            test.addIssueToNock('PM-42', {
                statusId: 5,
                statusName: 'Resolved'
            });

            const tmpFile = tmp.fileSync();
            const proc = getProcessMock([
                '--monochrome',
                '--logFormat', 'long',
                '--verbose', '--verbose', '--verbose',
                '--jiraUsername', 'myusername',
                '--jiraPassword', 'mypassword',
                '--jiraHost', 'jira.host.invalid',
                '--pattern', '**/testing.es8.js',
                '--ecmaVersion', '8',
                '--projectsDefault', 'included',
                '--issueStatusDefault', 'excluded',
                '--issueStatusFilter', '1',
                '--format', 'json',
                '--output', tmpFile.name
            ]);

            return cli(proc)
                .then(exitCode => expect(exitCode).to.equal(1))
                .then(() => Promise.fromCallback(cb => fs.readFile(tmpFile.name, cb)))
                .then(contents => JSON.parse(contents.toString()))
                .then(function (result) {
                    expect(result).to.deep.equal([
                        {
                            reports: [
                                {
                                    valid: false,
                                    issue: 'PM-42',
                                    column: 4,
                                    line: 12,
                                    message: 'Status "Resolved" (id 5) is not allowed'
                                }
                            ],
                            file: 'test/fixtures/testing.es8.js'
                        }
                    ]);
                });
        });
    });
});
