#!/usr/bin/env node
'use strict';
const {fatal} = require('signale');
const rels = require('./src/rels');

const relsCLI = flags => {
  if (!flags.repo) {
    return fatal('Please provide a repository in the following manner: $username/$repository');
  }

  return rels.init(flags.repo, flags.all ? Infinity : flags.list);
};

module.exports = relsCLI;
