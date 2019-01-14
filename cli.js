#!/usr/bin/env node
'use strict';
const meow = require('meow');
const updateNotifier = require('update-notifier');
const help = require('./src/help');
const pkg = require('./package.json');
const rels = require('.');

const cli = meow(help, {
  flags: {
    all: {
      type: 'boolean',
      alias: 'a'
    },
    help: {
      type: 'boolean',
      alias: 'h'
    },
    list: {
      type: 'string',
      alias: 'l'
    },
    repo: {
      type: 'string',
      alias: 'r'
    },
    version: {
      type: 'boolean',
      alias: 'v'
    }
  }
});

updateNotifier({pkg}).notify();

rels(cli.flags);
