'use strict';

const EventEmitter = require('events').EventEmitter;

const expect = require('chai').expect;
const sinon = require('sinon');

const test = require('../setup');

const fsStub = { readFile: sinon.stub() };
const pathStub = { resolve: sinon.stub() };
const runner = test.proxyquireSrc('cli/Runner', {
    'fs': fsStub,
    'path': pathStub
});

describe('Runner', function () {
    let glob,
        jt,
        formatter;

    beforeEach(function () {
        glob = Object.assign(new EventEmitter(), {
            abort: sinon.spy(),
            cwd: '/my/source'
        });
        jt = { run: sinon.stub() };
        formatter = {
            start: sinon.stub(),
            end: sinon.stub()
        };
    });

    it('aborts on file error', function (done) {
        const fsError = new Error('Oh noes');

        runner(glob, jt, formatter)
            .catch(function (error) {
                expect(error).to.be.an('error');
                expect(error.message).to.have.string('/my/source/myfile.js');
                expect(error.message).to.have.string('Oh noes');

                done();
            });

        pathStub.resolve.withArgs('/my/source', 'myfile.js').returns('/my/source/myfile.js');
        fsStub.readFile.withArgs('/my/source/myfile.js').yields(fsError);

        glob.emit('match', 'myfile.js');
    });

    it('aborts on glob error', function (done) {
        const globError = new Error();

        runner(glob, jt, formatter)
            .catch(function (error) {
                expect(error).to.equal(globError);
                expect(glob.abort).to.have.been.calledOnce;
                done();
            });

        glob.emit('error', globError);
    });

    it('works for no files', function (done) {
        runner(glob, jt, formatter)
            .then(function (result) {
                expect(formatter.start).to.have.been.calledOnce;
                expect(formatter.end).to.have.been.calledOnce;
                expect(result).to.deep.equal({
                    files: 0,
                    errors: 0
                });
                done();
            });

        expect(formatter.start).to.have.been.called;
        expect(formatter.end).not.to.have.been.called;

        glob.emit('end');
    });
});
