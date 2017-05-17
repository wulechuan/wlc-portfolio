var configuration = {
	projectName: 'wlc-2017-05',
	projectCaption: '吴乐川资料\’17-05',

	folderOf: {
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
			shouldGenerateSoureMapsIfMinified: {
				dev: true,
				release: false
			},
			globs: {

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
			shouldGenerateSoureMapsIfMinified: {
				dev: true,
				release: false
			},
			shouldStripConsoleLoggings: {
				dev: false,
				release: true
			},
			globs: {

			},
			preprocessing: {
				language: 'sass' // 'less', 'stylus', 'none'
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
			}
		}
	}
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