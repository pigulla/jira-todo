'use strict';

const os = require('os');

/**
 * @class jt.Formatter
 */
class Formatter {
    /**
     * @param {stream.Writable} stream
     * @param {boolean} monochrome
     */
    constructor(stream, monochrome) {
        this._stream = stream;
        this._monochrome = monochrome;
    }

    /**
     * @protected
     * @param {string=} string
     * @param {number=} indent
     */
    _writeLn(string, indent) {
        const padding = new Array(1 + (arguments.length < 2 ? 0 : indent)).join(' ');

        this._stream.write(padding + (arguments.length === 0 ? '' : string) + os.EOL);
    }

    /* eslint-disable class-methods-use-this, no-empty-function */

    /**
     */
    start() {
    }

    /**
     * @param {jt.FileReport} fileReport
     */
    report(fileReport) {
    }

    /**
     */
    end() {
    }

    /* eslint-enable class-methods-use-this, no-empty-function */
}

module.exports = Formatter;
