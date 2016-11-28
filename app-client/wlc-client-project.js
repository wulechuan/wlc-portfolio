// 文件夹结构：
//
// {project-root}
//   └─ {app-client-root}
//       ├─ source        <-- 这是【开发源码】文件夹
//       │   ├─ html
//       │   └─ assets
//       │       ├─ images
//       │       ├─ scripts
//       │       └─ styles
//       │
//       ├─build-dev      <-- 这是【开发预览】文件夹
//       │
//       ├─build-release  <-- 这是【正式发布】文件夹
//       │
//       └─node_modules   <-- 这是nodejs模块文件夹，纯粹供nodejs使用，与最终前端产品毫无干系




module.exports = {
	name: '泰金所\’16-11',
	appFolderStructure: 'tranditional',
	folderOf: {
		srcRoot:                  'source',
		devBuildRoot:             'build-dev',
		releaseBuildRoot:         'build-release',
		newBuildTempRoot:         '_build_temp',
		newDevBuildCacheRoot:     '_build_dev_cache',
		newReleaseBuildCacheRoot: '_build_release_cache',
		assets:                   'assets', // 图片、视频、音频、供下载的文档、字体……
		CSS:                      'assets/styles',
		JS:                       'assets/scripts',
		HTML:                     'html',
		HTMLSnippets:             'html-snippets'
	},

	globs: {
		allOtherAssets: [
			'/assets/base-of-this-project/iconfonts/**/*',
			'!/assets/base-of-this-project/iconfonts/**/*.css',
		],

		filesViaConcatenation: {
			CSS: {
				base: [
					// 下面壹壹列出各个glob，目的是保证这些css文件合并的顺序。
					// 我们知道，错误的CSS顺序可能导致错误的结果。
					'base-_framework/**/*.css',
					'!base-_framework/ie8-patch/**/*.css',

					'base-of-this-project/0-iconfonts/**/*.css',
					'base-of-this-project/1-fonts/**/*.css',
					'base-of-this-project/2-layout/**/*.css',
					'base-of-this-project/3-components/**/*.css',
				],
				'theme-_default': [
					'base-of-this-project/4-theme-_default/**/*.css',
				]
			}
		},
	},

	buildFor: {
		dev: {
			shouldMinifyHTML: false,
			shouldMinifyCSS: false,
			shouldMinifyJS: false,
			shouldGenerateSoureMaps: true
		},
		release: {
			shouldMinifyHTML: true,
			shouldMinifyCSS: true,
			shouldMinifyJS: true,
			shouldGenerateSoureMaps: false
		}
	},


	injections: [
		{
			snippetsPathRoot: '/html-snippets/',
			couples: [
				{
					replaceTag: 'headBeforeTitle:html',
					withFile:   'tag-head-before-title.html'
				},
				{
					replaceTag: 'headAfterTitle:html',
					withFile:   'tag-head-after-title.html'
				},
				{
					replaceTag: 'bodyBegin:html',
					withFile:   'tag-body-begin.html'
				},
				{
					replaceTag: 'bodyEnd:html',
					withFile:   'tag-body-end.html'
				},
				{
					replaceTag: 'appRootWrapBegin:html',
					withFile:   'module-app-_root-wrap-begin.html'
				},
				{
					replaceTag: 'appRootWrapEnd:html',
					withFile:   'module-app-_root-wrap-end.html'
				},
				{
					replaceTag: 'appHeader:html',
					withFile:   'module-app-header.html'
				},
				{
					replaceTag: 'appFooter:html',
					withFile:   'module-app-footer.html'
				},
				{
					replaceTag: 'appBodyWrapBegin:html',
					withFile:   'module-app-body-wrap-begin.html'
				},
				{
					replaceTag: 'appBodyWrapEnd:html',
					withFile:   'module-app-body-wrap-end.html'
				},
				{
					replaceTag: 'globalPopupLayers:html',
					withFile:   'module-global-popup-layers.html'
				},
				{
					replaceTag: 'popupLayersWrapBegin:html',
					withFile:   'module-popup-layers-wrap-begin.html'
				},
				{
					replaceTag: 'popupLayersWrapEnd:html',
					withFile:   'module-popup-layers-wrap-end.html'
				}
			]
		}
	]
};