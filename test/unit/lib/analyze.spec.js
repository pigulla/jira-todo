'use strict';

const util = require('util');

const expect = require('chai').expect;
const sinon = require('sinon');

const test = require('../../setup');
const Processor = test.requireSrc('Processor');

const TODO_PATTERN = util.format(Processor.TODO_PATTERN_TEMPLATE, 'todo|fixme');
const PARSER_OPTIONS = {};

const extractComments = sinon.stub();
const extractTodods = sinon.stub();

const stubs = {
    './extract-comments': extractComments,
    './extract-todos': extractTodods
};
const analyze = test.proxyquireSrc('lib/analyze', stubs);

describe('analyze', function () {
    function run(source) {
        const result = analyze(source, TODO_PATTERN, Processor.ISSUE_PATTERN, PARSER_OPTIONS);
        return test.objectify(result);
    }

    beforeEach(() => Object.keys(stubs).forEach(key => stubs[key].reset()));

    it('no comments', function () {
        extractComments.returns([]);

        expect(run('ignored')).to.deep.equal({
            comments: [],
            issues: {}
        });
        expect(extractComments).to.have.been.calledWithExactly('ignored', PARSER_OPTIONS);
        expect(extractTodods).not.to.have.been.called;
    });

    it('filters comments without todos', function () {
        const TODO_1 = Symbol();
        const TODO_2 = Symbol();
        const ISSUE_1_KEY = 'KEY-1';
        const ISSUE_2_KEY = 'KEY-2';
        const ISSUE_1 = Symbol();
        const ISSUE_2 = Symbol();

        extractComments.returns([
            { line: 17, column: 4, value: 'A' },
            { line: 42, column: 13, value: 'B' },
            { line: 111, column: 1, value: 'C' }
        ]);
        extractTodods.withArgs('A').returns({ issues: [], todos: [] });
        extractTodods.withArgs('B').returns({
            issues: new Map([[ISSUE_1_KEY, ISSUE_1]]),
            todos: [TODO_1, TODO_2]
        });
        extractTodods.withArgs('C').returns({
            issues: new Map([[ISSUE_1_KEY, ISSUE_1], [ISSUE_2_KEY, ISSUE_2]]),
            todos: [TODO_2]
        });

        expect(run('ignored')).to.deep.equal({
            comments: [
                { line: 42, column: 13, value: 'B', todos: [TODO_1, TODO_2] },
                { line: 111, column: 1, value: 'C', todos: [TODO_2] }
            ],
            issues: {
                [ISSUE_1_KEY]: ISSUE_1,
                [ISSUE_2_KEY]: ISSUE_2
            }
        });
    });
});