'use strict';

const assert = require('assert-plus');

const Processor = require('./Processor');
const Validator = require('./Validator');

/**
 * @class jt.JiraTodo
 */
class JiraTodo {
    /**
     * @param {object} options
     */
    constructor(options) {
        assert.object(options, 'options');
        assert.object(options.logger, 'options.logger');
        assert.bool(options.allowTodosWithoutIssues, 'options.allowTodosWithoutIssues');
        assert.object(options.processor, 'options.processor');
        assert.object(options.validator, 'options.validator');

        this._logger = options.logger;
        this._allowTodosWithoutIssues = options.allowTodosWithoutIssues;
        this._processor = new Processor(options.processor, this._logger);
        this._validator = new Validator(options.validator, this._logger);

        this._logger.info(`Todos without issues are ${this._allowTodosWithoutIssues ? 'allowed' : 'forbidden'}`);
    }

    /**
     * @param {string} source
     * @param {string} filename
     * @param {jt.Formatter} formatter
     * @return {Promise.<jt.Reports>}
     */
    run(source, filename, formatter) {
        const logger = this._logger.child({ filename });

        logger.debug('Processing source');

        return this._processor.process(source)
            .bind(this)
            .then(result => this._collectErrors(result, logger))
            .tap(function (reports) {
                if (reports.length === 0) {
                    logger.debug('File is OK');
                }
            })
            .tap(reports => formatter.report({
                file: filename,
                reports
            }));
    }

    /**
     * @private
     * @param {jt.Result} result
     * @param {Bunyan} logger
     * @return {jt.Reports}
     */
    _collectErrors(result, logger) {
        const validator = this._validator;
        const reports = [];

        result.comments.forEach(function (comment) {
            comment.todos.forEach(function (todo) {
                if (todo.issues.size === 0 && !this._allowTodosWithoutIssues) {
                    logger.warn(
                        `No issue key given for keyword "${todo.keyword}" ` +
                        `in comment starting in line ${comment.line}`);
                    reports.push({
                        issue: null,
                        message: 'No issue key given',
                        line: comment.line,
                        column: comment.column
                    });
                }

                Array.from(todo.issues)
                    .map(issueKey => result.issues.get(issueKey))
                    .map(issue => ({
                        issue,
                        error: validator.validate(issue)
                    }))
                    .filter(data => data.error)
                    .forEach(function (data) {
                        logger.warn(
                            `Problem found for issue ${data.issue.key} ` +
                            `in comment starting in line ${comment.line}: ${data.error}`);
                        reports.push({
                            issue: data.issue.key,
                            message: data.error,
                            line: comment.line,
                            column: comment.column
                        });
                    });
            }, this);
        }, this);

        return reports;
    }
}

module.exports = JiraTodo;
