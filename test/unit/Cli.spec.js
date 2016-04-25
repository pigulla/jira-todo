'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Promise = require('bluebird');
const streamBuffers = require('stream-buffers');

const test = require('../setup');

const JiraTodo = sinon.stub();
const path = { resolve: sinon.stub() };
const yargs = { parse: sinon.stub() };
const Glob = sinon.stub();
const runner = sinon.stub();

const cli = test.proxyquireSrc('cli/Cli', {
    'glob': { Glob },
    'path': path,
    './Runner': runner,
    './yargs': yargs,
    '../JiraTodo': JiraTodo
});

describe('Cli', function () {
    const args = [];
    let stdout;

    beforeEach(function () {
        stdout = new streamBuffers.WritableStreamBuffer();

        yargs.parse.withArgs(args).returns({
            directory: __dirname,
            format: 'json'
        });
    });

    it('for no files', function () {
        runner.returns(Promise.resolve({
            files: 0,
            errors: 0
        }));

        return cli(args, stdout)
            .then(exitCode => expect(exitCode).to.equal(0));
    });

    it('for files with problems', function () {
        runner.returns(Promise.resolve({
            files: 4,
            errors: 2
        }));

        return cli(args, stdout)
            .then(exitCode => expect(exitCode).to.equal(1));
    });

    it('for errors', function () {
        runner.returns(Promise.reject('Oh noes'));

        return cli(args, stdout)
            .then(exitCode => expect(exitCode).to.equal(2));
    });
});
