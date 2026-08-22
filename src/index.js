'use strict';

/**
 * src/index.js — Entry point
 * Delegates everything to cli.js.
 */

const { program } = require('./cli');

program.parseAsync(process.argv).catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
