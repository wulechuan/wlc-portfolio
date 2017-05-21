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

const defaultMinimumConfiguration = {

};

module.exports = function (appRootPath, configurationFileName) {
	if (typeof configurationFileName !== 'string') {
		configurationFileName = '';
	} else {
		configurationFileName = configurationFileName.trim();
	}

	if (configurationFileName.match(/[\\\/]/)) {
		throw URIError('Invalid configuration file name: "'+configurationFileName+'".');
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
		if (!configurationFileName) {

			const pathContainsSlash = !!appRootPath.match(/\//);
			const pathEndsWithADot = !!appRootPath.match(/\.$/);
			const pathStartsWithADot = !!appRootPath.match(/^\./);
			const pathIsDot = !!appRootPath.match(/^\.\ *[\/\\]?$/);

			const pathContainsInvalidFileExtesion =
				!pathIsDot &&
				(
					pathEndsWithADot ||
					!!appRootPath.match(/\.\s+[\s\w]+$/)
				)
				;

			if (pathContainsInvalidFileExtesion) {
				throw URIError('Invalid file extension found in "'+appRootPath+'".');
			}


			const pathContainsNonTerminalDot = !!appRootPath.match(/[^\\\/\s\.]+\s*\.\w+$/);
			const pathContainsFileExtension = pathContainsNonTerminalDot;

			// const pathIsSingleton = !pathContainsSlash && !pathIsDot;
			// const pathIsSingletonFolder = pathIsSingleton && !pathContainsFileExtension;
			// const pathIsSingletonFile   = pathIsSingleton &&  pathContainsFileExtension;

			// const pathContainsFolder   = pathIsSingletonFolder || pathIsDot || pathContainsSlash;
			const pathContainsFileName = pathContainsFileExtension;

			if (pathContainsFileName) {
				// nothing to do, because the "configurationFileContainingPath" contains a file name
				// while the "configurationFileName" is empty.
			} else {
				configurationFileName = configurationFileDefaultName;
			}
		} else {
			if (!appRootPath) {
				appRootPath = appRootDefaultPath;
			}
		}
	}








	const configurationFileContainingPath = appRootPath;
	const configurationFile = pathTool.resolve(configurationFileContainingPath, configurationFileName);

	return new wlcClientProjectBuilder(configurationFile);










	function wlcClientProjectBuilder(configurationFile) {
		init.call(this, configurationFile);
	}

	function init(configurationFile) {
		const projectConfiguration = readConfigurationFile(configurationFile);
		this.projectConfiguration = projectConfiguration;
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