#!/usr/bin/env node
require('./Cli')(process).then(exitCode => process.exit(exitCode));