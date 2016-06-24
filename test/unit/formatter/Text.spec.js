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

    it('produces the correct number of output lines', function () {
        const output = helper.format(TextFormatter, helper.sampleResult, true);
        const actual = output.trim().split(/\n/);
        const expected = [
            'Found no valid issues in file "foo.js"',
            'No problems found in file "foo.js"',
            'Found 1 valid issue in file "bar/baz.js"',
            'Found 2 problems in file "bar/baz.js"',
            '  Problem with issue undefined in comment starting in line 12: Oh noes',
            '  Problem with issue undefined in comment starting in line 42: Escape > me!',
            '',
            'Found 2 errors in 2 files'
        ];

        expect(actual).to.deep.equal(expected);
    });
});
