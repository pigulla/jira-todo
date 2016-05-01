'use strict';

const chalk = require('chalk');
const Formatter = require('./Formatter');

/**
 * @class jt.TextFormatter
 */
class TextFormatter extends Formatter {
    /** @inheritDoc */
    constructor(stream, monochrome) {
        super(stream, monochrome);

        this._chalk = new chalk.constructor({ enabled: !monochrome });
    }

    /** @inheritDoc */
    start() {
        this._fileCount = 0;
        this._errorCount = 0;
    }

    /** @inheritDoc */
    end() {
        const files = this._fileCount;
        const errors = this._errorCount;

        this._writeLn();
        /* istanbul ignore next */
        this._writeLn(this._chalk.white.bold(
            `Found ${errors === 0 ? 'no' : errors} error${errors === 1 ? '' : 's'} ` +
            `in ${files} file${files === 1 ? '' : 's'}`
        ));
    }

    /** @inheritDoc */
    report(fileReport) {
        this._fileCount++;
        this._errorCount += fileReport.errors.length;

        const count = fileReport.errors.length;

        if (count === 0) {
            this._writeLn(this._chalk.gray(`No problems found in file ${fileReport.file}`));
        } else {
            /* istanbul ignore next */
            this._writeLn(this._chalk.white(
                `Found ${count} problem${count > 1 ? 's' : ''} in file "${fileReport.file}"`
            ));
        }

        fileReport.errors.forEach(function (error) {
            this._writeLn(
                this._chalk.yellow(`  Problem with issue ${error.issue} in comment starting in line ${error.line}: `) +
                this._chalk.yellow.bold(error.message)
            );
        }, this);
    }
}

module.exports = TextFormatter;