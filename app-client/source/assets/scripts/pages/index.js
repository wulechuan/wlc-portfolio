(function () {
	var app = new Vue({
		el: '.test',
		data: {
			testValue: 3.19
		},
		methods: {
			changeTestValueRandomly: function () {
				this.testValue = Math.random() * 3;
			}
		}
	});
})();