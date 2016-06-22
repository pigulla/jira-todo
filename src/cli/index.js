#!/usr/bin/env node

'use strict';
/* eslint-disable no-process-env, no-process-exit */

const Cli = require('./Cli');

new Cli(process).run()
    .then(exitCode => process.exit(exitCode));
