/**
 * configuration object
 */
var configuration = {
	projectName: 'wlc-2017-05',
	projectCaption: '吴乐川资料 2017-05',

	processArguments: {
		thoseStandForRelease: [
			'release',
			'production',
			'ship',
			'final',
			'publish'
		]
	},

	folderOfStages: {
		source:                  'source',
		buildForDev:             'build-dev',
		buildForRelease:         'build-release'
	},

	assets: {
		css: {
			shouldMinify: {
				dev: true,
				release: true
			},
			shouldGenerateSoureMaps: {
				dev: true,
				release: false
			},
			sourceGlobs: {
				rootPath: 'common/styles'
			},
			outputPaths: {
				rootPath: 'css'
			},
			preprocessing: {
				language: 'sass' // 'less', 'stylus', 'none'
			}
		},

		js: {
			shouldMinify: {
				dev: true,
				release: true
			},
			shouldGenerateSoureMaps: {
				dev: true,
				release: false
			},
			shouldStripConsoleLoggings: {
				dev: false,
				release: true
			},
			sourceGlobs: {
				rootPath: 'common/scripts'
			},
			outputPaths: {
				rootPath: 'js'
			},

			'gulp-uglify-options': {
				default: null,
				jsSnippetsInHTML: {
					mangle: false, // preserve human readable names for variables and functions

					output: { // http://lisperator.net/uglifyjs/codegen
						// DO NOT use "ie_proof" even if its mentioned in the doc in the uri above
						// ie_proof: false,  // output IE-safe code?

						beautify: true, // beautify output?
						comments: false, // output comments?
					},

					compress: { // http://lisperator.net/uglifyjs/compress
						sequences: false,  // concate multiple statements into single one, via the comma separators.
						hoist_funs: false, // move all function definitions to the very beginning of a closure
					}
				}
			}
		},

		html: {
			shouldMinify: {
				dev: true,
				release: true
			},
			'gulp-htmlmin-options': { // Using configuration.genOptionsForGulpHTMLMin() is recommanded against using this property directly
				preserveLineBreaks: true, // will be modified by configuration.genOptionsForGulpHTMLMin()
				collapseWhitespace: true, // will be modified by configuration.genOptionsForGulpHTMLMin()
				removeComments: true,
				collapseBooleanAttributes: true,
				removeAttributeQuotes: false,
				removeRedundantAttributes: true,
				removeEmptyAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true
			},
			sourceGlobs: {
				rootPath: ''
			},
			outputPaths: {
				// rootPath: 'pages'
			}
		}
	}
};

configuration.isRunningInReleasingMode = function(nodeProcessArguments) {
	if (!(configuration.processArguments
		&& Array.isArray(configuration.processArguments.thoseStandForRelease))
	) {
		return false;
	}

	const allowedInputs = configuration.processArguments.thoseStandForRelease;
	for (let i = 0; i < allowedInputs.length; i++) {
		let allowedInput = allowedInputs[i];
		if (typeof allowedInput !== 'string' || !allowedInput) {
			continue;
		}

		allowedInput = allowedInput.trim();

		if (nodeProcessArguments[allowedInput]) return true;
	}

	return false;
};

configuration.genOptionsForGulpHTMLMin = function (gulpRunningMode) {
	if (!(configuration.assets && configuration.assets.html)) {
		return null;
	}

	const htmlOptions = Object.assign({}, configuration.assets.html);

	const shouldMinifyHTML = !!htmlOptions.shouldMinify[gulpRunningMode];
	const htmlminOptions = htmlOptions['gulp-htmlmin-options'];

	htmlminOptions.preserveLineBreaks = !shouldMinifyHTML;
	htmlminOptions.collapseWhitespace = !shouldMinifyHTML;

	return htmlminOptions;
};

module.exports = configuration;