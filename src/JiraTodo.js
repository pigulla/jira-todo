'use strict';

const assert = require('assert-plus');
const joi = require('joi');

const Processor = require('./Processor');
const Validator = require('./Validator');
const configSchema = require('./config-schema').schema;

/**
 * @class jt.JiraTodo
 */
class JiraTodo {
    /**
     * @param {object} options
     */
    constructor(options) {
        assert.object(options, 'options');
        
        const result = joi.validate(options, configSchema, { presence: 'required' });

        if (result.error) {
            throw new Error(`Invalid options (${result.error.toString()})`);
        }

        this._logger = result.value.logger;
        this._allowTodosWithoutIssues = result.value.allowTodosWithoutIssues;
        this._processor = new Processor(result.value.processor, this._logger);
        this._validator = new Validator(result.value.validator, this._logger);

        this._logger.info(`Todos without issues are ${this._allowTodosWithoutIssues ? 'allowed' : 'forbidden' }`);
    }

    /**
     * @param {string} source
     * @param {string} filename
     * @param {jt.Formatter} formatter
     * @return {Promise.<jt.Reports>}
     */
    run(source, filename, formatter) {
        const logger = this._logger.child({ filename });
        logger.debug(`Processing source`);

        return this._processor.process(source)
            .bind(this)
            .then(result => this._collectErrors(result, logger))
            .tap(function (errors) {
                if (errors.length === 0) {
                    logger.debug(`File is OK`);
                }
            })
            .tap(reports => formatter.report({ file: filename, errors: reports }));
    }

    /**
     * @private
     * @param {jt.Result} result
     * @param {Bunyan} logger
     * @return {jt.Reports}
     */
    _collectErrors(result, logger) {
        const validator = this._validator;
        const errors = [];

        result.comments.forEach(function (comment) {
            comment.todos.forEach(function (todo) {
                if (todo.issues.size === 0 && !this._allowTodosWithoutIssues) {
                    logger.warn(
                        `No issue key given for keyword "${todo.keyword}" ` +
                        `in comment starting in line ${comment.line}`);
                    errors.push({
                        issue: null,
                        message: 'No issue key given',
                        line: comment.line,
                        column: comment.column
                    });
                }

                Array.from(todo.issues)
                    .map(issueKey => result.issues.get(issueKey))
                    .map(issue => ({ issue, error: validator.validate(issue) }))
                    .filter(data => data.error)
                    .forEach(function (data) {
                        logger.warn(
                            `Problem found for issue ${data.issue.key} ` +
                            `in comment starting in line ${comment.line}: ${data.error}`);
                        errors.push({
                            issue: data.issue.key,
                            message: data.error,
                            line: comment.line,
                            column: comment.column
                        });
                    });
            }, this);
        }, this);

        return errors;
    }
}

module.exports = JiraTodo;