const gulp = require('gulp');

gulp.task('external: test task', (onThisTaskDone) => {
	console.log(
		'外部任务获取成功！',
		'\n\n'
	);

	onThisTaskDone();
});