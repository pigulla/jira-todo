'use strict';

module.exports = function setIntersect(setA, setB) {
    const elements = Array.from(setA).filter(item => setB.has(item));
    return new Set(elements);
};