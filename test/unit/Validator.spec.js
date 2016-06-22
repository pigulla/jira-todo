'use strict';

const expect = require('chai').expect;

const test = require('../setup');
const Validator = test.requireSrc('Validator');

describe('Validator', function () {
    function getValidator(options) {
        const opts = Object.assign({}, {
            issueTypes: {
                default: 'excluded',
                filter: [1, 3, 4, 5]
            },
            issueStatus: {
                default: 'excluded',
                filter: [1]
            }
        }, options);

        return new Validator(opts, test.nullLogger());
    }

    function makeIssue(project, type, status) {
        return {
            project,
            status: {
                typeId: type,
                typeName: `${type}-name`,
                statusId: status,
                statusName: `${status}-name`
            }
        };
    }

    it('unknown issues', function () {
        const validator = getValidator({});
        const issue = makeIssue('FOO', 1, 1);

        delete issue.status;

        expect(validator.validate(issue)).to.be.a('string');
    });

    describe('projects', function () {
        const fooIssue = makeIssue('FOO', 1, 1);
        const barIssue = makeIssue('BAR', 1, 1);

        it('excluded by default', function () {
            const validator = getValidator({
                projects: {
                    default: 'excluded',
                    filter: ['FOO']
                }
            });

            expect(validator.validate(fooIssue)).to.be.null;
            expect(validator.validate(barIssue)).to.be.a('string');
            expect(validator.validate(barIssue)).to.match(/Project/);
        });

        it('included by default', function () {
            const validator = getValidator({
                projects: {
                    default: 'included',
                    filter: ['FOO']
                }
            });

            expect(validator.validate(barIssue)).to.be.null;
            expect(validator.validate(fooIssue)).to.be.a('string');
            expect(validator.validate(fooIssue)).to.match(/Project/);
        });
    });

    describe('issue types', function () {
        const typeTwoIssue = makeIssue('BAR', 2, 1);
        const typeSixIssue = makeIssue('FOO', 6, 1);

        it('excluded by default', function () {
            const validator = getValidator({
                issueTypes: {
                    default: 'excluded',
                    filter: [2]
                }
            });

            expect(validator.validate(typeTwoIssue)).to.be.null;
            expect(validator.validate(typeSixIssue)).to.be.a('string');
            expect(validator.validate(typeSixIssue)).to.match(/Type/);
        });

        it('included by default', function () {
            const validator = getValidator({
                issueTypes: {
                    default: 'included',
                    filter: [2]
                }
            });

            expect(validator.validate(typeSixIssue)).to.be.null;
            expect(validator.validate(typeTwoIssue)).to.be.a('string');
            expect(validator.validate(typeTwoIssue)).to.match(/Type/);
        });
    });

    describe('issue status', function () {
        const statusTwoIssue = makeIssue('BAR', 1, 2);
        const statusSixIssue = makeIssue('FOO', 1, 6);

        it('excluded by default', function () {
            const validator = getValidator({
                issueStatus: {
                    default: 'excluded',
                    filter: [2]
                }
            });

            expect(validator.validate(statusTwoIssue)).to.be.null;
            expect(validator.validate(statusSixIssue)).to.be.a('string');
            expect(validator.validate(statusSixIssue)).to.match(/Status/);
        });

        it('included by default', function () {
            const validator = getValidator({
                issueStatus: {
                    default: 'included',
                    filter: [2]
                }
            });

            expect(validator.validate(statusSixIssue)).to.be.null;
            expect(validator.validate(statusTwoIssue)).to.be.a('string');
            expect(validator.validate(statusTwoIssue)).to.match(/Status/);
        });
    });
});
