'use strict';

const JSONs = require('json-strictify');
const Formatter = require('./Formatter');

/**
 * @class jt.JsonFormatter
 */
class JsonFormatter extends Formatter {
    /** @inheritDoc */
    constructor(stream, monochrome) {
        super(stream, monochrome);
        this._first = true;
    }

    /** @inheritDoc */
    start() {
        this._writeLn('[');
    }

    /** @inheritDoc */
    report(fileReport) {
        if (this._first) {
            this._first = false;
        } else {
            this._writeLn(',');
        }

        this._stream.write(JSONs.stringify(fileReport), 2);
    }

    /** @inheritDoc */
    end() {
        this._writeLn();
        this._writeLn(']');
    }
}

module.exports = JsonFormatter;
