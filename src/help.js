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
      $ rels --repo klaudiosinani/tusk
      $ rels --repo klaudiosinani/tusk --all
      $ rels --repo klaudiosinani/tusk --list 3
`;
