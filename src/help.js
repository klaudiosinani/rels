'use strict';

module.exports = `
  Usage
    $ rels [<options> ...]

    Options
      --repo, -r         Repository to get analytics for
      --list, -l         Number of releases to be displayed
      --all, -a          Display all releases
      --help, -h         Display help message
      --version, -v      Display installed version

    Examples
      $ rels --repo klaussinani/tusk
      $ rels --repo klaussinani/tusk --all
      $ rels --repo klaussinani/tusk --list 3
`;
