'use strict';

const Formatter = require('./Formatter');

/**
 * @class jt.JsonFormatter
 */
class JsonFormatter extends Formatter {
    constructor(stream) {
        super(stream);
        this._first = true;
    }

    /** @inheritDoc */
    start() {
        this._stream.write('[');
    }

    /** @inheritDoc */
    report(fileReport) {
        if (this._first) {
            this._first = false;
        } else {
            this._stream.write(',');
        }

        this._stream.write(JSON.stringify(fileReport));
    }

    /** @inheritDoc */
    end() {
        this._stream.write(']');
    }
}

module.exports = JsonFormatter;