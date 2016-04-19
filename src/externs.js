'use strict';

const jt = {};

/**
 * @typedef {{
 *   key: string,
 *   project: string,
 *   number: number,
 *   status: jt.IssueStatus
 * }}
 */
jt.Issue;

/**
 * @typedef {{
 *   errors: Array.<string>,
 *   issueKey: string,
 *   typeId: number,
 *   typeName: string.
 *   statusId: number,
 *   statusName: string
 * }}
 */
jt.IssueStatus;

/**
 * @typedef {{
 *   line: number,
 *   column: number,
 *   value: string
 * }}
 */
jt.Comment;

/**
 * @typedef {{
 *   keyword: string,
 *   text: string,
 *   issues: Set.<string>
 * }}
 */
jt.Todo;

/**
 * @typedef {{
 *   line: number,
 *   column: number,
 *   value: string,
 *   todos: Array.<jt.Todo>
 * }}
 */
jt.AnalyzedComment;

/**
 * @typedef {{
 *   comments: Array.<jt.AnalyzedComment>,
 *   issues: Map.<string, jt.Issue>
 * }}
 */
jt.Result;

/**
 * @typedef {Array.<{
 *   message: string,
 *   line: number, 
 *   column: number
 * }>}
 */
jt.Reports;

/**
 * @typedef {{
 *   file: string,
 *   errors: jt.Reports
 * }}
 */
jt.FileReport;