'use strict';

const assert = require('assert-plus');
const defaults = require('lodash.defaults');

/**
 * @class jt.Validator
 */
class Validator {
    /**
     * @param {object} options
     * @param {Bunyan} logger
     */
    constructor(options, logger) {
        assert.object(options, 'options');
        assert.object(logger, 'logger');

        this._logger = logger;
        this._opts = Validator._initOptions(options);

        this._logDebuggingInfo();
    }

    /**
     * @param {jt.Issue} issue
     * @return {?string}
     */
    validate(issue) {
        const projects = this._opts.projects;
        const issueTypes = this._opts.issueTypes;
        const issueStatus = this._opts.issueStatus;

        if (!issue.status) {
            return 'Issue was not found';
        }

        if (!Validator._isOk(issue.project, projects.default, projects.filter)) {
            return `Project "${issue.project}" is not allowed`;
        }

        if (!Validator._isOk(issue.status.typeId, issueTypes.default, issueTypes.filter)) {
            return `Type "${issue.status.typeName}" (id ${issue.status.typeId}) is not allowed`;
        }

        if (!Validator._isOk(issue.status.statusId, issueStatus.default, issueStatus.filter)) {
            return `Status "${issue.status.statusName}" (id ${issue.status.statusId}) is not allowed`;
        }

        return null;
    }

    /**
     * @private
     * @param {*} value
     * @param {string} dflt
     * @param {Set} filter
     * @return {boolean}
     */
    static _isOk(value, dflt, filter) {
        if (dflt === 'included') {
            return !filter.has(value);
        } /* istanbul ignore else */ else if (dflt === 'excluded') {
            return filter.has(value);
        } else {
            throw new Error(`Unexpected default value: ${dflt}`);
        }
    }

    /**
     * @private
     * @param {object} options
     * @return {object}
     */
    static _initOptions(options) {
        const opts = defaults({}, options, {
            projects: {},
            issueTypes: {},
            issueStatus: {}
        });

        defaults(opts.projects, {
            default: 'included',
            filter: []
        });
        defaults(opts.issueTypes, {
            default: 'excluded',
            filter: []
        });
        defaults(opts.issueStatus, {
            default: 'excluded',
            filter: []
        });

        Validator._validateOptions(opts);

        return opts;
    }

    /**
     * @private
     * @param {object} options
     */
    static _validateOptions(options) {
        assert.object(options.projects, 'options.projects');
        assert.object(options.issueTypes, 'options.issueTypes');
        assert.object(options.issueStatus, 'options.issueStatus');
        assert.string(options.projects.default, 'options.projects.default');
        assert.arrayOfString(options.projects.filter, 'options.projects.filter');
        assert.string(options.issueTypes.default, 'options.issueTypes.default');
        assert.arrayOfNumber(options.issueTypes.filter, 'options.issueTypes.filter');
        assert.string(options.issueStatus.default, 'options.issueStatus.default');
        assert.arrayOfNumber(options.issueStatus.filter, 'options.issueStatus.filter');

        options.projects.filter = new Set(options.projects.filter);
        options.issueTypes.filter = new Set(options.issueTypes.filter);
        options.issueStatus.filter = new Set(options.issueStatus.filter);
    }

    /**
     * @private
     */
    _logDebuggingInfo() {
        this._logDebuggingInfoFor('projects', this._opts.projects.default, this._opts.projects.filter);
        this._logDebuggingInfoFor('issue types', this._opts.issueTypes.default, this._opts.issueTypes.filter);
        this._logDebuggingInfoFor('issue status', this._opts.issueStatus.default, this._opts.issueStatus.filter);
    }

    /**
     * @private
     */
    _logDebuggingInfoFor(title, dflt, filter) {
        const list = Array.from(filter);

        if (dflt === 'included') {
            this._logger.info(
                list.length ?
                `All but the following ${title} are allowed: ${list.join(', ')}` :
                `All ${title} are allowed`
            );
        } else {
            this._logger.info(
                list.length ?
                `All but the following ${title} are forbidden: ${list.join(', ')}` :
                `No ${title} are allowed`
            );
        }
    }
}

module.exports = Validator;
