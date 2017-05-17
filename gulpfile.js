// 文件夹结构：
//
// {project-root}
//   └─ app-client
const folderNameClientAppRoot = 'app-client';
const fileNameWlcClientProjectConfigurationJS = 'wlc-client-project-configuration.js';

// import modules
const gulp = require('gulp');


// utilities
const fileSystem = require('fs');
const pathTool = require('path');
const getJoinedPathFrom = pathTool.join;
const rename = require('gulp-rename');
const del = require('del');
const pump = require('pump');
const runTasksInSequnce = require('gulp-sequence');
const naturalSort = require('gulp-natural-sort');
const resolveGlob = require('resolve-glob');


// file content modifiers
const removeLogging = require('gulp-remove-logging');
const concateFileGroups = require('gulp-group-concat');
const minifyCss = require('gulp-csso');
const uglifyJs = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');


const WLCClientProjectSettings = require(pathTool.join(folderNameClientAppRoot, fileNameWlcClientProjectConfigurationJS));
console.log('WLCClientProjectSettings', WLCClientProjectSettings);

// options and configurations
const processArguments = require('minimist')(process.argv.slice(2));
const isToBuildForRelease =
	processArguments.release ||
	processArguments.production ||
	processArguments.ship ||
	processArguments.final
	;

const isToDevelopWithWatching = !isToBuildForRelease;



// dev environment configurations
let shouldMinifyCssFiles = true;
let shouldMinifyAllJsFiles = true;
let shouldMinifyJsFilesForInjections = true; // Remember that injected js codes have *NO* sourceMaps.
let shouldStripConsoleLoggingsFromJsFiles = false;
let shouldStripConsoleLoggingsFromJsFilesForInjections = false;

let shouldGenerateMapFilesForJs = true;
let shouldGenerateMapFilesForCss = true;







const groupConcatBuildingOptionsForThirdPartyCss = {
	taskNameForLogging: 'CSS: 3rd-Party',
	searchingBases: [
		'third-party',
	],
	fileMatchingPatterns: ['*.css'],
	outputFileNameSuffix: '.min',
	outputFileExtension: 'css',
	// shouldNotAppendSuffix: false,
	shouldEvalutateRelativePathToCWD: true
};

const groupConcatBuildingOptionsForAppCss = {
	taskNameForLogging: 'CSS: app',
	searchingBases: [
		'app',
	],
	fileMatchingPatterns: ['*.css'],
	outputFileNameSuffix: '.min',
	outputFileExtension: 'css',
	// shouldNotAppendSuffix: false,
	shouldEvalutateRelativePathToCWD: true
};

const groupConcatBuildingOptionsForThirdPartyJs = {
	taskNameForLogging: 'Javascript: 3rd-Party',
	searchingBases: [
		'merge-into=third-party-*/',
	],
	fileMatchingPatterns: ['*.js'/*, '*.ts'*/],
	outputFileNameSuffix: '.min',
	outputFileExtension: 'js',
	shouldEvalutateRelativePathToCWD: true,
};

const groupConcatBuildingOptionsForAppJs = {
	taskNameForLogging: 'Javascript: app',
	searchingBases: [
		'/'
	],
	fileMatchingPatterns: ['*.js'/*, '*.ts'*/],
	// nameMatchingPatternForFoldersAsAModule: 'mergin-into=*',
	outputFileNameSuffix: '.min',
	outputFileExtension: 'js',
	// shouldNotAppendSuffix: false,
	shouldIncludeNestedEntries: false,
	shouldEvalutateRelativePathToCWD: true,
	shouldLog: false
};


const settingsForRemovingLoggingForJsFiles = {
	// namespace: [],
	methods: [
		// 'info',
		// 'error',
		// 'warn',
		'group',
		'groupEnd',
		'log',
		'debug'
	]
};

let minificationOptionsForJsFilesForInjections = {
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
};













// printing colorful logs in CLI
const logger = (function createColorfulLogger(rawLogger, globalOptions) {
	'use stric';

	const chalk = require('chalk');
	const moduleCaption = 'colorful-logger';
	const moduleCaption2 = moduleCaption + ':';



	const rawMethodsBackup = {
		log: rawLogger.log,
		info: rawLogger.info,
		warn: rawLogger.warn,
		trace: rawLogger.trace,
		error: rawLogger.error
	};



	globalOptions = globalOptions || {};

	const logLines = {};

	['-', '=', '*', '~', '.', '#'].forEach(function (char, i, allChars) {
		logLines[char] = '\n' + char.repeat(79) + '\n';
	});

	const shouldOverrideRawMethods = !!globalOptions.shouldOverrideRawMethods;
	const shouldPrefixPlainLoggingsIfNotOverrided = !!globalOptions.shouldPrefixPlainLoggingsIfNotOverrided && !shouldOverrideRawMethods;
	const shouldNotShowTimeStamp = !!globalOptions.shouldNotShowTimeStamp;

	const prefixFgColor = getValidColor(globalOptions.prefixColor, false) || 'blue';
	const prefixBgColor = getValidColor(globalOptions.prefixColor, true ) || '';

	const suffixFgColor = getValidColor(globalOptions.suffixColor, false) || 'blue';
	const suffixBgColor = getValidColor(globalOptions.suffixColor, true ) || '';

	const timeStampBracketsFgColor = getValidColor(globalOptions.timeStampBracketsFgColor, false) || 'gray';
	const timeStampBracketsBgColor = getValidColor(globalOptions.timeStampBracketsBgColor, false) || '';

	const timeStampTextFgColor = getValidColor(globalOptions.timeStampTextFgColor, false) || 'magenta';
	const timeStampTextBgColor = getValidColor(globalOptions.timeStampTextBgColor, false) || '';


	const globalPrefix = tryToColorize(globalOptions.prefix, prefixFgColor, prefixBgColor);
	const globalSuffix = tryToColorize(globalOptions.suffix, suffixFgColor, suffixBgColor);

	const timeStampBracketsChalk = createChalkFrom(timeStampBracketsFgColor, timeStampBracketsBgColor);
	const timeStampTextChalk = createChalkFrom(timeStampTextFgColor, timeStampTextBgColor);


	const _fakeChalk = chalk.reset;

	const logger = {};

	logger.chalk = chalk;
	logger.logLines = logLines;
	logger.createChalkFrom = createChalkFrom;

	logger.warnEMChalk = createChalkFrom('black', 'yellow');
	logger.infoEMChalk = createChalkFrom('blue', 'cyan');
	logger.errorEMChalk = createChalkFrom('white', 'red');

	const _errorChalkBeforeThisConstructedCompletely = chalk.white.bgRed;

	logger.formatJSON = function (input) {
		return JSON.stringify(input, null, 4);
	};

	_buildLoggingLevelAccordingToGlobalOptions.call(logger, 'log', {
		shouldNotShowTimeStamp: shouldNotShowTimeStamp,
		// prefix: 'log >>>',
		// suffix: '',
		defaultFgColor: 'black',
		defaultBgColor: ''
	});

	_buildLoggingLevelAccordingToGlobalOptions.call(logger, 'info', {
		shouldNotShowTimeStamp: shouldNotShowTimeStamp,
		// prefix: 'info >>>',
		// suffix: '',
		defaultFgColor: 'cyan',
		defaultBgColor: ''
	});

	_buildLoggingLevelAccordingToGlobalOptions.call(logger, 'warn', {
		shouldNotShowTimeStamp: shouldNotShowTimeStamp,
		// prefix: 'warn >>>',
		// suffix: '',
		defaultFgColor: 'yellow',
		defaultBgColor: ''
	});

	_buildLoggingLevelAccordingToGlobalOptions.call(logger, 'trace', {
		shouldNotShowTimeStamp: shouldNotShowTimeStamp,
		// prefix: 'trace >>>',
		// suffix: '',
		defaultFgColor: 'blue',
		defaultBgColor: ''
	});

	_buildLoggingLevelAccordingToGlobalOptions.call(logger, 'error', {
		shouldNotShowTimeStamp: shouldNotShowTimeStamp,
		// prefix: 'error >>>',
		// suffix: '',
		defaultFgColor: 'red',
		defaultBgColor: ''
	});

	return logger;




	function getValidColor(color, shouldBeTreatedAsABgColor) {
		if (typeof color !== 'string' || !color) return '';
		color = color.trim();

		supportedColors = Object.keys(chalk.styles);

		let isValid = false;

		for (let supportedColor of supportedColors) {
			if (supportedColor === color) {
				isValid = true;
				break;
			}
		}

		if (isValid && shouldBeTreatedAsABgColor) {
			if (!color.match(/^bg[RYGCBMW]/)) {
				color = 'bg' + color.slice(0, 1).toUpperCase() + color.slice(1);
			}
		}

		return isValid ? color : '';
	}

	function createChalkFrom(fgColor, bgColor) {
		let newChalk;

		fgColor = getValidColor(fgColor) || '';
		bgColor = getValidColor(bgColor, true) || '';

		if (fgColor || bgColor) {
			newChalk = chalk;

			if (fgColor) {
				newChalk = newChalk[fgColor];
			}

			if (bgColor) {
				newChalk = newChalk[bgColor];
			}
		}

		return newChalk; // might be undefined
	}

	function tryToColorize(stringOrAnotherChalk, fgColor, bgColor) {
		if (typeof stringOrAnotherChalk !== 'string' || !stringOrAnotherChalk) return '';

		let newChalk = createChalkFrom(fgColor, bgColor);
		if (newChalk) {
			return newChalk(stringOrAnotherChalk);
		}

		return stringOrAnotherChalk;
	}

	function loggingLevelIsValid(loggingLevel) {
		if (typeof loggingLevel !== 'string' || !loggingLevel) return false;
		loggingLevel.trim().toLowerCase();

		const validLoggingLevels = ['log', 'info', 'warn', 'trace', 'debug', 'error'];

		let isValid = false;
		for (let validLoggingLevel of validLoggingLevels) {
			if (loggingLevel === validLoggingLevel) {
				isValid = true;
				break;
			}
		}

		return isValid;
	}

	function _buildLoggingLevelAccordingToGlobalOptions(loggingLevel, optionsForThisLevel) {
		if (!loggingLevelIsValid(loggingLevel)) {
			rawMethodsBackup.error(chalk.red(
				moduleCaption2+ 'Invalid logging level/method:',
				'"' + _errorChalkBeforeThisConstructedCompletely(loggingLevel) + '"'
			));

			return false;
		}

		let loggingLevelRawMethod = rawMethodsBackup[loggingLevel];
		if (typeof loggingLevelRawMethod !== 'function') {
			rawMethodsBackup.error(chalk.red(
				moduleCaption2+ 'Unsupported logging level/method:',
				'"' + _errorChalkBeforeThisConstructedCompletely(loggingLevel) + '"'
			));

			return false;
		}


		optionsForThisLevel = optionsForThisLevel || {};

		const loggingLevelRawMethodName = 'raw' + loggingLevel.slice(0, 1).toUpperCase() + loggingLevel.slice(1);

		const fgColor =
			getValidColor(globalOptions[loggingLevel+'FgColor'], false) ||
			getValidColor(optionsForThisLevel.defaultFgColor, false);

		const bgColor =
			getValidColor(globalOptions[loggingLevel+'BgColor'], true) ||
			getValidColor(optionsForThisLevel.defaultBgColor, true);

		const msgChalk = createChalkFrom(fgColor, bgColor);
		const loggingLevelChalkName = loggingLevel + 'Chalk';


		const prefixForThisMethod = optionsForThisLevel.prefix || '';
		const suffixForThisMethod = optionsForThisLevel.suffix || '';

		const shouldPrefixPlainLoggingsForThisMethod = shouldPrefixPlainLoggingsIfNotOverrided && !!globalPrefix;
		const shouldNotShowTimeStamp = !!optionsForThisLevel.shouldNotShowTimeStamp;


		this[loggingLevelRawMethodName] = loggingLevelRawMethod; // Always save the raw method

		this[loggingLevelChalkName] = msgChalk || _fakeChalk; // export/publish the chalk for free usage

		// rawMethodsBackup.info('shouldPrefixPlainLoggingsForThisMethod =', shouldPrefixPlainLoggingsForThisMethod);

		// creating new method
		if (shouldPrefixPlainLoggingsForThisMethod) {
			this[loggingLevel] = __logginMethodCoreFunction.bind(rawLogger, globalPrefix);
		} else {
			this[loggingLevel] = __logginMethodCoreFunction.bind(rawLogger);
		}

		if (shouldOverrideRawMethods) {
			rawLogger[loggingLevel] = this[loggingLevel];
		}



		function __logginMethodCoreFunction() {
			let loggingArguments1 = Array.prototype.slice.apply(arguments);

			if (prefixForThisMethod) {
				loggingArguments1.unshift(prefixForThisMethod);
			}

			// utilizing chalk.reset to easily strinify arguments before hand.
			loggingArguments1 = msgChalk ? msgChalk.apply(rawLogger, loggingArguments1) : chalk.reset(loggingArguments1);


			const loggingArguments2 = [loggingArguments1];

			if (!shouldNotShowTimeStamp) {
				let time = new Date();
				let tH = time.getHours();
				let tM = time.getMinutes();
				let tS = time.getSeconds();

				tH = (tH < 10 ? '0' : '') + tH;
				tM = (tM < 10 ? '0' : '') + tM;
				tS = (tS < 10 ? '0' : '') + tS;

				let timeStampText = tH + ':' + tM + ':' + tS;
				if (timeStampTextChalk) {
					timeStampText = timeStampTextChalk(timeStampText);
				}

				let timeStampFull;
				if (timeStampBracketsChalk) {
					timeStampFull = timeStampBracketsChalk('[' + timeStampText + ']');
				} else {
					timeStampFull = '[' + timeStampText + ']';
				}

				loggingArguments2.unshift(timeStampFull);
			}

			if (suffixForThisMethod) {
				loggingArguments2.push(suffixForThisMethod);
			}

			if (shouldOverrideRawMethods && globalPrefix) {
				loggingArguments2.unshift(globalPrefix);
			}

			if (globalSuffix) {
				loggingArguments2.push(globalSuffix);
			}

			loggingLevelRawMethod.apply(rawLogger, loggingArguments2);
		};
	}
})(global.console, {
	prefix: projectCaption,
	shouldOverrideRawMethods: true, // console.error === logger.error, console.log === logger.log, so on so forth
	shouldPrefixPlainLoggingsIfNotOverrided: true,
	shouldNotShowTimeStamp: true
});

const chalk = logger.chalk;

const logLine = logger.logLines['='];
const formatJSON = logger.formatJSON;

const colorfulLog = logger.log;
const colorfulInfo = logger.info;
const colorfulWarn = logger.warn;
const colorfulError = logger.error;

const logChalk = logger.logChalk;
const infoChalk = logger.infoChalk;
const infoEMChalk = logger.infoEMChalk;
const warnChalk = logger.warnChalk;
const warnEMChalk = logger.warnEMChalk;
const errorChalk = logger.errorChalk;
const errorEMChalk = logger.errorEMChalk;
const cheersChalk = chalk.bgGreen.black;







// initialize some variable
shouldMinifyJsFilesForInjections = shouldMinifyAllJsFiles && shouldMinifyJsFilesForInjections;
// shouldStripConsoleLoggingsFromJsFiles = shouldStripConsoleLoggingsFromJsFiles && shouldMinifyJsFiles;
shouldStripConsoleLoggingsFromJsFilesForInjections = shouldStripConsoleLoggingsFromJsFilesForInjections && shouldMinifyJsFilesForInjections;
shouldGenerateMapFilesForJs = shouldGenerateMapFilesForJs && (shouldMinifyAllJsFiles || shouldStripConsoleLoggingsFromJsFiles);
shouldGenerateMapFilesForCss = shouldGenerateMapFilesForCss && shouldMinifyCssFiles;

if (shouldMinifyJsFilesForInjections) {
	minificationOptionsForJsFilesForInjections = null;
}

// build up fullpaths and globs
const pathForCssSourceFiles = getJoinedPathFrom(pathForClientAppRoot, folderOfCssFiles, folderOfCssSourceFiles);
const pathForCssOutputFiles = getJoinedPathFrom(pathForClientAppRoot, folderOfCssFiles, folderOfCssOutputFiles);
const pathForJsSourceFilesToMerge = getJoinedPathFrom(pathForClientAppRoot, folderOfJsFiles, folderOfJsSourceFilesToMerge);
const pathForJsOutputFilesToMerge = getJoinedPathFrom(pathForClientAppRoot, folderOfJsFiles, folderOfJsOutputFilesToMerge);
const pathForJsSourceAppFilesToProcessEachAlone = getJoinedPathFrom(pathForClientAppRoot, folderOfJsFiles, folderOfJsSourceAppFilesToProcessEachAlone);
const pathForJsOutputAppFilesToProcessEachAlone = getJoinedPathFrom(pathForClientAppRoot, folderOfJsFiles, folderOfJsOutputAppFilesToProcessEachAlone);
const pathForJsSourceLibFilesToProcessEachAlone = getJoinedPathFrom(pathForClientAppRoot, folderOfJsFiles, folderOfJsSourceLibFilesToProcessEachAlone);
const pathForJsOutputLibFilesToProcessEachAlone = getJoinedPathFrom(pathForClientAppRoot, folderOfJsFiles, folderOfJsOutputLibFilesToProcessEachAlone);
const pathForJsSourceFilesForInjections = getJoinedPathFrom(pathForClientAppRoot, folderOfJsFiles, folderOfJsSourceFilesForInjections);
const pathForJsOutputFilesForInjections = getJoinedPathFrom(pathForClientAppRoot, folderOfJsFiles, folderOfJsOutputFilesForInjections);

const globsCssSourceFiles = [
	getJoinedPathFrom(pathForCssSourceFiles, '**/*.css'),
	'!' + getJoinedPathFrom(pathForCssOutputFiles, '**/*') // just in case the output folder is a sub folder of the source folder
];

const globsJsSourceFilesToMerge = [
	getJoinedPathFrom(pathForJsSourceAppFilesToProcessEachAlone, '**/functions*.js'),
	getJoinedPathFrom(pathForJsSourceFilesToMerge, '**/*.js'),
];

const globsJsSourceAppFilesToProcessEachAlone = [
	getJoinedPathFrom(pathForJsSourceAppFilesToProcessEachAlone, '**/*.js'),
	'!'+getJoinedPathFrom(pathForJsSourceAppFilesToProcessEachAlone, '**/functions-extra.js')
];
const globsJsSourceLibFilesToProcessEachAlone = [
	getJoinedPathFrom(pathForJsSourceLibFilesToProcessEachAlone, 'to-minify/**/*.js')
];
const globsJsSourceLibFilesToProcessEachAloneAsIs = [
	getJoinedPathFrom(pathForJsSourceLibFilesToProcessEachAlone, 'as-is/**/*.js')
];

const globsJsSourceFilesForInjections = [
	getJoinedPathFrom(pathForJsSourceFilesForInjections, '**/*.js'),
];

const globsToWatch = []
	.concat(globsCssSourceFiles)
	.concat(globsJsSourceAppFilesToProcessEachAlone)
	.concat(globsJsSourceLibFilesToProcessEachAlone)
	.concat(globsJsSourceFilesToMerge)
	.concat(globsJsSourceFilesForInjections);









colorfulInfo(
	logLine,
	'Preparing globs and tasks...',
	logLine
);

// evaluate group-concat settings via building options
groupConcatBuildingOptionsForThirdPartyCss.searchingBases = 
	groupConcatBuildingOptionsForThirdPartyCss.searchingBases.map((glob) => {
		return getJoinedPathFrom(pathForCssSourceFiles, glob) + '/';
	});
const groupConcatSettingsForThirdPartyCss = evaluateGroupConcateOptionsViaFoldersAsAModule(
	groupConcatBuildingOptionsForThirdPartyCss
);


groupConcatBuildingOptionsForAppCss.searchingBases =
	groupConcatBuildingOptionsForAppCss.searchingBases.map((glob) => {
		return getJoinedPathFrom(pathForCssSourceFiles, glob) + '/';
	});
const groupConcatSettingsForAppCss = evaluateGroupConcateOptionsViaFoldersAsAModule(
	groupConcatBuildingOptionsForAppCss
);


groupConcatBuildingOptionsForThirdPartyJs.searchingBases =
	groupConcatBuildingOptionsForThirdPartyJs.searchingBases.map((glob) => {
		return getJoinedPathFrom(pathForJsSourceFilesToMerge, glob) + '/';
	});
const groupConcatSettingsForThirdPartyJs = evaluateGroupConcateOptionsViaFoldersAsAModule(
	groupConcatBuildingOptionsForThirdPartyJs
);


groupConcatBuildingOptionsForAppJs.searchingBases =
	groupConcatBuildingOptionsForAppJs.searchingBases.map((glob) => {
		return getJoinedPathFrom(pathForJsSourceFilesToMerge, glob) + '/';
	});
const groupConcatSettingsForAppJs = evaluateGroupConcateOptionsViaFoldersAsAModule(
	groupConcatBuildingOptionsForAppJs
);
groupConcatSettingsForAppJs['functions.min.js'] = [
	getJoinedPathFrom(pathForJsSourceAppFilesToProcessEachAlone, '**/functions-core.js'),
	getJoinedPathFrom(pathForJsSourceAppFilesToProcessEachAlone, '**/functions-extra.js')
];






colorfulLog(
	'Minification settings for Javascript to inject:',
	formatJSON(minificationOptionsForJsFilesForInjections),
	'\n'
);



function evaluateGroupConcateOptionsViaFoldersAsAModule(options) {
	const moduleCaption = 'folders-as-a-module';
	const moduleCaption2 = moduleCaption + ': ';
	const defaultFolderMatchingPattern = 'merge-into=*';


	const getFlattenArray = require('array-flatten');
	const pathTool = require('path');
	const getFileBaseNameFrom = pathTool.basename;


	// const logger = require('colorful-logger');
	const formatJSON = logger.formatJSON;

	const colorfulLog = logger.log;
	const colorfulInfo = logger.info;
	const colorfulWarn = logger.warn;
	const colorfulError = logger.error;

	const infoChalk = logger.infoChalk;
	const infoEMChalk = logger.infoEMChalk;
	const warnEMChalk = logger.warnEMChalk;
	const errorEMChalk = logger.errorEMChalk;




	options = options || {};

	const taskName = (options.taskNameForLogging || '<unknown task>') + '';

	const shouldLog = !!options.shouldLog;
	const shouldNotAppendSuffix = !!options.shouldNotAppendSuffix;
	const shouldIncludeNestedEntries = !!options.shouldIncludeNestedEntries;
	const shouldEvalutateRelativePathToCWD = !!options.shouldEvalutateRelativePathToCWD;


	const validSearchingBaseGlobs = _validateSearchingBaseGlobs(options.searchingBases);
	const validFileMatchingPatterns = _validateFileMatchingPatterns(options.fileMatchingPatterns);
	const folderNameMatchingOptions = _evaluateFolderMatchingOptions(options.nameMatchingPatternForFoldersAsAModule);

	const folderNameDeeplyMatchingPattern = folderNameMatchingOptions.folderNameDeeplyMatchingPattern;
	const folderNameMatchingPatternPrefixEscaped = folderNameMatchingOptions.folderNameMatchingPatternPrefixEscaped;


	const outputFileNameSuffix = (options.outputFileNameSuffix || '') + '';
	let outputFileExtension = (options.outputFileExtension || '') + '';

	if (!outputFileExtension) {
		colorfulWarn(moduleCaption2+ 'The output file extension is not specified!');
	}

	outputFileExtension = outputFileExtension.replace(/^\.+/, '');








	let nonDuplicatedOutputFilePaths = {};

	let outputFileNameSuffixEscaped = outputFileNameSuffix.replace(/([\.\-\=\^])/g, '\\$1');

	let regExpForExt = new RegExp('\\.'+outputFileExtension+'$');
	let regExpForSuffix = new RegExp(outputFileNameSuffixEscaped+'$');


	const prefixOfAbsolutePaths = process.cwd() + '/';

	let globallyFoundFilesCount = 0;
	for (let searchingBase of validSearchingBaseGlobs) {
		_evaluateFilesForOneSearchingBaseGlob(searchingBase);
	}

	colorfulInfo(
		moduleCaption2+
		errorEMChalk(taskName),
		'matched', errorEMChalk(globallyFoundFilesCount),
		'file'+(globallyFoundFilesCount > 1 ? '' : 's'),
		'in total.'
	);



	return nonDuplicatedOutputFilePaths;



	function _validateSearchingBaseGlobs(searchingBaseGlobs) {
		if (!searchingBaseGlobs || (typeof searchingBaseGlobs !== 'string' && !Array.isArray(searchingBaseGlobs))) {
			throw TypeError(colorfulError(
				moduleCaption2+
				errorEMChalk('Invalid searching base glob(s):'),
				formatJSON(searchingBaseGlobs)
			));
		}

		let inputItems = getFlattenArray.from(searchingBaseGlobs);
		let validItems = [];
		for (let baseGlob of inputItems) {
			baseGlob = baseGlob.trim();

			if (baseGlob.match(/^!/)) {
				colorfulWarn(
					moduleCaption2+
					'Invalid searching base glob',
					'"'+warnEMChalk(baseGlob)+'"'+'.',
					warnEMChalk('Skipped')+'.',
					'Negative glob is simply not supported.\n'
				);
				continue;
			}

			if (!baseGlob.match(/[\/\\]$/)) {
				colorfulWarn(
					moduleCaption2+
					'Invalid searching base glob',
					'"'+warnEMChalk(baseGlob)+'"'+'.',
					warnEMChalk('Skipped')+'.',
					'\nTip:\n    A valid searching base '+chalk.white.bgBlue('must end with single "/" or "\\"')
					+'.\n'
				);
				continue;
			}

			validItems.push(baseGlob);
		}

		if (validItems.length < 1) {
			throw TypeError(colorfulError(
				moduleCaption2+
				'Zero valid searching base globs was found!',
				'\nThe input was:',
				formatJSON(searchingBaseGlobs)
			));
		}

		shouldLog && colorfulInfo(
			moduleCaption2+
			'Filtered valid searching base globs:',
			formatJSON(validItems),
			'\n'
		);

		return validItems;
	}

	function _validateFileMatchingPatterns(fileMatchingPatterns) {
		let noValidItemsAtAll = !fileMatchingPatterns;

		if (!noValidItemsAtAll) {
			if (typeof fileMatchingPatterns !== 'string' && !Array.isArray(fileMatchingPatterns)) {
				throw TypeError(colorfulError(
					errorEMChalk('Invalid file matching patterns!'),
					formatJSON(fileMatchingPatterns)
				));
			}

			let inputItems = getFlattenArray.from(fileMatchingPatterns);
			let validItems = [];
			for (let item of inputItems) {
				if (!item || typeof item !== 'string' || item.match(/[\\\/]/) || item.match(/\*{2,}/)) {
					colorfulWarn(
						moduleCaption2+
						'Invalid file matching glob',
						'"' + warnEMChalk(item) + '"'
					);
					continue;
				}

				validItems.push(item.trim());
			}

			if (validItems.length < 1) {
				noValidItemsAtAll = true;
			} else {
				return validItems;
			}
		}

		if (noValidItemsAtAll) {
			colorfulWarn(
				moduleCaption2+
				'No valid file matching glob at all! All files with all types will be matched!',
				'\nThe input was:',
				formatJSON(fileMatchingPatterns)
			);
		}

		return ['*'];
	}

	function _evaluateFolderMatchingOptions(folderNameMatchingPatternRawInput) {
		let folderNameMatchingPatternRawEvaluated;
		if (typeof folderNameMatchingPatternRawInput === 'string') {
			folderNameMatchingPatternRawEvaluated = folderNameMatchingPatternRawInput.trim();
		} else {
			folderNameMatchingPatternRawEvaluated = '';
		}

		folderNameMatchingPatternRawEvaluated = folderNameMatchingPatternRawEvaluated || defaultFolderMatchingPattern;

		let folderNameMatchingPatternPrefix = folderNameMatchingPatternRawEvaluated;

		// remove '\' or '/' chars at terminals
		folderNameMatchingPatternPrefix = folderNameMatchingPatternPrefix.replace(/[\/\\]+$/, '').replace(/^[\/\\]+/, '');

		// remove a '*' at end if found
		folderNameMatchingPatternPrefix = folderNameMatchingPatternPrefix.replace(/\*$/, '');

		// There should NOT exist any '\' or '/' in the middle of the pattern string
		if (folderNameMatchingPatternPrefix.match(/[\\\/\*\?]/)) {
			throw Error(colorfulError(
				moduleCaption2+
				'The folder name matching pattern',
				'("'+errorEMChalk(folderNameMatchingPatternRawEvaluated)+'")',
				'is invalid.',
				'It should NOT contain any "\\", "/", "?" or "*" in the middle!',
				'Nor should it contain more than one "*" at the tail.'
			));
		}

		const folderNameMatchingPattern = folderNameMatchingPatternPrefix + '*';
		const folderNameDeeplyMatchingPattern = '**/' + folderNameMatchingPattern + '/';
		const folderNameMatchingPatternPrefixEscaped = folderNameMatchingPatternPrefix.replace(/([\.\-\=\^])/g, '\\$1');

		return {
			folderNameMatchingPattern,
			folderNameDeeplyMatchingPattern,
			folderNameMatchingPatternPrefix,
			folderNameMatchingPatternPrefixEscaped
		};
	}

	function _evaluateFilesForOneSearchingBaseGlob(searchingBaseGlob) {
		const searchingGlobs = [];
		const searchingBaseGlobItselfIsAMatch = !!getFileBaseNameFrom(searchingBaseGlob)
			.match(RegExp('^'+folderNameMatchingPatternPrefixEscaped));

		if (searchingBaseGlobItselfIsAMatch) {
			searchingGlobs.push(searchingBaseGlob);
			if (!shouldIncludeNestedEntries) {
				searchingGlobs.push('!' + searchingBaseGlob + folderNameDeeplyMatchingPattern);
			}
		} else {
			searchingGlobs.push(searchingBaseGlob + folderNameDeeplyMatchingPattern);
			if (!shouldIncludeNestedEntries) {
				searchingGlobs.push('!' + searchingBaseGlob + folderNameDeeplyMatchingPattern + folderNameDeeplyMatchingPattern);
			}
		}

		let allMatchedFoldersAsAModule = resolveGlob.sync(searchingGlobs);

		if (shouldLog) {
			colorfulLog(
				moduleCaption2+
				'Processing searching base path:',
				infoChalk(formatJSON(searchingGlobs)),
				'\n\nallMatchedFoldersAsAModule:',
				infoChalk(formatJSON(allMatchedFoldersAsAModule))
			);
		}

		for (let pathToFolderAsAModule of allMatchedFoldersAsAModule) {
			_evaluteFilesForOneFolder(searchingBaseGlob, pathToFolderAsAModule);
		}
	}

	function _evaluteFilesForOneFolder(searchingBaseGlob, pathToFolderAsAModule) {
		let outputFileName = getFileBaseNameFrom(pathToFolderAsAModule)
			.replace(new RegExp('^'+folderNameMatchingPatternPrefixEscaped), '')
			.replace(regExpForExt, '')
			.replace(regExpForSuffix, '')
		;

		outputFileName += (shouldNotAppendSuffix ? '' : outputFileNameSuffix) + '.' + outputFileExtension;

		let outputFilePath = outputFileName;

		if (nonDuplicatedOutputFilePaths[outputFilePath]) {
			throw Error(colorfulError(
				moduleCaption2+
				'Output file path duplicated from different globs!',
				'\nThe duplicated output file path is:',
				'"' + errorEMChalk(outputFilePath) + '"\n'
			));
		}

		const allGlobsToResolve = [];
		for (let fileMatchingPattern of validFileMatchingPatterns) {
			allGlobsToResolve.push(pathToFolderAsAModule+'/**/'+fileMatchingPattern);
		}


		// must exclude any folder or file whose name starts with an "!".
		allGlobsToResolve.push(
			'!' + prefixOfAbsolutePaths + searchingBaseGlob + '**/!*/*'
		);
		allGlobsToResolve.push(
			'!' + prefixOfAbsolutePaths + searchingBaseGlob + '**/!*'
		);



		// colorfulInfo(formatJSON(allGlobsToResolve));

		const allFilesInThisPath = resolveGlob.sync(allGlobsToResolve, {
			nodir: true,
			nosort: false
		});

		if (!shouldEvalutateRelativePathToCWD) {
			nonDuplicatedOutputFilePaths[outputFilePath] = allFilesInThisPath;
		} else {
			nonDuplicatedOutputFilePaths[outputFilePath] = allFilesInThisPath.map(function (fileFullPath) {
				return fileFullPath.replace(prefixOfAbsolutePaths, '');
			});
		}

		globallyFoundFilesCount += nonDuplicatedOutputFilePaths[outputFilePath].length;


		shouldLog && colorfulLog(
			moduleCaption2+
			'Matched files under ['+infoChalk(outputFilePath)+']:',
			infoChalk(formatJSON(nonDuplicatedOutputFilePaths[outputFilePath]))
		);
	}
}




(function setupAllCSSTasks() {
	// colorfulLog(
	//     'Css globs of app:',
	//     chalk.green(formatJSON(groupConcatSettingsForAppCss)),
	//     '\n'
	// );

	gulp.task('styles: remove old built files', () => {
		return del([
			getJoinedPathFrom(pathForCssOutputFiles, '**/*')
		]);
	});

	gulp.task('styles: merge third party libs', (onThisTaskDone) => {
		colorfulLog(
			'Css globs of third-party libs:',
			chalk.green(formatJSON(groupConcatSettingsForThirdPartyJs)),
			'\n\n'
			+errorEMChalk(
				' WARNING! '
				+'\n  Both human readable version and minified version '
				+'\n  of a third-party plugin will be included if they both exist! '
			)
			+'\n\n'+
			errorEMChalk(
				' 注意！ '
				+'\n  如果一个插件的《易读版》和《压缩版》均存在，'
				+'\n  那么两个文件都会被包含进合并的css！ '
			)+'\n\n'
		);

		let tasksToPump = [];

		tasksToPump.push(gulp.src(globsCssSourceFiles));
		tasksToPump.push(naturalSort());
		tasksToPump.push(concateFileGroups(groupConcatSettingsForThirdPartyCss));
		tasksToPump.push(gulp.dest(pathForCssOutputFiles));

		pump(tasksToPump, onThisTaskDone);
	});

	gulp.task('styles: build for app', (onThisTaskDone) => {
		let tasksToPump = [];

		tasksToPump.push(gulp.src(globsCssSourceFiles));
		tasksToPump.push(naturalSort());

		if (shouldGenerateMapFilesForCss) {
			tasksToPump.push(sourcemaps.init());
		}

		if (shouldMinifyCssFiles) {
			tasksToPump.push(minifyCss());
		}

		tasksToPump.push(concateFileGroups(groupConcatSettingsForAppCss));

		if (shouldGenerateMapFilesForCss) {
			tasksToPump.push(sourcemaps.write('.'));
		}

		tasksToPump.push(gulp.dest(pathForCssOutputFiles));

		pump(tasksToPump, onThisTaskDone);
	});

	gulp.task('styles: all', (onThisTaskDone) => {
		runTasksInSequnce(
			'styles: remove old built files',
			[
				// 'styles: merge third party libs',
				'styles: build for app'
			]
		)(onThisTaskDone);
	});
})();


(function setupAllJSTasks() {
	gulp.task('javascript: remove old built files', () => {
		return del([
			getJoinedPathFrom(pathForJsOutputFilesToMerge, '**/*'),
			getJoinedPathFrom(pathForJsOutputFilesForInjections, '**/*')
		]);
	});

	gulp.task('javascript: build files for app: those to merge', (onThisTaskDone) => {
		colorfulLog(
			'Javascript globs of app: ',
			chalk.green(formatJSON(groupConcatSettingsForAppJs)),
			'\n'
		);

		let tasksToPump = [];

		tasksToPump.push(gulp.src(globsJsSourceFilesToMerge));
		tasksToPump.push(naturalSort());

		if (shouldGenerateMapFilesForJs) {
			tasksToPump.push(sourcemaps.init());
		}

		if (shouldStripConsoleLoggingsFromJsFiles) {
			tasksToPump.push(removeLogging(settingsForRemovingLoggingForJsFiles));
		}

		tasksToPump.push(concateFileGroups(groupConcatSettingsForAppJs));

		if (shouldMinifyAllJsFiles) {
			tasksToPump.push(uglifyJs());
		}

		if (shouldGenerateMapFilesForJs) {
			tasksToPump.push(sourcemaps.write('.'));
		}

		tasksToPump.push(gulp.dest(pathForJsOutputFilesToMerge));

		pump(tasksToPump, onThisTaskDone);
	});

	gulp.task('javascript: build files for app: those each alone', (onThisTaskDone) => {
		let tasksToPump = [];

		tasksToPump.push(gulp.src(globsJsSourceAppFilesToProcessEachAlone));

		if (shouldGenerateMapFilesForJs) {
			tasksToPump.push(sourcemaps.init());
		}

		if (shouldStripConsoleLoggingsFromJsFiles) {
			tasksToPump.push(removeLogging(settingsForRemovingLoggingForJsFiles));
		}

		if (shouldMinifyAllJsFiles) {
			tasksToPump.push(uglifyJs());
		}

		tasksToPump.push(rename({suffix: '.min'}));

		if (shouldGenerateMapFilesForJs) {
			tasksToPump.push(sourcemaps.write('.'));
		}

		tasksToPump.push(gulp.dest(pathForJsOutputAppFilesToProcessEachAlone));

		pump(tasksToPump, onThisTaskDone);
	});

	gulp.task('javascript: build files for injections', (onThisTaskDone) => {
		let tasksToPump = [];

		tasksToPump.push(gulp.src(globsJsSourceFilesForInjections));

		if (shouldStripConsoleLoggingsFromJsFilesForInjections) {
			tasksToPump.push(removeLogging(settingsForRemovingLoggingForJsFiles));
		}

		if (shouldMinifyJsFilesForInjections) {
			tasksToPump.push(uglifyJs(minificationOptionsForJsFilesForInjections));
		}

		tasksToPump.push(rename({suffix: '.min'}));
		tasksToPump.push(gulp.dest(pathForJsOutputFilesForInjections));

		pump(tasksToPump, onThisTaskDone);
	});




	gulp.task('javascript: remove old third-party files', () => {
		return del([
			getJoinedPathFrom(pathForJsOutputLibFilesToProcessEachAlone, '**/*')
		]);
	});

	gulp.task('javascript: merge third party libs', (onThisTaskDone) => {

		colorfulLog(
			'Javascript globs of third-party libs:',
			chalk.green(formatJSON(groupConcatSettingsForThirdPartyJs)),
			'\n\n'
			+errorEMChalk(
				' WARNING! '
				+'\n  Both human readable version and minified version '
				+'\n  of a third-party plugin will be included if they both exist! '
			)
			+'\n\n'+
			errorEMChalk(
				' 注意！ '
				+'\n  如果一个插件的《易读版》和《压缩版》均存在，'
				+'\n  那么两个文件都会被包含进合并的js！ '
			)+'\n\n'
		);

		let tasksToPump = [];

		tasksToPump.push(gulp.src(globsJsSourceFilesToMerge));
		tasksToPump.push(naturalSort());
		tasksToPump.push(concateFileGroups(groupConcatSettingsForThirdPartyJs));
		tasksToPump.push(gulp.dest(pathForJsOutputFilesToMerge));

		pump(tasksToPump, onThisTaskDone);
	});

	gulp.task('javascript: copy some third-party files: each alone', (onThisTaskDone) => {
		return gulp.src(globsJsSourceLibFilesToProcessEachAloneAsIs)
			.pipe(rename({suffix: '.min'}))
			.pipe(gulp.dest(pathForJsOutputLibFilesToProcessEachAlone))
			;
	});

	gulp.task('javascript: minify some third-party files: each alone', (onThisTaskDone) => {
		colorfulWarn(
			'globsJsSourceLibFilesToProcessEachAlone:',
			formatJSON(globsJsSourceLibFilesToProcessEachAlone),
			'\n\nto "'+pathForJsOutputLibFilesToProcessEachAlone+'"'
		);

		return gulp.src(globsJsSourceLibFilesToProcessEachAlone)
			.pipe(uglifyJs())
			.pipe(rename({suffix: '.min'}))
			.pipe(gulp.dest(pathForJsOutputLibFilesToProcessEachAlone))
			;
	});




	gulp.task('javascript: all', (onThisTaskDone) => {
		runTasksInSequnce(
			'javascript: remove old built files',
			[
				'javascript: build files for app: those to merge',
				'javascript: build files for app: those each alone',
				'javascript: build files for injections'
			]
		)(onThisTaskDone);
	});
})();




gulp.task('app: build', [
	'styles: all',
	'javascript: all'
]);


(function setupWatching() {
	gulp.task('app: watch all source files', [], () => {
		return gulp.watch(globsToWatch, ['app: build'])
			.on('change', logWatchedChange);
	});

	function logWatchedChange(event) {
		let _path = event.path;
		let _posOfClientAppRoot = _path.indexOf(pathForClientAppRoot);

		let subFolderOfChangedFile = _path;
		if (_posOfClientAppRoot > -1) {
			subFolderOfChangedFile = _path.slice(_posOfClientAppRoot + pathForClientAppRoot.length);
		}

		let actionName = '';
		switch (event.type) {
			case 'added': actionName = 'added';
				break;
			case 'changed': actionName = 'changed';
				break;
			case 'renamed': actionName = 'renamed';
				break;
			case 'unlink':
			case 'deleted': actionName = 'deleted';
				break;
			default: actionName = event.type;
				break;
		}

		colorfulLog(chalk.cyan(
			logLine,

			'  '
			+ 'File system changes happen under folder '
			+ '[' + pathForClientAppRoot + ']'
			+ ':\n'
			+ '  '
			+ chalk.white.bgRed('<' + actionName + '>')
			+ ' '
			+ chalk.black.bgYellow('[' + subFolderOfChangedFile + ']'),

			logLine
		));
	}
})();




(function setupTopLevelTasks() {
	const topLevelTasksToRun = [
		'app: build'
	];

	if (isToBuildForRelease) {
		topLevelTasksToRun.push(
			'renew-lib'
		);
	}

	if (isToDevelopWithWatching) {
		topLevelTasksToRun.push(
			'app: watch all source files'
		);
	}

	gulp.task('default', topLevelTasksToRun, (onThisTaskDone) => {
		if (isToBuildForRelease) {
			colorfulLog(
				cheersChalk('App is built sucessfully! Congradulations!')
			);
		}

		onThisTaskDone();
	});

	// gulp.task('watch');

	// gulp.task('test');

	// gulp.task('clean');


	gulp.task('renew-lib', (onThisTaskDone) => {
		runTasksInSequnce(
			'javascript: remove old third-party files',
			[
				'javascript: merge third party libs',
				'javascript: copy some third-party files: each alone',
				'javascript: minify some third-party files: each alone'
			]
		)(onThisTaskDone);
	});

})();

colorfulInfo(
	logLine,
	'Globs and tasks are prepared.',
	logLine
);

if (isToDevelopWithWatching) {
	colorfulWarn(
		warnEMChalk('Running in DEVELOPMENT Mode! Have a Nice Day!')
	);
}

if (isToBuildForRelease) {
	colorfulLog(
		cheersChalk('Building app for releasing...! So exciting!')
	);
}
