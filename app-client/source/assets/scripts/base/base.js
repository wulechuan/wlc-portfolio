(function () {
	window.console = window.console || { log: function () {} };
	var ua = navigator.userAgent;
	// var isIE = !!ua.match(/(\bmsie|\btrident\b)/i);
	var isMSEdge = !!ua.match(/\bedge\b/i);
	var isIE8 = !!ua.match(/\bmsie\s+8/i);
	var isIE9 = !!ua.match(/\bmsie\s+9/i);

	var isWebkit = !!ua.match(/\bapplewebkit\b/i) && !isMSEdge;

	if (isWebkit) {
		$('body').addClass('webkit');
	}

	if (!Array.isArray) {
		Array.isArray = function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		};
	}

	// if (isIE8) {
	// 	$('.f-list > li .timestamp').each(function () {
	// 		this.innerHTML = '2013-05-15 11:55';
	// 	});
	// } else {
	// 	$('.f-list > li .timestamp > time').html('2013-05-15 11:55');
	// }

	function processParametersPassedIn() {
		var qString = location.href.match(/\?.*/);
		if (qString) qString = qString[0].slice(1);

		var qKVPairs = [];
		if (qString) {
			qKVPairs = qString.split('&');
		}

		var psn1; // page sidebar nav Level 1 current
		var psn2; // page sidebar nav Level 2 current
		var tabLabel; // id of tabLabel to show if any
		var bank;
		var bankHTML;

		if (typeof window.psn === 'object') {
			if (window.psn.level1) psn1 = window.psn.level1;
			if (window.psn.level2) psn2 = window.psn.level2;
		}

		for (var i in qKVPairs){
			var kvpString = qKVPairs[i];
			var kvp = kvpString.split('=');

			if (kvp[0] === 'psn1') psn1 = kvp[1];
			if (kvp[0] === 'psn2') psn2 = kvp[1];
			if (kvp[0] === 'tabLabel') tabLabel = kvp[1];
			if (kvp[0] === 'bank') bank = kvp[1];
			if (kvp[0] === 'bankHTML') bankHTML = kvp[1];
		}

		return {
			bank: decodeURIComponent(bank),
			bankHTML: decodeURIComponent(bankHTML).replace(/\+/g, ' '),
			tabLabel: tabLabel,
			psn: {
				level1: psn1,
				level2: psn2
			}
		};
	}


	var urlParameters = processParametersPassedIn();


	var bodyClickListener = new function () {
		this.registeredElements = [];

		this.register = function (elements, callback) {
			if (typeof callback !== 'function') return false;

			if (!Array.isArray(elements)) elements = [elements];
			for (var i = 0; i < elements.length; i++) {
				var el = elements[i];
				if (!el) continue;
				this.registeredElements.push({
					element: el,
					callback: callback
				});
			}
		};

		this.broadCastOutsideClickToRegisteredElements = function (clickedEl) {
			for (var i = 0; i < this.registeredElements.length; i++) {
				var record = this.registeredElements[i];
				var el = record.element;
				var isOutside = this.testClickOutsideElement(el, clickedEl);
				if (isOutside) {
					record.callback(clickedEl);
				}
			}
		};

		this.testClickOutsideElement = function (testEl, clickedEl) {
			if (!testEl || !clickedEl) return true;

			while (clickedEl && clickedEl!==document.body && clickedEl!==testEl) {
				clickedEl = clickedEl.parentNode;
			}

			return testEl !== clickedEl;
		};

		var thisController = this;
		function _init() {
			$('body').on('click', function (event) {
				var clickedEl = event.target;
				thisController.broadCastOutsideClickToRegisteredElements(clickedEl);
			});
		}

		_init.call(this);
	}();


	window.onPopupLayerShow = function(popupLayer) {
		if (!isIE9) return true;
		var popupWindow = $(popupLayer).find('.popup-window')[0];
		var currentWidth = $(popupWindow).outerWidth();

		if (popupWindow) popupWindow.style.width = currentWidth + 'px';
	};


	$('input[placeholder]').each(function () {
		function _updateInputStyleForGroomingPlaceholder(field) {
			if (!field) {
				return false;
			}

			var tagNameLC = field.tagName.toLowerCase();
			if (tagNameLC !== 'input' && tagNameLC !== 'textarea') {
				return false;
			}

			var classNameToDealWith = 'empty-field';
			if (field.value) {
				$(field).removeClass(classNameToDealWith);
			} else {
				$(field).addClass(classNameToDealWith);
			}
		}

		_updateInputStyleForGroomingPlaceholder(this);

		if (isIE8) {
			$(this).on('focus', function () {
				_updateInputStyleForGroomingPlaceholder(this);
			});

			$(this).on('blur', function () {
				_updateInputStyleForGroomingPlaceholder(this);
			});

			$(this).on('change', function () {
				_updateInputStyleForGroomingPlaceholder(this);
			});

			$(this).on('keypress', function () {
				_updateInputStyleForGroomingPlaceholder(this);
			});
		} else {
			$(this).on('input', function () {
				_updateInputStyleForGroomingPlaceholder(this);
			});
		}
	});



	setPageSidebarNavCurrentItem(urlParameters.psn);

	function updatePageSidebarNavSubMenuForMenuItem(menuItem, action) {
		var forceUpdatingContainer = $('.page')[0];
		var $subMenu = $(menuItem).find('> .menu');
		var subMenuWasExpanded = $(menuItem).hasClass('coupled-shown');
		var needAction =
			(!subMenuWasExpanded && action==='expand') ||
			(subMenuWasExpanded && action==='collapse') ||
			(action==='toggle')
		;
		if (!needAction) {
			return 0;
		}

		if (subMenuWasExpanded) {
			$(menuItem).removeClass('coupled-shown');
			$subMenu.slideUp(null, _onAnimationEnd);
		} else {
			$(menuItem).addClass('coupled-shown');
			$subMenu.slideDown(null, _onAnimationEnd);
		}

		function _onAnimationEnd() {
			if (!isIE8) return true;

			if (forceUpdatingContainer) {
				forceUpdatingContainer.visibility = 'hidden';
				setTimeout(function () {
					forceUpdatingContainer.visibility = '';
				}, 0);
			}
		}
	}

	function setPageSidebarNavCurrentItem(conf) {
		conf = conf || {};
		conf.level1IdPrefix = 'menu-psn-1-';
		setMenuCurrentItemForLevel(1, 2, $('#page-sidebar-nav'), conf);
	}

	function setMenuCurrentItemForLevel(level, depth, parentDom, conf) {
		level = parseInt(level);
		depth = parseInt(depth);
		if (!(level > 0) || !(depth >= level)) {
			throw('Invalid menu level/depth for configuring a menu tree.');
		}
		if (typeof conf !== 'object') {
			throw('Invalid configuration object for configuring a menu tree.');
		}

		var prefix = conf['level'+level+'IdPrefix'];
		var desiredId = prefix + conf['level'+level];

		var $allItems = $(parentDom).find('.menu.level-'+level+' > .menu-item');
		var currentItem;
		var currentItemId;

		$allItems.each(function (index, menuItem) {
			var itemLabel = $(menuItem).find('> a > .label')[0];
			var itemId = itemLabel.id;

			var isCurrentItemOrParentOfCurrentItem = itemId && desiredId && (itemId===desiredId);
			var isCurrentItem = isCurrentItemOrParentOfCurrentItem && level === depth;
			if (isCurrentItemOrParentOfCurrentItem) {
				currentItem = menuItem;
				currentItemId = itemId;
				if (isCurrentItem) {
					$(menuItem).addClass('current');
					$(menuItem).removeClass('current-parent');
				} else {
					$(menuItem).addClass('current-parent');
					$(menuItem).removeClass('current');
				}
			} else {
				$(menuItem).removeClass('current');
				$(menuItem).removeClass('current-parent');
			}
		});

		var currentSubMenuItem = null;
		if (level < depth && currentItem) {
			var nextLevel = level + 1;
			conf['level'+nextLevel+'IdPrefix'] = currentItemId + '-' + nextLevel + '-';
			currentSubMenuItem = setMenuCurrentItemForLevel(nextLevel, depth, currentItem, conf);
			if (currentSubMenuItem) {
				$(currentItem).addClass('has-sub-menu'); // update this for robustness
				$(currentItem).addClass('coupled-shown');
			}
		}

		return currentSubMenuItem || currentItem;
	}

	$('.menu-item.has-sub-menu').each(function () {
		var menuItem = this;
		var $subMenuHint = $(this).find('> a > .sub-menu-hint, > .sub-menu-hint');

		$subMenuHint.on('click', function (event) {
			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}

			updatePageSidebarNavSubMenuForMenuItem(menuItem, 'toggle');
		});
	});


	$('.drop-down-list').each(function () {
		var dropDownList = this;
		var $currentValueContainer = $(this).find('.drop-down-list-current-value');
		var inputForStoringValue = $(this).find('input.drop-down-list-value');
		var inputForStoringHTML = $(this).find('input.drop-down-list-value-html');
		var $options = $(this).find('.drop-down-list-options > li'); // assuming there is only one level of menu

		if (urlParameters.bank && urlParameters.bank !== 'undefined') {
			_chooseOption(urlParameters.bank, urlParameters.bankHTML);
		} else {
			if ($options.length > 0) {
				bodyClickListener.register(this, onClickOutside);
				_chooseOption(0);
			} else {
				_chooseOption(null);
			}
		}

		$currentValueContainer.on('click', function () {
			$(dropDownList).toggleClass('coupled-shown');
		});

		$options.on('click', function () {
			_chooseOption(this);
			$(dropDownList).removeClass('coupled-shown');
		});

		function _chooseOption(chosenOption, chosenOptionHTML) {
			if (typeof chosenOption === 'number') {
				chosenOption = $options[chosenOption];
			}

			var chosenValue;

			if (chosenOption && typeof chosenOption === 'string' && chosenOptionHTML && typeof chosenOptionHTML === 'string') {
				$currentValueContainer.html(chosenOptionHTML);
				$(inputForStoringValue).val(chosenOption);
				$(inputForStoringHTML).val(chosenOptionHTML);
			}

			if (!chosenOption) {
				$currentValueContainer[0].innerHTML = '';
				$(inputForStoringValue).val('');
				$(inputForStoringHTML).val('');
				return true;
			}

			if (!chosenValue) chosenValue = $(chosenOption).find('.value')[0];
			if (chosenValue) chosenValue = chosenValue.getAttribute('data-value');

			chosenOptionHTML = $(chosenOption).html();
			$currentValueContainer.html(chosenOptionHTML);
			$(inputForStoringValue).val(chosenValue);
			$(inputForStoringHTML).val(chosenOptionHTML);
		}

		function onClickOutside() {
			$(dropDownList).removeClass('coupled-shown');
		}
	});
})();
