'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Promise = require('bluebird');

const test = require('../setup');
const Formatter = test.requireSrc('formatter/Formatter');

const process = sinon.stub();
const validate = sinon.stub();
const Processor = sinon.stub().returns({ process });
const Validator = sinon.stub().returns({ validate });

const JiraTodo = test.proxyquireSrc('JiraTodo', {
    './Processor': Processor,
    './Validator': Validator
});

describe('JiraTodo', function () {
    const formatter = sinon.stub(new Formatter());
    let options;

    beforeEach(function () {
        process.reset();
        validate.reset();

        options = {
            logger: test.nullLogger(),
            allowTodosWithoutIssues: false,
            includeValid: false,
            processor: {
                keywords: ['todo'],
                connector: {
                    host: 'jira.host.invalid',
                    protocol: 'https',
                    username: 'myuser',
                    password: 'mypass'
                }
            },
            validator: {
                projects: {
                    default: 'excluded',
                    filter: []
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
        };
    });

    describe('constructor', function () {
        it('fails with invalid options', function () {
            expect(() => new JiraTodo({})).to.throw(Error);
        });

        it('succeeds with valid options', function () {
            expect(() => new JiraTodo(options)).not.to.throw(Error);

            expect(Processor).to.have.been.calledOnce
                .and.to.have.been.calledWithNew;
            expect(Validator).to.have.been.calledOnce
                .and.to.have.been.calledWithNew;
        });
    });

    describe('runs', function () {
        it('for no data', function () {
            const jt = new JiraTodo(options);

            process.returns(Promise.resolve({
                comments: [],
                issues: new Map()
            }));

            return jt.run('source', 'example.js', formatter)
                .then(function (result) {
                    expect(validate).not.to.have.been.called;
                    expect(process).to.have.been.calledOnce
                        .and.to.have.been.calledWithExactly('source');
                    expect(result).to.deep.equal([]);
                });
        });

        describe('for data', function () {
            beforeEach(function () {
                validate.withArgs(sinon.match({ key: 'PM-38' })).returns('Some error');
                validate.withArgs(sinon.match({ key: 'PM-42' })).returns('Some other error');
                validate.withArgs(sinon.match({ key: 'PM-99' })).returns(null);

                process.returns(Promise.resolve({
                    comments: [
                        {
                            line: 13,
                            column: 4,
                            value: '// TODO PM-38: fix it',
                            todos: [
                                {
                                    keyword: 'TODO',
                                    text: ' PM-38: fix it',
                                    issues: new Set(['PM-38'])
                                }
                            ]
                        },

                        {
                            line: 42,
                            column: 2,
                            value: '//FIXME: in PM-42',
                            todos: [
                                {
                                    keyword: 'FIXME',
                                    text: ' in PM-42',
                                    issues: new Set(['PM-42'])
                                }
                            ]
                        },
                        {
                            line: 99,
                            column: 1,
                            value: '// FIXME',
                            todos: [
                                {
                                    keyword: 'FIXME',
                                    text: ' ',
                                    issues: new Set()
                                }
                            ]
                        },
                        {
                            line: 113,
                            column: 1,
                            value: '// @TODO: fix in PM-99!',
                            todos: [
                                {
                                    keyword: 'TODO',
                                    text: ' fix in PM-99!',
                                    issues: new Set(['PM-99'])
                                }
                            ]
                        }
                    ],
                    issues: new Map([
                        ['PM-42', {
                            key: 'PM-42',
                            project: 'PM',
                            number: 42,
                            status: {
                                typeId: 3,
                                typeName: 'Task',
                                statusId: 1,
                                statusName: 'Open'
                            }
                        }],
                        ['PM-38', {
                            key: 'PM-38',
                            project: 'PM',
                            number: 38,
                            status: {
                                typeId: 4,
                                typeName: 'Story',
                                statusId: 2,
                                statusName: 'In Progress'
                            }
                        }],
                        ['PM-99', {
                            key: 'PM-99',
                            project: 'PM',
                            number: 99,
                            status: {
                                typeId: 1,
                                typeName: 'Task',
                                statusId: 1,
                                statusName: 'Open'
                            }
                        }]
                    ])
                }));
            });

            it('and todos without issues forbidden, including valid issues', function () {
                options.includeValid = true;

                const jt = new JiraTodo(options);

                return jt.run('source', 'example.js', formatter)
                    .then(function (result) {
                        expect(validate).callCount(3);
                        expect(process).to.have.been.calledOnce
                            .and.to.have.been.calledWithExactly('source');
                        expect(result).to.deep.equal([
                            {
                                valid: false,
                                issue: 'PM-38',
                                message: 'Some error',
                                line: 13,
                                column: 4
                            },
                            {
                                valid: false,
                                issue: 'PM-42',
                                message: 'Some other error',
                                line: 42,
                                column: 2
                            },
                            {
                                valid: false,
                                issue: null,
                                message: 'No issue key given',
                                line: 99,
                                column: 1
                            },
                            {
                                valid: true,
                                issue: 'PM-99',
                                message: 'Issue is valid',
                                line: 113,
                                column: 1
                            }
                        ]);
                    });
            });

            it('and todos without issues forbidden', function () {
                const jt = new JiraTodo(options);

                return jt.run('source', 'example.js', formatter)
                    .then(function (result) {
                        expect(validate).callCount(3);
                        expect(process).to.have.been.calledOnce
                            .and.to.have.been.calledWithExactly('source');
                        expect(result).to.deep.equal([
                            {
                                valid: false,
                                issue: 'PM-38',
                                message: 'Some error',
                                line: 13,
                                column: 4
                            },
                            {
                                valid: false,
                                issue: 'PM-42',
                                message: 'Some other error',
                                line: 42,
                                column: 2
                            },
                            {
                                valid: false,
                                issue: null,
                                message: 'No issue key given',
                                line: 99,
                                column: 1
                            }
                        ]);
                    });
            });

            it('and todos without issues allowed', function () {
                const jt = new JiraTodo(Object.assign({}, options, { allowTodosWithoutIssues: true }));

                return jt.run('source', 'example.js', formatter)
                    .then(function (result) {
                        expect(validate).callCount(3);
                        expect(process).to.have.been.calledOnce
                            .and.to.have.been.calledWithExactly('source');
                        expect(result).to.deep.equal([
                            {
                                valid: false,
                                issue: 'PM-38',
                                message: 'Some error',
                                line: 13,
                                column: 4
                            },
                            {
                                valid: false,
                                issue: 'PM-42',
                                message: 'Some other error',
                                line: 42,
                                column: 2
                            }
                        ]);
                    });
            });
        });
    });
});
