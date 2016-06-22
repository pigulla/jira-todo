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
        expect(chalk.constructor).to.have.been.calledWithNew;
        expect(chalk.constructor).to.have.been.calledWithMatch({ enabled: true });
    });

    it('disables color', function () {
        helper.format(TextFormatter, [], true);
        expect(chalk.constructor).to.have.been.calledWithNew;
        expect(chalk.constructor).to.have.been.calledWithMatch({ enabled: false });
    });

    it('produces the correct number of output lines', function () {
        const output = helper.format(TextFormatter, helper.sampleResult, true);

        expect(output.trim().split(/\n/)).to.have.length(6);
    });
});
