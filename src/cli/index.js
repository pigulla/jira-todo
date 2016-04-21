#!/usr/bin/env node
require('./Cli')(process.argv, process.stdout).then(exitCode => process.exit(exitCode));