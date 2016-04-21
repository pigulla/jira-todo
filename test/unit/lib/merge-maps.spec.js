'use strict';

const expect = require('chai').expect;
const test = require('../../setup');

const merge = test.requireSrc('lib/merge-maps');

describe('mergeMaps', function () {
    it('partial merge', function () {
        const mapA = new Map([['a', 1], ['b', 2], ['c', 3]]);
        const mapB = new Map([['c', 4], ['d', 5], ['e', 6]]);
        const merged = merge([mapA, mapB]);

        expect(merged).to.be.instanceof(Map);
        expect(Array.from(merged.entries())).to.deep.equal([
            ['a', 1], ['b', 2], ['c', 4], ['d', 5], ['e', 6]
        ]);
    });

    it('disjunct merge', function () {
        const mapA = new Map([['a', 1], ['b', 2], ['c', 3]]);
        const mapB = new Map([['d', 4], ['e', 5], ['f', 6]]);
        const merged = merge([mapA, mapB]);

        expect(merged).to.be.instanceof(Map);
        expect(Array.from(merged.entries())).to.deep.equal([
            ['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', 5], ['f', 6]
        ]);
    });

    it('congruent merge', function () {
        const mapA = new Map([['a', 1], ['b', 2], ['c', 3]]);
        const mapB = new Map([['a', 1], ['b', 2], ['c', 3]]);
        const merged = merge([mapA, mapB]);

        expect(merged).to.be.instanceof(Map);
        expect(Array.from(merged.entries())).to.deep.equal([
            ['a', 1], ['b', 2], ['c', 3]
        ]);
    });

    it('merge with empty maps', function () {
        const mapA = new Map([]);
        const mapB = new Map([]);
        const merged = merge([mapA, mapB]);

        expect(merged).to.be.instanceof(Map);
        expect(merged.size).to.equal(0);
    });
});