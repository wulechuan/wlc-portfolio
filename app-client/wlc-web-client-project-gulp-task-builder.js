const gulp = require('gulp');
const pathTool = require('path');

// gulp.task('external: test task', (onThisTaskDone) => {
// 	console.log(
// 		'外部任务获取成功！',
// 		'\n\n'
// 	);

// 	onThisTaskDone();
// });

const appRootDefaultPath = './app-client';
const configurationFileDefaultName = 'wlc-web-client-project-configuration';

const projectNameSuffix = '-'+Math.random().toFixed(10).slice(2);
const defaultMinimumConfiguration = {
	projectName: 'web-client-project'+projectNameSuffix,
	projectCaption: 'web-client-project'+projectNameSuffix,

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
				rootPath: 'scripts'
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

module.exports = function (appRootPath, configurationFileName) {
	if (typeof configurationFileName !== 'string') {
		configurationFileName = '';
	} else {
		configurationFileName = configurationFileName.trim();
	}


	if (typeof appRootPath !== 'string') {
		appRootPath = '';
	} else {
		appRootPath = appRootPath.trim();
	}

	if (!appRootPath && !configurationFileName) {
		appRootPath = appRootDefaultPath;
		configurationFileName = configurationFileDefaultName;
	} else {
		if (configurationFileName) {
			const fileNameContainsSlash = !!configurationFileName.match(/\//);
			const fileNameEndsWithADot = !!configurationFileName.match(/\.$/);
			const fileNameIsADot = !!configurationFileName.match(/^\.\ *[\/\\]?$/);
			const fileNameContainsInvalidFileExtesion =
				(fileNameEndsWithADot && !fileNameIsADot) ||
				!!configurationFileName.match(/\.\s+[\s\w]+$/)
				;

			if (fileNameContainsSlash || fileNameIsADot) {
				throw URIError('Invalid configuration file name: "'+configurationFileName+'".');
			}
			if (fileNameContainsInvalidFileExtesion) {
				throw URIError('Invalid file extension in configuration file name: "'+configurationFileName+'".');
			}
		} else {
			// Do not set it to default value here
			// Because we allow the appRootPath also containing the file name
		}

		if (!appRootPath) {
			appRootPath = appRootDefaultPath;
		} else if (!configurationFileName) {
			// const pathContainsSlash = !!appRootPath.match(/\//);
			const pathEndsWithADot = !!appRootPath.match(/\.$/);
			// const pathStartsWithADot = !!appRootPath.match(/^\./);
			const pathIsDot = !!appRootPath.match(/^\.\ *[\/\\]?$/);

			const pathContainsInvalidFileExtesion =
				(pathEndsWithADot && !pathIsDot) ||
				!!appRootPath.match(/\.\s+[\s\w]+$/)
				;

			// const pathIsSingleton = !pathContainsSlash && !pathIsDot;
			// const pathIsSingletonFolder = pathIsSingleton && !pathContainsFileExtension;
			// const pathIsSingletonFile   = pathIsSingleton &&  pathContainsFileExtension;
			// const pathContainsFolder   = pathIsSingletonFolder || pathIsDot || pathContainsSlash;

			if (pathContainsInvalidFileExtesion) {
				throw URIError('Invalid file extension found in "'+appRootPath+'".');
			}

			const pathContainsNonTerminalDot = !!appRootPath.match(/[^\\\/\s\.]+\s*\.\w+$/);
			const pathContainsFileName = pathContainsNonTerminalDot;

			if (pathContainsFileName) {
				const lastSlashInPath = appRootPath.search(/[\\\/](?![\s\.\w]*[\\\/])/);
				const fileNameInPath = appRootPath.slice(lastSlashInPath+1).trim();
				appRootPath = appRootPath.slice(0, lastSlashInPath);
				configurationFileName = fileNameInPath;
			} else {
				configurationFileName = configurationFileDefaultName;
			}
		}
	}








	const configurationFile = pathTool.resolve(appRootPath, configurationFileName);

	return new wlcClientProjectBuilder(configurationFile);










	function wlcClientProjectBuilder(configurationFile) {
		this.projectConfiguration = readConfigurationFile(configurationFile);
	}

	function readConfigurationFile(configurationFile) {
		const customizedConfiguration = require(configurationFile);

		const projectConfiguration = Object.assign(
			{},
			defaultMinimumConfiguration,
			customizedConfiguration
		);

		return projectConfiguration;
	}
};