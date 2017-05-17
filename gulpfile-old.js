// 文件夹结构：
//
// {project-root}
//   └─ app-client
const folderNameClientAppRoot = 'app-client';
const fileNameWlcClientProjectJS = 'wlc-client-project.js';


const gulp = require('gulp');

// Nodejs 自带的模块。
const fileSystem = require('fs');
const path = require('path');


// 方便好用的重命名文件工具
const rename = require('gulp-rename');


// 用来删除文件，例如，总是在输出之前先删除所有旧版输出文件。
// 每当文件改名时，确保不残留使用旧名字的文件。
const del   = require('del');
// const clean = require('gulp-clean');


// 用于在管道流程中过滤掉一些Globs。
// // const filter        = require('gulp-filter');


// 文件内容编辑工具
const concatInto    = require('gulp-concat');
const inject        = require('gulp-inject');
const changeContent = require('gulp-change');


// 语法检查与代码压缩
const eslint        = require('gulp-eslint');
const minifyJS      = require('gulp-uglify');
const minifyCSS     = require('gulp-cssmin');
const minifyHTML    = require('gulp-htmlmin');
const sourcemaps    = require('gulp-sourcemaps');


// 在命令行环境打印彩色文字
const chalk        = require('chalk');

const pathClientAppRoot = path.join(module.id.replace(/[^\\\/]*$/, ''), folderNameClientAppRoot);



const pathWLCConfigurationFile = path.join(pathClientAppRoot, fileNameWlcClientProjectJS);
const WLCClientProjectSettings = require(pathWLCConfigurationFile);
const projectCaption = WLCClientProjectSettings.name || 'untitled';

let folderOf = WLCClientProjectSettings.folderOf;

// top level folders
const folderNameSrcRoot                  = folderOf.srcRoot;
const folderNameDevBuildRoot             = folderOf.devBuildRoot;
const folderNameReleaseBuildRoot         = folderOf.releaseBuildRoot;
const folderNameNewBuildTempRoot         = folderOf.newBuildTempRoot;
const folderNameNewDevBuildCacheRoot     = folderOf.newDevBuildCacheRoot;
const folderNameNewReleaseBuildCacheRoot = folderOf.newReleaseBuildCacheRoot;

const pathSrcRoot                        = path.join(pathClientAppRoot, folderNameSrcRoot);
const pathDevBuildRoot                   = path.join(pathClientAppRoot, folderNameDevBuildRoot);
const pathReleaseBuildRoot               = path.join(pathClientAppRoot, folderNameReleaseBuildRoot);
const pathNewBuildTempRoot               = path.join(pathClientAppRoot, folderNameNewBuildTempRoot);
const pathNewDevBuildCacheRoot           = path.join(pathClientAppRoot, folderNameNewDevBuildCacheRoot);
const pathNewReleaseBuildCacheRoot       = path.join(pathClientAppRoot, folderNameNewReleaseBuildCacheRoot);


// sub folders
const folderNameAssets                   = folderOf.assets;
const folderNameCSS                      = folderOf.CSS;
const folderNameJS                       = folderOf.JS;
const folderNameHTMLSnippets             = folderOf.HTMLSnippets;


// runtime environment
let runtime = {
	buildingOptions: {
		forCurrentMode: null,
		forDevMode:     WLCClientProjectSettings.buildFor.dev,
		forReleaseMode: WLCClientProjectSettings.buildFor.release
	},
	isInReleaseMode: false
};

runtime.buildingOptions.forCurrentMode = 
	runtime.isInReleaseMode ? 
	runtime.buildingOptions.forReleaseMode : 
	runtime.buildingOptions.forDevMode;




const logLine      = '\n'+'-'.repeat(79);
const rawConsoleLog = global.console.log;
const projectCaptionLog = chalk.blue(projectCaption);
global.console.log = rawConsoleLog.bind(global.console, projectCaptionLog);
global.wlcLog = function() {
	let args = Array.prototype.slice.apply(arguments);
	args.forEach(function(msg, i, args) {
		args[i] = chalk.magenta(msg);
	});

	let time = new Date();
	let tH = time.getHours();
	let tM = time.getMinutes();
	let tS = time.getSeconds();

	tH = (tH < 10 ? '0' : '') + tH;
	tM = (tM < 10 ? '0' : '') + tM;
	tS = (tS < 10 ? '0' : '') + tS;
	let timeStamp = chalk.white('[' + chalk.gray(tH + ':' + tM + ':' + tS)+ ']');

	args.unshift(projectCaptionLog);
	args.unshift(timeStamp);

	rawConsoleLog.apply(global.console, args);
};



function genOptionsForCSSMin() {
	let cssminOptions = {
		advanced: false
	};

	return cssminOptions;
}
function genOptionsForHTMLMin(shouldMinifyHTML) {
	let htmlminOptions = {
		preserveLineBreaks: !shouldMinifyHTML,
		collapseWhitespace: !!shouldMinifyHTML,

		removeComments: true,
		collapseBooleanAttributes: true,
		removeAttributeQuotes: false,
		removeRedundantAttributes: true,
		removeEmptyAttributes: true,
		removeScriptTypeAttributes: true,
		removeStyleLinkTypeAttributes: true
		// removeOptionalTags: true
	};

	return htmlminOptions;
}









// 下面定义各种任务，特别是一个叫做 “default” 的任务。
// 当我们从命令行窗口输入gulp并回车时，gulp会自动从 default 任务开始执行。
// 当然，我们也可以指明执行某个任务。例如，要执行一个名为“styles”的任务，可以像这样：
//     gulp styles<回车>

// 不要忘记Gulp默认是令任务并行的。因此也不要忘记总是使用return语句返回gulp动作的返回值，
// 因为这些动作的返回值，是一个个Stream对象，返回这些Stream对象才能保证各个相互依赖的任务
// 依照预定顺序执行；否则，虽然任务可能会被执行，却不能保证依照预定顺序，从而可能造成晚期错误的结果。

gulp.task('最初的准备工作', () => {
	wlcLog('预先删除临时文件……');
	return del([pathNewBuildTempRoot]);
});



(function devAllCSSAndIconFontsTasks() {
	let globsForBaseCSS = WLCClientProjectSettings.globs.filesViaConcatenation.CSS.base; 
		globsForBaseCSS.forEach((glob, i, globs) => {
			globs[i] = path.join(pathSrcRoot, folderNameCSS, glob);
		});

	let globsForThemeDefaultCSS = WLCClientProjectSettings.globs.filesViaConcatenation.CSS['theme-_default']; 
		globsForThemeDefaultCSS.forEach((glob, i, globs) => {
			globs[i] = path.join(pathSrcRoot, folderNameCSS, glob);
		});

	const pathForSavingBaseCSS = path.join(pathNewDevBuildCacheRoot, folderNameCSS, 'base');
	const cssBuildingOptions = runtime.buildingOptions.forCurrentMode;
	const cssminOptions = genOptionsForCSSMin();


	gulp.task('CSS-基本定义', ['最初的准备工作'], () => {
		const baseCSSFileName = 'base.min.css';
		if (cssBuildingOptions.shouldGenerateSoureMaps) {
			return gulp.src(globsForBaseCSS)
				.pipe(sourcemaps.init())
					.pipe(concatInto(baseCSSFileName))
					.pipe(minifyCSS(cssminOptions))
				.pipe(sourcemaps.write('.'))
				.pipe(gulp.dest(pathForSavingBaseCSS))
			;
		} else {
			return gulp.src(globsForBaseCSS)
				.pipe(concatInto(baseCSSFileName))
				.pipe(minifyCSS(cssminOptions))
				.pipe(gulp.dest(pathForSavingBaseCSS))
			;
		}
	});


	gulp.task('CSS-色彩主题-默认主题', ['最初的准备工作'], () => {
		const baseThemeCSSFileName = 'theme-_default.min.css';
		if (cssBuildingOptions.shouldGenerateSoureMaps) {
			return gulp.src(globsForThemeDefaultCSS)
				.pipe(sourcemaps.init())
					.pipe(concatInto(baseThemeCSSFileName))
					.pipe(minifyCSS(cssminOptions))
				.pipe(sourcemaps.write('.'))
				.pipe(gulp.dest(pathForSavingBaseCSS))
			;
		} else {
			return gulp.src(globsForThemeDefaultCSS)
				.pipe(concatInto(baseThemeCSSFileName))
				.pipe(minifyCSS(cssminOptions))
				.pipe(gulp.dest(pathForSavingBaseCSS))
			;
		}
	});


	gulp.task('CSS-iconfonts', ['最初的准备工作'], () => {
		return gulp.src([
			    path.join(pathSrcRoot, folderNameCSS, 'base-of-this-project/0-iconfonts/*'),
			'!'+path.join(pathSrcRoot, folderNameCSS, 'base-of-this-project/0-iconfonts/*.css') //前面加一个惊叹号，代表忽略这个glob。
		])
			.pipe(gulp.dest(path.join(pathNewDevBuildCacheRoot, folderNameCSS, 'base')))
		;
	});


	gulp.task('styles-specific', ['最初的准备工作'], () => {
		const pathCSSTargetFolder = path.join(pathNewDevBuildCacheRoot, folderNameCSS, 'pages');
		let globsForCSSForSpecificPages = [
			path.join(pathSrcRoot, folderNameCSS, 'pages/**/*.css')
		];


		if (cssBuildingOptions.shouldGenerateSoureMaps) {
			return gulp.src(globsForCSSForSpecificPages)
				.pipe(sourcemaps.init())
					.pipe(minifyCSS(cssminOptions))
					.pipe(rename((fullPathName) => {
						fullPathName.basename += '.min';
						return fullPathName;
					}))
				.pipe(sourcemaps.write('.'))
				.pipe(gulp.dest(pathCSSTargetFolder))
			;
		} else {
			return gulp.src(globsForCSSForSpecificPages)
				.pipe(minifyCSS(cssminOptions))
				.pipe(rename((fullPathName) => {
					fullPathName.basename += '.min';
					return fullPathName;
				}))
				.pipe(gulp.dest(pathCSSTargetFolder))
			;
		}
	});



	gulp.task('styles', [
		'CSS-基本定义',
		'CSS-色彩主题-默认主题',
		'CSS-iconfonts',
		'styles-specific'
	]);
})();



(function devAllJSTasks() {
	gulp.task('es-lint', ['最初的准备工作'], () => {
		return gulp.src([path.join(pathSrcRoot,folderNameJS,'**/*.js')])
			.pipe(eslint())
			.pipe(eslint.format())
		;
	});

	// 我的 scripts-minify 任务须在 eslint 任务完成之后才可以开始。
	// 虽然不先做 lint 代码审查，也可以同步压缩和输出脚本文件，但那样做意义不大。
	// 更何况我们不希望未通过审查的新版代码覆盖旧版的代码。所以我故意这样安排。
	gulp.task('scripts-minify', ['es-lint'], () => {
		return gulp.src([path.join(pathSrcRoot,folderNameJS,'**/*.js')])
			// .pipe(sourcemaps.init())
				.pipe(rename((fullPathName) => {
					fullPathName.basename += '.min';
					return fullPathName;
				}))
			// .pipe(sourcemaps.write('.'))

			.pipe(gulp.dest(path.join(pathNewDevBuildCacheRoot,folderNameJS)))
		;
	});

	gulp.task('scripts', ['scripts-minify']);
})();



(function devAllHTMLTasks() {
	gulp.task('将所有HTML片断文件复制到【开发预览缓存文件夹】', [
		'最初的准备工作'
	], () => {
		return gulp.src([path.join(pathSrcRoot, folderNameHTMLSnippets,'**/*')])
			.pipe(gulp.dest(path.join(pathNewBuildTempRoot, folderNameHTMLSnippets)))
		;
	});

	gulp.task('预处理【开发预览缓存文件夹】中的HTML片断', [
		'将所有HTML片断文件复制到【开发预览缓存文件夹】'
	], () => {
		return gulp.src([
			path.join(pathNewBuildTempRoot,folderNameHTMLSnippets,'module-app-footer.html')
		])
			.pipe(
				changeContent((fileContentString) => {
					var thisYear = new Date().getFullYear();
					return fileContentString.replace(/(\&copy\;\s*)\d+/g, '$1'+thisYear);
				})
			)
			.pipe(gulp.dest(path.join(pathNewBuildTempRoot,folderNameHTMLSnippets)))
		;
	});

	gulp.task('将HTML片断按需注入各个HTML页面中', ['预处理【开发预览缓存文件夹】中的HTML片断'], () => {
		const pathSourceHTMLSnippets = path.join(pathSrcRoot,folderNameHTMLSnippets);
		const globsAllSourceHTMLFilesInAllFolders = path.join(pathSrcRoot, '**/*.html'); // 其中包含了index.html

		const globsSourceFolderAllHTMLPages = [
			globsAllSourceHTMLFilesInAllFolders,
			'!'+pathSourceHTMLSnippets // 我们要排除的是源文件夹的片段，而不是临时文件夹的片段
		];

		const injectionSets = WLCClientProjectSettings.injections;

		let globsOfCurrentStage = gulp.src(globsSourceFolderAllHTMLPages);
		for (let iInjection = 0; iInjection < injectionSets.length; iInjection++) {
			let injectionSet = injectionSets[iInjection];

			let pathTempSnippets = path.join(pathNewBuildTempRoot, injectionSet.snippetsPathRoot);
			let couples = injectionSet.couples;

			for (let iCouple = 0; iCouple < couples.length; iCouple++) {
				let couple = couples[iCouple];
				let tempSnippetFile = path.join(pathTempSnippets, couple.withFile);
				let injectionStartTag = '<!-- inject:'+couple.replaceTag+' -->';

				// wlcLog(tempSnippetFile);
				// wlcLog(injectionStartTag);

				globsOfCurrentStage = globsOfCurrentStage.pipe(
					inject(gulp.src([tempSnippetFile]),
						{
							starttag: injectionStartTag,
							transform: wlcProcessHtmlSnippetString,
							quiet: true
						}
					)
				);
			}
		}

		return globsOfCurrentStage
			.pipe(gulp.dest(pathNewDevBuildCacheRoot))
		;


		function wlcProcessHtmlSnippetString(fullPathName, snippetFile, index, count, targetFile) {
			const pageFileRelativePathName = targetFile.path.slice(targetFile.base.length);
			const pageFileIsAtClientRootFolder = pageFileRelativePathName.search(/\/|\\/) < 0;

			var snippetString = snippetFile.contents ? snippetFile.contents.toString('utf8') : '';
			snippetString = _wlcAlignRelativeUrlsInsideSnippet(pageFileIsAtClientRootFolder, snippetString);
			return snippetString;
		}

		function _wlcAlignRelativeUrlsInsideSnippet(pageFileIsAtClientRootFolder, snippetString) {
			if (pageFileIsAtClientRootFolder) {
				snippetString = snippetString.replace(/\=\s*\"\.\.\//g, '=\"');
			}
			return snippetString;
				}
	});

	gulp.task('删除缓存文件夹种的HTML片断文件',  ['将HTML片断按需注入各个HTML页面中'], () => {
		return del([path.join(pathNewDevBuildCacheRoot, folderNameHTMLSnippets)]);
	});

	gulp.task('html', ['删除缓存文件夹种的HTML片断文件'], () => {
		let htmlminOptions = genOptionsForHTMLMin(runtime.buildingOptions.forCurrentMode.shouldMinifyHTML);
		return gulp.src([path.join(pathNewDevBuildCacheRoot, '**/*.html')])
			.pipe(minifyHTML(htmlminOptions))
			.pipe(gulp.dest(pathNewDevBuildCacheRoot))
		;
	});
})();



(function devAllAssetsTasks() {
	gulp.task('处理所有来自第三方厂商的文件', ['最初的准备工作'], () => {
		return gulp.src(path.join(pathSrcRoot, 'assets-vendors/**/*'))
			.pipe(gulp.dest(path.join(pathNewDevBuildCacheRoot, 'assets-vendors')))
		;
	});

	gulp.task('处理所有非CSS、非JS的自主资源文件', ['最初的准备工作'], () => {
		return gulp.src([
			    path.join(pathSrcRoot, folderNameAssets, '**/*'),
			'!'+path.join(pathSrcRoot, folderNameCSS, '**/*'),
			'!'+path.join(pathSrcRoot, folderNameCSS),
			'!'+path.join(pathSrcRoot, folderNameJS, '**/*'),
			'!'+path.join(pathSrcRoot, folderNameJS),
		])
			.pipe(gulp.dest(path.join(pathNewDevBuildCacheRoot, folderNameAssets)))
		;
	});

	gulp.task('处理所有自主资源文件（图片、字体等）', [
		'处理所有非CSS、非JS的自主资源文件',
		'styles',
		'scripts'
	]);
})();







gulp.task('prepare-all-new-files-in-cache', [
	'处理所有来自第三方厂商的文件',
	'处理所有自主资源文件（图片、字体等）',
	'html'
]);

gulp.task('删除旧有【开发预览】文件夹', ['prepare-all-new-files-in-cache'], () => {
	return del([pathDevBuildRoot]);
});

gulp.task('将【开发预览缓存】发布为新的【开发预览】', ['删除旧有【开发预览】文件夹'], () => {
	wlcLog('将【'+folderNameNewDevBuildCacheRoot+'】更名为【'+folderNameDevBuildRoot+'】……');
	return fileSystem.renameSync(pathNewDevBuildCacheRoot, pathDevBuildRoot);
});


gulp.task('删除临时文件夹和临时文件', ['将【开发预览缓存】发布为新的【开发预览】'], () => {
	return del([pathNewBuildTempRoot]);
});






gulp.task('构建整个App', ['删除临时文件夹和临时文件']);


let watchEventTriggeredJustNow = false;
gulp.task('监视【开发源码】文件夹', ['删除临时文件夹和临时文件'], () => {
	if (watchEventTriggeredJustNow) {
		wlcLog(logLine+'\n  Files are changing too frequently.'+logLine);
		return false;
	}

	return gulp.watch(
		[ // 监视这些文件和文件夹
			path.join(pathSrcRoot, '**/*'),
		],
		[ // 一旦有文件改动，执行这些任务
			'构建整个App'
		]
	)
		.on('change', function (event) {
			watchEventTriggeredJustNow = true;
			global.setTimeout(function () {
				watchEventTriggeredJustNow = false;
			}, 0.5);

			const changedFileFolder = event.path.slice(pathClientAppRoot.length+1);
			let actionName = '';
			switch (event.type) {
				case 'added': actionName = '添加了';
					break;
				case 'changed': actionName = '改动了';
					break;
				case 'deleted': actionName = '删除了';
					break;
				default: actionName = '<未知动作>';
					break;
			}

			wlcLog(
			  logLine
			  +'\n  '+new Date().toLocaleString()+' 【'+pathSrcRoot+'】变动了!'
			  +'\n  '+actionName+'【'+changedFileFolder+'】'
			  +logLine
			);
		})
	;
});


(function allTopLevelTasks() {
	// 下面这个任务就是 “default” 任务。
	// 当我们从命令行窗口输入gulp并回车时，gulp会自动从 default 任务开始执行。
	gulp.task('default', [
		'构建整个App',
		'监视【开发源码】文件夹'
	], (onThisTaskDone) => {
		onThisTaskDone();
	});
})();
