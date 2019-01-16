'use strict';
const {get} = require('https');
const {blue, green, magenta, underline, yellow} = require('chalk');
const signale = require('signale');
const pkg = require('./../package.json');

signale.config({displayLabel: false});

const {fatal, log, note} = signale;

class Rels {
  constructor() {
    this._latestRelease = {};
    this._padding = '     ';
  }

  get _opts() {
    return {
      host: 'api.github.com',
      headers: {
        'user-agent': `${pkg.repository} - ${process.title}`
      }
    };
  }

  get _path() {
    return {
      releases: x => `/repos/${x}/releases`,
      latest: x => `/repos/${x}/releases/latest`
    };
  }

  get _badge() {
    return {
      latest: x => x.isLatest ? green('[Latest]') : ''
    };
  }

  get _latest() {
    return {
      date: this._format.date.long(this._latestRelease.created_at),
      tag: this._latestRelease.tag_name
    };
  }

  get _format() {
    return {
      date: {
        long: x => new Date(Date.parse(x)).toDateString(),
        short: x => {
          const date = new Date(Date.parse(x));
          return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        }
      },
      listN: x => Number(x) || 5,
      num: x => x >= 1000000 ? (x / 1000000).toFixed(2) + 'm' : x >= 1000 ? (x / 1000).toFixed(2) + 'k' : x
    };
  }

  _getPopular(data) {
    const obj = {};

    data.forEach(x => {
      obj[x.dls] = x.tag;
    });

    const popularDls = Math.max(...Object.keys(obj));

    return {
      popularDls,
      popularTag: obj[popularDls]
    };
  }

  _releaseDls(x) {
    let total = 0;

    x.assets.forEach(asset => {
      total += asset.download_count;
    });

    return total;
  }

  _totalDls(data) {
    let total = 0;

    data.forEach(release => {
      total += release.dls;
    });

    return total;
  }

  _totalAssets(data) {
    let total = 0;

    data.forEach(release => {
      total += release.assets;
    });

    return total;
  }

  _title(x) {
    return [
      underline(`Release ${x.tag}`),
      this._badge.latest(x)
    ].join(' ');
  }

  _formatData(data) {
    const result = [];

    data.forEach(release => {
      const {assets, created_at: date, tag_name: tag} = release;
      const {login: author} = release.author;

      result.push({
        assets: assets.length,
        author,
        date: this._format.date.short(date),
        dls: this._releaseDls(release),
        isLatest: tag === this._latest.tag,
        tag
      });
    });

    return result;
  }

  _getStats(data) {
    const [assets, dls, releases] = [this._totalAssets(data), this._totalDls(data), data.length];
    const dlsPerRelease = Math.ceil(dls / releases);

    return Object.assign({
      assets,
      dls,
      dlsPerRelease,
      releases
    }, this._getPopular(data));
  }

  _displayRelease(x) {
    const message = [
      '',
      `Assets: ${this._format.num(x.assets)}\n`,
      `Downloads: ${this._format.num(x.dls)}\n`,
      `Date: ${x.date}\n`,
      `Author: @${x.author}\n`
    ];

    note(this._title(x));
    log(message.join(this._padding));
  }

  _displayStats(data) {
    const {tag: lt, date: ld} = this._latest;
    const {assets, dls, dlsPerRelease, releases, popularTag, popularDls} = this._getStats(data);

    const [a, d, dpr, r, pt, pd] = [
      assets,
      dls,
      dlsPerRelease,
      releases,
      popularTag,
      popularDls
    ].map(this._format.num);

    const message = [
      `In total: ${magenta(d)} downloads, ${magenta(a)} assets & ${magenta(r)} releases.`,
      `On average, each release receives ${blue(dpr)} downloads.`,
      `Most popular release is ${yellow(pt)} with ${yellow(pd)} downloads.`,
      `Latest release is ${green(lt)} created on ${green(ld)}.`
    ];

    log(message.join('\n'));
  }

  _display(repo, data, n) {
    log(`\nLast ${n >= data.length ? data.length : n} releases of ${underline(repo)} repository:\n`);

    data.slice(0, n).reverse().forEach(x => {
      this._displayRelease(x);
    });

    this._displayStats(data);
  }

  _get(path) {
    return new Promise((resolve, reject) => {
      const req = get(Object.assign(this._opts, {path}), res => {
        const body = [];

        res.on('data', x => body.push(x.toString('utf8')));

        res.on('end', () => {
          const {statusCode: sc} = res;
          const data = JSON.parse(body.join(''));

          if (sc < 200 || sc > 299) {
            reject(new Error(`Request to get data failed with HTTP status code: ${sc} - ${data.message}`));
          }

          resolve(data);
        });
      });

      req.on('error', err => reject(err));

      req.end();
    });
  }

  _getAll(repo) {
    return this._get(this._path.releases(repo));
  }

  _getLatest(repo) {
    return this._get(this._path.latest(repo));
  }

  async init(repo, n) {
    let [data, latest] = [];

    try {
      [data, latest] = await Promise.all([
        this._getAll(repo),
        this._getLatest(repo)
      ]);
    } catch (error) {
      return fatal(error);
    }

    this._latestRelease = Object.assign({}, latest);
    [data, n] = [this._formatData(data), this._format.listN(n)];

    this._display(repo, data, n);
  }
}

module.exports = new Rels();
