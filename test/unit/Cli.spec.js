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
    let parsedArgs;
    const proc = {
        argv: null,
        stdout: null,
        stderr: null
    };

    beforeEach(function () {
        parsedArgs = {
            directory: __dirname,
            format: 'json'
        };

        proc.stdout = new streamBuffers.WritableStreamBuffer();
        proc.stderr = new streamBuffers.WritableStreamBuffer();

        JiraTodo.reset();
        yargs.parse.reset();
        yargs.parse.withArgs(proc.argv).returns(parsedArgs);
    });

    describe('sets up jira-connector', function () {
        beforeEach(function () {
            runner.returns(Promise.resolve({
                files: 0,
                errors: 0
            }));
        });

        it('with basic authentication', function () {
            parsedArgs.jiraUsername = 'groot';
            parsedArgs.jiraPassword = '6r007';
            cli(proc);

            expect(JiraTodo).to.have.been.calledOnce;
            expect(JiraTodo).to.have.been.calledWithNew;
            expect(JiraTodo.firstCall.args[0])
                .to.have.deep.property('processor.connector.basic_auth.username', 'groot');
            expect(JiraTodo.firstCall.args[0])
                .to.have.deep.property('processor.connector.basic_auth.password', '6r007');
        });

        it('without basic authentication', function () {
            cli(proc);

            expect(JiraTodo).to.have.been.calledOnce;
            expect(JiraTodo).to.have.been.calledWithNew;
            expect(JiraTodo.firstCall.args[0]).to.not.have.deep.property('processor.connector.basic_auth');
        });
    });

    describe('reports errors to stderr', function () {
        beforeEach(function () {
            runner.returns(Promise.reject(new Error('Oh noes!')));
        });

        it('as JSON if logging is enabled', function () {
            return cli(proc)
                .then(function () {
                    const contents = proc.stderr.getContentsAsString();
                    expect(contents).to.not.be.false;
                    expect(JSON.parse(contents)).to.have.deep.property('msg', 'Oh noes!');
                });
        });

        it('if logging is disabled', function () {
            parsedArgs.logFormat = 'null';
            return cli(proc)
                .then(exitCode => expect(exitCode).to.equal(2))
                .then(() => expect(proc.stderr.getContentsAsString()).not.to.be.false);
        });
    });

    it('for no files', function () {
        runner.returns(Promise.resolve({
            files: 0,
            errors: 0
        }));

        return cli(proc)
            .then(exitCode => expect(exitCode).to.equal(0));
    });

    it('for files with problems', function () {
        runner.returns(Promise.resolve({
            files: 4,
            errors: 2
        }));

        return cli(proc)
            .then(exitCode => expect(exitCode).to.equal(1));
    });

    it('for errors', function () {
        runner.returns(Promise.reject('Oh noes'));

        return cli(proc)
            .then(exitCode => expect(exitCode).to.equal(2));
    });
});
