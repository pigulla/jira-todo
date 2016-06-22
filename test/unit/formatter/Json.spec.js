'use strict';

const expect = require('chai').expect;

const helper = require('./formatter.helper');
const test = require('../../setup');

const JsonFormatter = test.requireSrc('formatter/Json');

describe('json formatter', function () {
    function formatAndParse(fileReports) {
        const string = helper.format(JsonFormatter, fileReports);

        return JSON.parse(string);
    }

    describe('produces well-formed output', function () {
        it('for no reports', function () {
            expect(() => JSON.parse(helper.format(JsonFormatter, []))).not.to.throw(Error);
        });

        it('for several reports', function () {
            expect(() => JSON.parse(helper.format(JsonFormatter, helper.sampleResult))).not.to.throw(Error);
        });
    });

    describe('produces the correct output', function () {
        it('for no reports', function () {
            const json = formatAndParse([]);

            expect(json).to.deep.equal([]);
        });

        it('for several reports', function () {
            const json = formatAndParse(helper.sampleResult);

            expect(json).to.deep.equal(helper.sampleResult);
        });
    });
});
