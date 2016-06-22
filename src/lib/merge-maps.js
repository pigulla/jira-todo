'use strict';

module.exports = function mergeMaps(maps) {
    const entries = maps.map(map => Array.from(map.entries()));
    const result = Array.prototype.concat.apply([], entries);

    return new Map(result);
};
