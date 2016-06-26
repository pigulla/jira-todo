'use strict';

const streamBuffers = require('stream-buffers');

module.exports.sampleResult = [
    {
        file: 'foo.js',
        reports: []
    },
    {
        file: 'bar/baz.js',
        reports: [
            {
                valid: false,
                issue: 'PM-99',
                line: 12,
                column: 2,
                message: 'Oh noes'
            },
            {
                valid: false,
                issue: null,
                line: 15,
                column: 10,
                message: 'No issue key given'
            },
            {
                valid: true,
                issue: 'PM-42',
                line: 17,
                column: 1,
                message: 'I am Groot'
            },
            {
                valid: false,
                issue: 'PM-1000',
                line: 42,
                column: 4,
                message: 'Escape > me!'
            }
        ]
    }
];

/**
 *
 * @param {function} Formatter
 * @param {Array.<jt.FileReport>} fileReports
 * @param {boolean=} monochrome
 * @return {string}
 */
module.exports.format = function (Formatter, fileReports, monochrome) {
    const stream = new streamBuffers.WritableStreamBuffer();
    const formatter = new Formatter(stream, !!monochrome);

    formatter.start();
    fileReports.forEach(fileReport => formatter.report(fileReport));
    formatter.end();
    stream.end();

    return stream.getContentsAsString();
};
