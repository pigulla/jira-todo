#!/usr/bin/env node
/* eslint-disable no-process-env, no-process-exit */

'use strict';

const Cli = require('./Cli');

new Cli(process).run()
    .then(exitCode => process.exit(exitCode));
