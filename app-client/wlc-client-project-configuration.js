module.exports = {
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
		}
	}
};