/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * This script performs a simple check of the example containers for every page they were defined in.
 *
 * It checks if the number of rendered Handsontable instances is the same as the number of  Handsontable
 * initialization lines in the examples' code section.
 *
 * **Note:**
 * The documentation version that's being checked by the script needs to be pre-built using the build script, for
 * example:
 * `npm run docs:build`
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
const semver = require('semver');
const { logger } = require('../utils');
const {
  logCheck,
  sleep,
  firstUppercase,
  serveFiles,
  findExampleContainersInFiles,
  setupBrowser,
  fetchPermalinks,
  fetchPathsWithConditions,
  extendPermalink
} = require('./helpers');
const {
  getDocsFrameworkedVersions,
  getFrameworks
} = require('../../helpers');
const { testCases } = require('./testCases');

const [cliVersion] = process.argv.slice(2);
/**
 * Port to serve the static docs pages under.
 *
 * @type {number}
 */
const PORT = 8088;

/**
 * Timeout for the http server to serve all the documentation files.
 *
 * @type {number}
 */
const FILE_SERVE_TIMEOUT = 300;

/**
 * Timout for the examples to get initialized after loading the page.
 * @type {number}
 */
const EXAMPLE_INIT_TIMEOUT = 300;

/**
 * Number of tries to perform if the number of the rendered examples differs from the expected count.
 * @type {number}
 */
const CHECK_TRIES = 2;

(async() => {
  if (cliVersion !== 'next' && !semver.valid(`${cliVersion}.0`)) {
    logger.error('Invalid version number.');
    process.exit(1);
  }

  let FRAMEWORKS_TO_CHECK = ['javascript'];

  if (getDocsFrameworkedVersions('development').includes(cliVersion)) {
    FRAMEWORKS_TO_CHECK = getFrameworks();
  }

  serveFiles(PORT);

  // Wait for http-server to serve the files.
  await sleep(FILE_SERVE_TIMEOUT);

  const brokenExamplePaths = [];
  const suspiciousPaths = [];
  const searchResults = await findExampleContainersInFiles(cliVersion);
  const pathsWithConditions = fetchPathsWithConditions(cliVersion);
  const permalinks = fetchPermalinks(searchResults, cliVersion, pathsWithConditions);
  const {
    browser,
    page
  } = await setupBrowser();

  logger.info('Checking if the examples got rendered correctly:');

  /* eslint-disable no-await-in-loop */
  for (let f = 0; f < FRAMEWORKS_TO_CHECK.length; f++) {
    const framework = FRAMEWORKS_TO_CHECK[f];

    logger.info(`\n${firstUppercase(framework)} flavor:`);

    for (let i = 0; i < permalinks.length; i++) {
      if (permalinks[i].onlyFor && !permalinks[i].onlyFor.includes(framework)) {
        continue;
      }

      const permalink = extendPermalink(permalinks[i].permalink, framework, cliVersion);

      await page.goto(`http://localhost:${PORT}/docs${permalink}`, {});

      for (let testIndex = 0; testIndex < testCases.length; testIndex++) {
        let pageEvaluation = await page.evaluate(testCases[testIndex]);
        let tryCount = 0;

        // If the test fails, do another try after a timeout (some instances might have not been initialized yet).
        while (!pageEvaluation.result && tryCount < CHECK_TRIES) {
          tryCount++;

          // Wait for the HOT instances to initialize.
          await sleep(EXAMPLE_INIT_TIMEOUT);

          pageEvaluation = await page.evaluate(testCases[testIndex]);
        }

        if (pageEvaluation.error) {
          logger.error(`${permalink}: ${pageEvaluation.error}`);

        } else {
          // Mark the check as suspicious, if the expected number of instances is 0.
          logCheck(pageEvaluation.result, pageEvaluation.expected === 0);

          const errObj = {
            path: permalink,
            expected: pageEvaluation.expected,
            received: pageEvaluation.received
          };

          if (!pageEvaluation.result) {
            brokenExamplePaths.push(errObj);

          } else if (pageEvaluation.expected === 0) {
            suspiciousPaths.push(errObj);
          }
        }
      }
    }
  }
  /* eslint-enable no-await-in-loop */

  await browser.close();

  if (brokenExamplePaths.length > 0) {
    logger.error(`\nBroken examples found in: \n\n${brokenExamplePaths.map(
      entry =>
        `${entry.path}: Expected: ${entry.expected}, Received: ${entry.received}.`)
      .join('\n')}`
    );
    process.exit(1);

  }

  if (suspiciousPaths.length > 0) {
    logger.warn(
      `\nExpected 0 instances in: \n\n${suspiciousPaths.map(entry => `${entry.path}\n`).join('\n')}`
    );

    process.exit(1);
  }

  if (brokenExamplePaths.length === 0 && suspiciousPaths.length === 0) {
    logger.success(`\nDid not find any broken examples for version ${cliVersion}.`);
    process.exit(0);
  }
})();