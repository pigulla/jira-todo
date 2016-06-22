'use strict';

const streamBuffers = require('stream-buffers');

module.exports.sampleResult = [
    {
        file: 'foo.js',
        errors: []
    },
    {
        file: 'bar/baz.js',
        errors: [
            {
                line: 12,
                column: 2,
                message: 'Oh noes'
            },
            {
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
