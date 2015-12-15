var path = require('path');
var minimatch = require('minimatch');
var loaderUtils = require('loader-utils');
var unitCoverage = require('unit-coverage');

var Instrumenter = unitCoverage.Instrumenter;
var testDriverFactory = unitCoverage.testDriverFactory;
var fileSetFactory = unitCoverage.fileSetFactory;

module.exports = function(content) {
  var options = loaderUtils.parseQuery(this.query);
  options.root = options.root || process.cwd();
  options.testDriver = options.testDriver || 'mocha';
  options.fileSetName = options.fileSetName || 'simple';
  options.fileSetOptions = options.fileSetOptions || {};
  options.sources = options.sources || ['**/*.js'];
  options.tests = options.tests || [];

  var root = options.root;
  var sourceMasks = [].concat(options.sources);
  var testMasks = [].concat(options.tests);

  var testDriver = testDriverFactory.create(options.testDriver);
  if (!testDriver) {
    throw new Error('Driver "' + options.testDriver + '" not found');
  }

  var fileSet = fileSetFactory.create(options.fileSetName);
  if (!fileSet) {
    throw new Error('File set "' + options.fileSetName + '" not found');
  }

  fileSet.configure(options.fileSetOptions);
  var instrumenter = new Instrumenter(fileSet, root, {
    testDriver: testDriver,
    reportOnFileSave: false,
    export: false,
    exportFilename: null,
    apiObjectName: options.apiObjectName
  });

  var filename = this.resourcePath;
  var relativePath = path.relative(root, filename);
  if (filenameMatchesSomeOf(relativePath, testMasks)) {
    return instrumenter.instrumentTests(content, filename);
  } else if (filenameMatchesSomeOf(relativePath, sourceMasks)) {
    return instrumenter.instrument(content, filename);
  }

  return content;
};


/**
 * @param {String} filename
 * @param {String} pattern
 */
function filenameMatches(filename, pattern) {
  return minimatch(filename, pattern);
}

/**
 * @param {String} filename
 * @param {String[]} patterns
 */
function filenameMatchesSomeOf(filename, patterns) {
  return patterns.some(function (exclude) {
    return filenameMatches(filename, exclude);
  });
}

/**
 * @param {String|String[]} sources
 * @param {String|String[]} tests
 * @param {String} [testDriver=mocha]
 * @param {String} [fileSetName=simple]
 * @param {String} [apiObjectName]
 * @param {String} [root]
 * @typedef {Object} UnitCoverageLoaderOptions
 */
