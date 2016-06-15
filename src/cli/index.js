#!/usr/bin/env node
const Cli = require('./Cli');
new Cli(process).run().then(exitCode => process.exit(exitCode));
