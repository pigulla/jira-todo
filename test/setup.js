'use strict';

const assert = require('assert-plus');
const blackhole = require('stream-blackhole');
const bunyan = require('bunyan');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const http = require('http-status');
const nock = require('nock');
const proxyquire = require('proxyquire');
const sinonChai = require('sinon-chai');
const traverse = require('traverse');

const fixtures = require('./fixtures/');
const makeResponse = require('./response.helper');

chai.use(sinonChai);
chai.use(chaiAsPromised);

nock.disableNetConnect();

module.exports = {
    requireSrc(path) {
        assert.string(path, 'path');
        return require(`../src/${path}`);
    },

    proxyquireSrc(path, stubs) {
        assert.string(path, 'path');
        assert.object(stubs, 'stubs');
        return proxyquire(`../src/${path}`, stubs);
    },
    
    addIssueToNock(key, options) {
        const response = makeResponse(key, options);

        nock('https://jira.host.invalid')
            .get(`/rest/api/2/issue/${key}`)
            .basicAuth({
                user: 'myusername',
                pass: 'mypassword'
            })
            .query(true)
            .reply(http.OK, response);
    },
    
    addNotFoundIssueToNock(key) {
        nock('https://jira.host.invalid')
            .get(`/rest/api/2/issue/${key}`)
            .basicAuth({
                user: 'myusername',
                pass: 'mypassword'
            })
            .query(true)
            .reply(http.NOT_FOUND, '{}');
    },
    
    nullLogger() {
        return bunyan.createLogger({ name: 'null', stream: blackhole() });
    },

    getFixture(name) {
        assert.string(name, 'name');

        if (Object.keys(fixtures).indexOf(name) === -1) {
            throw new Error(`Unknown fixture name "${name}"`);
        }

        return fixtures[name];
    },
    
    objectify(object) {
        assert.object(object, 'object');

        function objectifyMap(map) {
            const keys = Array.from(map.keys());
            return keys.reduce(function (o, key) {
                assert.string(key, 'key');
                o[key] = this.node.get(key);
                return o;
            }.bind(this), {});
        }

        function objectifySet(set) {
            return Array.from(set).sort();
        }

        const wrapper = { object };

        traverse(wrapper).forEach(function () {
            if (this.node instanceof Map) {
                this.update(objectifyMap.call(this, this.node));
            } else if (this.node instanceof Set) {
                this.update(objectifySet.call(this, this.node));
            }
        });

        return wrapper.object;
    }
};