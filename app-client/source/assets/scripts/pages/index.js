(function () {
	var chiefPageContentSliders = new Swiper(
		'.swiper-container.page-chief-sections',
		{
			direction: 'vertical',
			mousewheelControl: true,
			hashnav: true,
			loop: false,
			pagination: '.swiper-pagination',
			paginationClickable: true,

			onScroll: function(thisSwiper, event) {
				console.log(thisSwiper.activeIndex, thisSwiper);
				if (Math.random() > 0.5) {
					thisSwiper.lockSwipes();
				} else {
					thisSwiper.unlockSwipes();
				}
			}
		}
	);

	// by default, show the last slide at begining
	var firstSlideToShow = chiefPageContentSliders.slides.length - 1; 

	if (sessionStorage.getItem('lastShownSlide')) {
		firstSlideToShow = sessionStorage.getItem('lastShownSlide');
	}

	chiefPageContentSliders.slideTo(
		firstSlideToShow,
		5 // milliseconds
	);
})();