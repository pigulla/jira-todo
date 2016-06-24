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
        const errors = fileReport.reports.filter(report => !report.valid);
        const valid = fileReport.reports.filter(report => report.valid);

        this._fileCount++;
        this._errorCount += errors.length;

        this._writeLn(this._chalk.gray(
            `Found ${valid.length === 0 ? 'no' : valid.length} valid issue${valid.length === 1 ? '' : 's'} ` +
            `in file "${fileReport.file}"`
        ));

        if (errors.length === 0) {
            this._writeLn(this._chalk.gray(`No problems found in file "${fileReport.file}"`));
        } else {
            /* istanbul ignore next */
            this._writeLn(this._chalk.white(
                `Found ${errors.length} problem${errors.length > 1 ? 's' : ''} in file "${fileReport.file}"`
            ));
        }

        errors.forEach(function (error) {
            this._writeLn(
                this._chalk.yellow(`  Problem with issue ${error.issue} in comment starting in line ${error.line}: `) +
                this._chalk.yellow.bold(error.message)
            );
        }, this);
    }
}

module.exports = TextFormatter;
