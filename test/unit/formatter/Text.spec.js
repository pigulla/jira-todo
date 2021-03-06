'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const chalk = require('chalk');

const test = require('../../setup');
const helper = require('./formatter.helper');

const TextFormatter = test.requireSrc('formatter/Text');

describe('text formatter', function () {
    beforeEach(function () {
        sinon.spy(chalk, 'constructor');
    });

    afterEach(function () {
        chalk.constructor.restore();
    });

    it('uses color', function () {
        helper.format(TextFormatter, [], false);
        expect(chalk.constructor).to.have.been.calledOnce
            .and.to.have.been.calledWithNew
            .and.to.have.been.calledWithMatch({ enabled: true });
    });

    it('disables color', function () {
        helper.format(TextFormatter, [], true);
        expect(chalk.constructor).to.have.been.calledOnce
            .and.to.have.been.calledWithNew
            .and.to.have.been.calledWithMatch({ enabled: false });
    });

    it('produces the correct output', function () {
        const output = helper.format(TextFormatter, helper.sampleResult, true);
        const actual = output.trim().split(/\n/);
        const expected = [
            'No problems found in file "foo.js"',
            'Found 1 valid issue in file "bar/baz.js"',
            'Found 3 problems in file "bar/baz.js"',
            '  Problem with issue PM-99 in comment starting in line 12: Oh noes',
            '  Problem with todo in comment starting in line 15: No issue key given',
            '  Problem with issue PM-1000 in comment starting in line 42: Escape > me!',
            '',
            'Found 3 errors in 2 files'
        ];

        expect(actual).to.deep.equal(expected);
    });
});
