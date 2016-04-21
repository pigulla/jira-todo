'use strict';

const expect = require('chai').expect;
const test = require('../../setup');

const extractComments = test.requireSrc('lib/extract-comments');

describe('extractComments', function () {
    it('ES5', function () {
        const source = test.getFixture('es5');
        const result = extractComments(source);

        expect(result).to.deep.equal([
            {
                line: 7,
                column: 4,
                value: 'TODO: PM-1234, X-99, PM-42'
            },
            {
                line: 9,
                column: 4,
                value: '*\n     * TODO TK-4711: Give this class a proper name!\n     * @constructor\n     '
            },
            {
                line: 17,
                column: 8,
                value: ' fixme! ABC-13'
            },
            {
                line: 21,
                column: 4,
                value: '*\n     * TODO please fix in ABC-99\n     '
            },
            {
                line: 27,
                column: 4,
                value: ' TODO: give this method a proper name!'
            },
            {
                line: 31,
                column: 4,
                value: ' TODO ABC-99: what about someModule?!'
            },
            {
                line: 34,
                column: 4,
                value: ' TODO ABC-1000: This is a story'
            }
        ]);
    });

    it('ES6', function () {
        const source = test.getFixture('es6');
        const result = extractComments(source);

        expect(result).to.deep.equal([
            {
                line: 6,
                column: 4,
                value: ' TODO PM-42: fix this'
            }
        ]);
    });

    it('JSX', function () {
        const source = test.getFixture('jsx');
        const result = extractComments(source);

        expect(result).to.deep.equal([
            {
                line: 7,
                column: 4,
                value: 'TODO: PM-1234, X-99, PM-42'
            },
            {
                line: 9,
                column: 4,
                value: '*\n     * TODO TK-4711: Give this class a proper name!\n     * @constructor\n     '
            },
            {
                line: 27,
                column: 8,
                value: ' fixme! ABC-13'
            },
            {
                line: 31,
                column: 4,
                value: '*\n     * TODO please fix in ABC-99\n     '
            },
            {
                line: 37,
                column: 4,
                value: ' TODO: give this method a proper name!'
            },
            {
                line: 41,
                column: 4,
                value: ' TODO ABC-99: what about someModule?!'
            }
        ]);
    });
});