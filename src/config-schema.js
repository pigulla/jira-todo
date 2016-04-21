'use strict';

const joi = require('joi');
const bunyan = require('bunyan');

const DEFAULT_TODO_PATTERN = '(?:^|\\*|\\s|@)(?<keyword>todo|fixme)(?:!|:|\\s)(?<text>.+)';
const DEFAULT_ISSUE_PATTERN = '(?<key>(?<project>[A-Z][_A-Z0-9]*)-(?<number>\\d+))';

const SCHEMA = joi.object({
    logger: joi.object().type(bunyan, 'bunyan'),
    allowTodosWithoutIssues: joi.boolean().optional().default(false),
    processor: joi.object({
        todoPattern: joi.string().optional().default(DEFAULT_TODO_PATTERN),
        issuePattern: joi.string().optional().default(DEFAULT_ISSUE_PATTERN),
        connector: joi.object({
            protocol: joi.string().only('http', 'https').optional().default('https'),
            host: joi.string().hostname().required()
        }).unknown(true)
    }),
    validator: joi.object({
        projects: joi.object({
            default: joi.string().only('included', 'excluded').optional().default('included'),
            filter: joi.array().items(joi.string())
        }).optional(),
        issueTypes: joi.object({
            default: joi.string().only('included', 'excluded').optional().default('excluded'),
            filter: joi.array().items(joi.number().integer().min(1))
        }).optional(),
        issueStatus: joi.object({
            default: joi.string().only('included', 'excluded').optional().default('excluded'),
            filter: joi.array().items(joi.number().integer().min(1))
        }).optional()
    })
});

module.exports = {
    defaultTodoPattern: DEFAULT_TODO_PATTERN,
    defaultIssuePattern: DEFAULT_ISSUE_PATTERN,
    schema: SCHEMA
};