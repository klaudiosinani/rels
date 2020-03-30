#!/usr/bin/env node
'use strict';
const rels = require('./src/rels');

const {log} = console;

const relsCLI = flags => {
  if (!flags.repo) {
    const message = [
      'No repository was given as input.',
      'Run "rels --help" for more information and examples.'
    ].join('\n');

    return log(message);
  }

  return rels.init(flags.repo, flags.all ? Infinity : flags.list);
};

module.exports = relsCLI;
