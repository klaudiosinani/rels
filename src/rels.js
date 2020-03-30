'use strict';
const {get} = require('https');
const signale = require('signale');
const pkg = require('./../package.json');

signale.config({displayLabel: false});

const {fatal, log, note} = signale;

class Rels {
  constructor() {
    this._latestRelease = {};
    this._padding = new Array(6).join(' ');
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
      num: x => {
        if (x >= (10 ** 6)) {
          return (x / (10 ** 6)).toFixed(2) + 'm';
        }

        if (x >= (10 ** 3)) {
          return (x / (10 ** 3)).toFixed(2) + 'k';
        }

        return x;
      },
      underline: x => `\u001B[4m${x}\u001B[24m`
    };
  }

  _getPopular(data) {
    const dlsTagsDict = data.reduce((acc, x) => {
      acc[x.dls] = x.tag;
      return acc;
    }, {});

    const popularDls = Math.max(...Object.keys(dlsTagsDict));

    return {
      popularDls,
      popularTag: dlsTagsDict[popularDls]
    };
  }

  _releaseDls(x) {
    return x.assets.reduce((acc, asset) => acc + asset.download_count, 0);
  }

  _totalDls(data) {
    return data.reduce((acc, release) => acc + release.dls, 0);
  }

  _totalAssets(data) {
    return data.reduce((acc, release) => acc + release.assets, 0);
  }

  _badges(x) {
    const badges = [];

    if (x.isLatest) {
      badges.push('[Latest]');
    }

    if (x.isPrerelease) {
      badges.push('[Pre-release]');
    }

    return badges.join(' ');
  }

  _title(x) {
    return [
      `Release ${x.tag}`,
      this._badges(x)
    ].join(' ');
  }

  _formatData(data) {
    const result = [];

    data.forEach(release => {
      const {assets, created_at: date, prerelease: isPrerelease, tag_name: tag} = release;
      const {login: author} = release.author;

      result.push({
        assets: assets.length,
        author,
        date: this._format.date.short(date),
        dls: this._releaseDls(release),
        isLatest: tag === this._latest.tag,
        isPrerelease,
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
      `In total: ${d} downloads, ${a} assets & ${r} releases.`,
      `On average, each release receives ${dpr} downloads.`,
      `Most popular release is ${pt} with ${pd} downloads.`,
      `Latest release is ${lt} created on ${ld}.`
    ];

    log(message.join('\n'));
  }

  _display(repo, data, n) {
    log(`\nLast ${n >= data.length ? data.length : n} releases of ${repo} repository:\n`);

    data.slice(0, n).reverse().forEach(x => {
      this._displayRelease(x);
    });

    this._displayStats(data);
  }

  _get(path) {
    return new Promise((resolve, reject) => {
      const request = get(Object.assign(this._opts, {path}), response => {
        const body = [];

        response.on('data', x => body.push(x.toString('utf8')));

        response.on('end', () => {
          const {statusCode: sc} = response;
          const data = JSON.parse(body.join(''));

          if (sc < 200 || sc > 299) {
            reject(new Error(`Request to get data failed with HTTP status code: ${sc} - ${data.message}`));
          }

          resolve(data);
        });
      });

      request.on('error', err => reject(err));

      request.end();
    });
  }

  async _getReleaseData(repo) {
    const total = await this._get(this._path.releases(repo));

    if (Array.isArray(total) && total.length === 0) {
      throw new Error(`No available release data for the ${repo} repository`);
    }

    const latest = await this._get(this._path.latest(repo));

    return [total, latest];
  }

  async init(repo, n) {
    let [total, latest] = [];

    try {
      [total, latest] = await this._getReleaseData(repo);
    } catch (error) {
      return fatal(error);
    }

    this._latestRelease = Object.assign({}, latest);
    [total, n] = [this._formatData(total), this._format.listN(n)];

    this._display(repo, total, n);
  }
}

module.exports = new Rels();
