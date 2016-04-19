'use strict';

const os = require('os');

/**
 * @class jt.Formatter
 */
class Formatter {
    /**
     * @param {stream.Writable} stream
     */
    constructor(stream) {
        this._stream = stream;
    }
    
    /**
     * @protected
     * @param {string} string
     * @param {number=} indent
     */
    _writeLn(string, indent) {
        const padding = new Array(1 + (arguments.length < 2 ? 0 : indent)).join(' ');
        this._stream.write(padding + string + os.EOL);
    }
    
    start() {
    }

    /**
     * @param {jt.FileReport} fileReport
     */
    report(fileReport) { // eslint-disable-line no-unused-vars
    }

    end() {
    }
}

module.exports = Formatter;