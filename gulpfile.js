// fetch configuration
const pathForClientAppRoot = './app-client/';
const wlcClientProjectTaskBuilder = require(
	'./app-client/wlc-web-client-project-gulp-task-builder'
	)();
const projectConfiguration = wlcClientProjectTaskBuilder.projectConfiguration;


// modules: core utilities
const gulp = require('gulp');
// const fileSystem = require('fs');
const pathTool = require('path');
const getJoinedPathFrom = pathTool.join;
const renameFiles = require('gulp-rename');
const deleteFiles = require('del');
const pump = require('pump');
const runTasksInSequnce = require('gulp-sequence');
const evaluateGroupConcateOptionsViaFoldersAsAModule = require('@wulechuan/group-files-via-folder-names');
const naturalSort = require('gulp-natural-sort');


// modules: file content modifiers
const removeLogging = require('gulp-remove-logging');
const concateFileGroups = require('gulp-group-concat');
const minifyCss = require('gulp-csso');
const uglifyJs = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');



// printing colorful logs in CLI
const logger = require('@wulechuan/colorful-log').createColorfulLogger(global.console, {
	prefix: projectConfiguration.projectCaption,
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



const processArguments = require('minimist')(process.argv.slice(2));
const isToBuildForRelease = projectConfiguration.isRunningInReleasingMode(processArguments);
const isToDevelopWithWatching = !isToBuildForRelease;
const gulpRunningMode = isToBuildForRelease ? 'release' : 'dev';

colorfulWarn('isToBuildForRelease', isToBuildForRelease);
colorfulInfo(formatJSON(projectConfiguration.genOptionsForGulpHTMLMin(gulpRunningMode)));




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









// initialize some variable
const shouldMinifyCssFiles = projectConfiguration.assets.css.shouldMinify;
const shouldMinifyJsFiles = projectConfiguration.assets.js.shouldMinify;
const shouldMinifyHTMLFiles = projectConfiguration.assets.html.shouldMinify;
const shouldStripConsoleLoggingsFromJsFiles = projectConfiguration.assets.js.shouldStripConsoleLoggings;

const shouldGenerateMapFilesForJs = (function (config) {
	const jsConfig = config.assets && config.assets.js;
	if (!jsConfig) return false;

	return (jsConfig.shouldGenerateSoureMaps &&
		(jsConfig.shouldMinify || jsConfig.shouldStripConsoleLoggings)
	);
})(projectConfiguration);

const shouldGenerateMapFilesForCss = (function (config) {
	const cssConfig = config.assets && config.assets.css;
	if (!cssConfig) return false;

	return (cssConfig.shouldGenerateSoureMaps &&
		(cssConfig.shouldMinify || cssConfig.shouldStripConsoleLoggings)
	);
})(projectConfiguration);





// build up fullpaths and globs
colorfulInfo(
	logLine,
	'Preparing paths and globs...',
	logLine
);

const assetsConfig = projectConfiguration.assets;

const pathForSourceRoot = getJoinedPathFrom(__dirname, pathForClientAppRoot, projectConfiguration.folderOfStages.source);
const pathForOutputRoot = getJoinedPathFrom(__dirname, pathForClientAppRoot, projectConfiguration.folderOfStages.buildForDev);

const folderOfCssSourceFiles = assetsConfig.css.sourceGlobs.rootPath;
const folderOfCssOutputFiles = assetsConfig.css.outputPaths.rootPath;

const folderOfJsSourceFiles = assetsConfig.js.sourceGlobs.rootPath;
const folderOfJsOutputFiles = assetsConfig.js.outputPaths.rootPath;

const pathForCssSourceFiles = getJoinedPathFrom(pathForSourceRoot, folderOfCssSourceFiles);
const pathForCssOutputFiles = getJoinedPathFrom(pathForOutputRoot, folderOfCssOutputFiles);
const pathForJsSourceFiles = getJoinedPathFrom(pathForSourceRoot, folderOfJsSourceFiles);
const pathForJsOutputFiles = getJoinedPathFrom(pathForOutputRoot, folderOfJsOutputFiles);

const globsCssSourceFiles = [
	getJoinedPathFrom(pathForCssSourceFiles, '**/*.css'),
	'!' + getJoinedPathFrom(pathForCssOutputFiles, '**/*') // just in case the output folder is a sub folder of the source folder
];

const globsJsSourceFiles = [
	getJoinedPathFrom(pathForJsSourceFiles, '**/*.js'),
	'!' + getJoinedPathFrom(pathForJsOutputFiles, '**/*') // just in case the output folder is a sub folder of the source folder
];

const globsToWatch = []
	.concat(globsCssSourceFiles)
	.concat(globsJsSourceFiles)
	;




// evaluate group-concat settings via building options
groupConcatBuildingOptionsForAppCss.searchingBases =
	groupConcatBuildingOptionsForAppCss.searchingBases.map((glob) => {
		return getJoinedPathFrom(pathForCssSourceFiles, glob) + '/';
	});
const groupConcatSettingsForAppCss = evaluateGroupConcateOptionsViaFoldersAsAModule(
	groupConcatBuildingOptionsForAppCss
);


groupConcatBuildingOptionsForAppJs.searchingBases =
	groupConcatBuildingOptionsForAppJs.searchingBases.map((glob) => {
		return getJoinedPathFrom(pathForJsSourceFiles, glob) + '/';
	});
const groupConcatSettingsForAppJs = evaluateGroupConcateOptionsViaFoldersAsAModule(
	groupConcatBuildingOptionsForAppJs
);





colorfulInfo(
	logLine,
	'Preparing tasks...',
	logLine
);

(function setupAllCSSTasks() {
	// colorfulLog(
	//     'Css globs of app:',
	//     chalk.green(formatJSON(groupConcatSettingsForAppCss)),
	//     '\n'
	// );

	gulp.task('styles: remove old built files', () => {
		return deleteFiles([
			getJoinedPathFrom(pathForCssOutputFiles, '**/*')
		]);
	});

	gulp.task('styles: merge third party libs', (onThisTaskDone) => {
		onThisTaskDone();
		// colorfulLog(
		// 	'Css globs of third-party libs:',
		// 	chalk.green(formatJSON(groupConcatSettingsForThirdPartyJs)),
		// 	'\n\n'
		// 	+errorEMChalk(
		// 		' WARNING! '
		// 		+'\n  Both human readable version and minified version '
		// 		+'\n  of a third-party plugin will be included if they both exist! '
		// 	)
		// 	+'\n\n'+
		// 	errorEMChalk(
		// 		' 注意！ '
		// 		+'\n  如果一个插件的《易读版》和《压缩版》均存在，'
		// 		+'\n  那么两个文件都会被包含进合并的css！ '
		// 	)+'\n\n'
		// );

		// let tasksToPump = [];

		// tasksToPump.push(gulp.src(globsCssSourceFiles));
		// tasksToPump.push(naturalSort());
		// tasksToPump.push(concateFileGroups(groupConcatSettingsForThirdPartyCss));
		// tasksToPump.push(gulp.dest(pathForCssOutputFiles));

		// pump(tasksToPump, onThisTaskDone);
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
		return deleteFiles([
			getJoinedPathFrom(pathForJsOutputFiles, '**/*')
		]);
	});

	gulp.task('javascript: build files for app: those to merge', (onThisTaskDone) => {
		colorfulLog(
			'Javascript globs of app: ',
			chalk.green(formatJSON(groupConcatSettingsForAppJs)),
			'\n'
		);

		let tasksToPump = [];

		tasksToPump.push(gulp.src(globsJsSourceFiles));
		tasksToPump.push(naturalSort());

		if (shouldGenerateMapFilesForJs) {
			tasksToPump.push(sourcemaps.init());
		}

		if (shouldStripConsoleLoggingsFromJsFiles) {
			tasksToPump.push(removeLogging(settingsForRemovingLoggingForJsFiles));
		}

		tasksToPump.push(concateFileGroups(groupConcatSettingsForAppJs));

		if (shouldMinifyJsFiles) {
			tasksToPump.push(uglifyJs());
		}

		if (shouldGenerateMapFilesForJs) {
			tasksToPump.push(sourcemaps.write('.'));
		}

		tasksToPump.push(gulp.dest(pathForJsOutputFiles));

		pump(tasksToPump, onThisTaskDone);
	});

	gulp.task('javascript: build files for app: those each alone', (onThisTaskDone) => {
		// let tasksToPump = [];

		// tasksToPump.push(gulp.src(globsJsSourceFiles));

		// if (shouldGenerateMapFilesForJs) {
		// 	tasksToPump.push(sourcemaps.init());
		// }

		// if (shouldStripConsoleLoggingsFromJsFiles) {
		// 	tasksToPump.push(removeLogging(settingsForRemovingLoggingForJsFiles));
		// }

		// if (shouldMinifyJsFiles) {
		// 	tasksToPump.push(uglifyJs());
		// }

		// tasksToPump.push(renameFiles({suffix: '.min'}));

		// if (shouldGenerateMapFilesForJs) {
		// 	tasksToPump.push(sourcemaps.write('.'));
		// }

		// tasksToPump.push(gulp.dest(pathForJsOutputFiles));

		// pump(tasksToPump, onThisTaskDone);
	});

	gulp.task('javascript: all', (onThisTaskDone) => {
		runTasksInSequnce(
			'javascript: remove old built files',
			[
				'javascript: build files for app: those to merge',
				'javascript: build files for app: those each alone'
			]
		)(onThisTaskDone);
	});
})();




gulp.task('app: build', [
	'external: test task',
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

	gulp.task('renew-lib', (onThisTaskDone) => {
		runTasksInSequnce(
			// 'javascript: remove old third-party files',
			// [
			// 	'javascript: merge third party libs',
			// 	'javascript: copy some third-party files: each alone',
			// 	'javascript: minify some third-party files: each alone'
			// ]
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
