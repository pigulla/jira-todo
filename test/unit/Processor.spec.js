'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Promise = require('bluebird');

const test = require('../setup');
const jiraConnectorConstructor = sinon.spy();
const getStatus = sinon.stub();
const analyze = sinon.stub();

const Processor = test.proxyquireSrc('Processor', {
    './lib/analyze': analyze,
    './lib/get-status': getStatus,
    'jira-connector': jiraConnectorConstructor
});

describe('Processor', function () {
    function getProcessor(options) {
        const opts = Object.assign({}, {
            connector: {
                basic_auth: {
                    username: 'groot',
                    password: '6r007'
                }
            },
            keywords: [],
            parserOptions: {}
        }, options);
        return new Processor(opts, test.nullLogger());
    }

    beforeEach(function () {
        jiraConnectorConstructor.reset();
    });

    describe('creates jira-connector', function () {
        it('for anonymous access', function () {
            getProcessor({ connector: {} });

            expect(jiraConnectorConstructor).to.have.been.calledOnce;
            expect(jiraConnectorConstructor).to.have.been.calledWithNew;
            expect(jiraConnectorConstructor.firstCall.args[0]).to.be.an('object');
            expect(jiraConnectorConstructor.firstCall.args[0])
                .to.not.have.property('basic_auth');
        });

        it('for basic auth', function () {
            getProcessor();

            expect(jiraConnectorConstructor).to.have.been.calledOnce;
            expect(jiraConnectorConstructor).to.have.been.calledWithNew;
            expect(jiraConnectorConstructor.firstCall).to.have.been.calledWithMatch({
                basic_auth: {
                    username: 'groot',
                    password: '6r007'
                }
            });
        });
    });

    it('does nothing for input without comments', function () {
        const processor = getProcessor({});

        analyze.returns(Promise.resolve({
            comments: [],
            issues: new Map()
        }));

        return processor.process('input')
            .tap(test.objectify)
            .then(function (result) {
                expect(getStatus).not.to.have.been.called;
                expect(result).to.deep.equal({
                    comments: [],
                    issues: {}
                });
            });
    });
    
    it('uses a cache', function () {
        const processor = getProcessor({});
        
        analyze.returns(Promise.resolve({
            comments: [
                {
                    line: 42,
                    column: 4,
                    value: 'TODO: PM-42',
                    todos: [
                        {
                            keyword: 'TODO',
                            text: ' PM-42',
                            issues: new Set(['PM-42'])
                        }
                    ]
                }
            ],
            issues: new Map([['PM-42', {
                key: 'PM-42',
                project: 'PM',
                number: 42,
                status: 1
            }]])
        }));
        getStatus.returns(Promise.resolve(new Map([
            ['PM-42', {
                issueKey: 'PM-42',
                typeId: 42,
                typeName: 'Defect',
                statusId: 13,
                statusName: 'b0rked'
            }]
        ])));

        return Promise
            .join(processor.process('input'), processor.process('input'))
            .then(() => expect(getStatus).to.have.been.calledOnce);
    });
});