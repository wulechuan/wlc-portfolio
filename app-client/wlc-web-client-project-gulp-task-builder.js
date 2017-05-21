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

		if (appRootPath) {
			// const pathContainsSlash = !!appRootPath.match(/\//);
			const pathEndsWithADot = !!appRootPath.match(/\.$/);
			// const pathStartsWithADot = !!appRootPath.match(/^\./);
			const pathIsDot = !!appRootPath.match(/^\.\ *[\/\\]?$/);

			const pathContainsInvalidFileExtesion =
				(pathEndsWithADot && !pathIsDot) ||
				!!appRootPath.match(/\.\s+[\s\w]+$/)
				;

			if (pathContainsInvalidFileExtesion) {
				throw URIError('Invalid file extension found in "'+appRootPath+'".');
			}


			const pathContainsNonTerminalDot = !!appRootPath.match(/[^\\\/\s\.]+\s*\.\w+$/);
			const pathContainsFileName = pathContainsNonTerminalDot;

			// const pathIsSingleton = !pathContainsSlash && !pathIsDot;
			// const pathIsSingletonFolder = pathIsSingleton && !pathContainsFileExtension;
			// const pathIsSingletonFile   = pathIsSingleton &&  pathContainsFileExtension;
			// const pathContainsFolder   = pathIsSingletonFolder || pathIsDot || pathContainsSlash;

			if (!configurationFileName) {
				if (pathContainsFileName) {
					const lastSlashInPath = appRootPath.search(/[\\\/](?![\s\.\w]*[\\\/])/);
					const fileNameInPath = appRootPath.slice(lastSlashInPath+1).trim();
					appRootPath = appRootPath.slice(0, lastSlashInPath);
					configurationFileName = fileNameInPath;
				} else {
					configurationFileName = configurationFileDefaultName;
				}
			}
		} else {
			appRootPath = appRootDefaultPath;
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