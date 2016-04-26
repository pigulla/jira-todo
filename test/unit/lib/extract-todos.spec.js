'use strict';

const util = require('util');

const expect = require('chai').expect;
const XRegExp = require('xregexp');

const test = require('../../setup');

const extractTodos = test.requireSrc('lib/extract-todos');
const Processor = test.requireSrc('Processor');

const TODO_REGEX = XRegExp(util.format(Processor.TODO_PATTERN_TEMPLATE, 'todo|fixme'), 'gi');
const ISSUE_REGEX = XRegExp(Processor.ISSUE_PATTERN, 'gi');

describe('extractTodos', function () {
    function extract(string) {
        return extractTodos(string, TODO_REGEX, ISSUE_REGEX);
    }

    it('simple', function () {
        const result = extract('TODO: PM-42');

        expect(result.todos[0].issues).to.be.instanceof(Set);
        expect(result.issues).to.be.instanceof(Map);
        expect(test.objectify(result)).to.deep.equal({
            todos: [
                { keyword: 'TODO', text: ' PM-42', issues: ['PM-42'] }
            ],
            issues: {
                'PM-42': { key: 'PM-42', project: 'PM', number: 42, status: null }
            }
        });
    });

    it('multiple', function () {
        const result = extract('TODO: fix in PM-42 and X-99');

        expect(test.objectify(result)).to.deep.equal({
            todos: [
                { keyword: 'TODO', text: ' fix in PM-42 and X-99', issues: ['PM-42', 'X-99'] }
            ],
            issues: {
                'PM-42': { key: 'PM-42', project: 'PM', number: 42, status: null },
                'X-99': { key: 'X-99', project: 'X', number: 99, status: null }
            }
        });
    });

    it('multiline', function () {
        const result = extract('*\n     * TODO TK-4711: Give this class a proper name!\n     * @FIXME wtf?\n     ');

        expect(test.objectify(result)).to.deep.equal({
            todos: [
                { keyword: 'TODO', text: 'TK-4711: Give this class a proper name!', issues: ['TK-4711'] },
                { keyword: 'FIXME', text: 'wtf?', issues: [] }
            ],
            issues: {
                'TK-4711': { key: 'TK-4711', project: 'TK', number: 4711, status: null }
            }
        });
    });
});