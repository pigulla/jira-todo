'use strict';

const childProcess = require('child_process');
const path = require('path');

const expect = require('chai').expect;
const streamBuffers = require('stream-buffers');
const Promise = require('bluebird');
const glob = require('glob');
const pick = require('lodash.pick');

const createServer = require('./Server');

const node = process.env.NODE_BINARY || process.argv[0];
const scenarioDir = path.join(__dirname, 'scenario');
const cli = path.join(__dirname, '..', '..', 'src', 'cli', 'index.js');

/**
 * @param {Buffer} buffer
 * @param {boolean=} multiline
 * @return {Array.<Object>}
 */
function parseBuffer(buffer, multiline) {
    const str = buffer.getContentsAsString();

    if (str === false) {
        return null;
    }

    return multiline ? str.trim().split(/\n/).map(line => JSON.parse(line)) : JSON.parse(str);
}

/**
 * @param {string} name
 * @return Promise
 */
function run(name) {
    const scenario = require(path.join(scenarioDir, name));
    const args = [cli].concat(scenario.setup.argv);
    const stdout = new streamBuffers.WritableStreamBuffer();
    const stderr = new streamBuffers.WritableStreamBuffer();

    const child = childProcess.spawn(node, args, {
        cwd: path.join(scenarioDir, name, 'files'),
        env: scenario.setup.env
    });

    child.stdout.pipe(stdout);
    child.stderr.pipe(stderr);

    return new Promise(function (resolve, reject) {
        child.on('close', function (code) {
            stdout.end();
            stderr.end();
            resolve([code, parseBuffer(stdout), parseBuffer(stderr, true)]);
        });
        child.on('error', reject);
    })
    .spread(function (exitCode, output, logs) {
        expect(output).to.deep.equal(scenario.result.report);
        expect(logs.map(entry => pick(entry, ['level', 'msg', 'filename']))).to.deep.equal(scenario.result.logs);
        expect(exitCode).to.equal(scenario.result.exitCode);
    });
}

describe('End-to-End', function () {
    let server;
    
    this.timeout(4000);
    this.slow(2000);

    before(function () {
        return createServer(8080).then(restify => server = restify);
    });

    after(() => Promise.fromCallback(cb => server.close(cb)));

    glob.sync('*/', { cwd: scenarioDir }).forEach(function (name) {
        it(path.basename(name), () => run(name));
    });
});