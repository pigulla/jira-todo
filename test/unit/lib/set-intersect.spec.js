'use strict';

const expect = require('chai').expect;
const test = require('../../setup');

const intersect = test.requireSrc('lib/set-intersect');

describe('setIntersect', function () {
    it('partial intersection', function () {
        const setA = new Set(['a', 'b', 'c']);
        const setB = new Set(['c', 'd', 'e']);
        const intersection = intersect(setA, setB);

        expect(intersection).to.be.instanceof(Set);
        expect(Array.from(intersection.values())).to.deep.equal(['c']);
    });

    it('empty intersection', function () {
        const setA = new Set(['a', 'b', 'c']);
        const setB = new Set(['d', 'e', 'f']);
        const intersection = intersect(setA, setB);

        expect(intersection.size).to.equal(0);
    });

    it('full intersection', function () {
        const setA = new Set(['a', 'b', 'c']);
        const intersection = intersect(setA, setA);

        expect(Array.from(intersection.values())).to.deep.equal(['a', 'b', 'c']);
    });

    it('intersection with empty set', function () {
        const setA = new Set(['a', 'b', 'c']);
        const setB = new Set([]);
        const intersection = intersect(setA, setB);

        expect(intersection.size).to.equal(0);
    });

    it('intersection of empty sets', function () {
        const setA = new Set([]);
        const setB = new Set([]);
        const intersection = intersect(setA, setB);

        expect(intersection.size).to.equal(0);
    });
});