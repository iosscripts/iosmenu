/*
 * iosMenu - http://iosscripts.com/iosmenu/
 * 
 * Touch Enabled, Responsive jQuery Flyout Navigation Menu/Hidden Side Panel Plugin
 *
 * iosmenu is a jQuery plugin which allows you to integrate a customizable, cross-browser 
 * fly-out navigation menu into your mobile web presence. Designed for use as a native app 
 * style fly-out menu or hidden side content panel.
 * 
 * Copyright (c) 2013 Marc Whitbread
 * 
 * Version: v0.5.2 (05/13/2014)
 * Minimum requirements: jQuery v1.4+
 *
 * Advanced requirements:
 * 1) jQuery bind() click event override on slide requires jQuery v1.6+
 *
 * Terms of use:
 *
 * 1) iosMenu is licensed under the Creative Commons – Attribution-NonCommercial 3.0 License.
 * 2) You may use iosSlider free for personal or non-profit purposes, without restriction.
 *	  Attribution is not required but always appreciated. For commercial projects, you
 *	  must purchase a license. You may download and play with the script before deciding to
 *	  fully implement it in your project. Making sure you are satisfied, and knowing iosSlider
 *	  is the right script for your project is paramount.
 * 3) You are not permitted to make the resources found on iosscripts.com available for
 *    distribution elsewhere "as is" without prior consent. If you would like to feature
 *    iosSlider on your site, please do not link directly to the resource zip files. Please
 *    link to the appropriate page on iosscripts.com where users can find the download.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDI_liNG, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 */

;(function($) {
	
	/* global variables */
	var globals = {
		browser: {
			touch: 'ontouchstart' in window,
			orientation_change: 'onorientationchange' in window,
			orientation_event: '',
			is_webkit: false,
			is_ios7: false,
			is_ie: false,
			is_ie7: false,
			is_ie8: false,
			is_ie9: false,
			is_gecko: false,
			has_3d_transform: false,
			window_w: 0,
			window_h: 0
		},
		menu_count: -1
	}
	
	/* default settings */
	var default_settings = {
		obj: '',
		bg_obj: '',
		menu_number: 0,
		resp: {
			menu_w: 0,
			menu_outer_w: 0,
			menu_h: 0,
			offset_left_op: 0,
			offset_left_cl: 0,
			offset_left_mi: 0,
			pull_threshold_px: 0,
			pull_threshold: 0
		},
		touch: {
			pull_threshold_perc: 0.1,
			pull_threshold_max_px: 50,
			pull_threshold_min_px: 20,
			snap_threshold: 2,
			start_threshold: 0,
			v_pull_threshold: 3,
			h_pull_threshold: 3
		},
		anim: {
			fps: 60000,
			duration: 750,
			menu_timeouts: new Array()
		},
		state: {
			open: false,
			flags: {
				pull_threshold: false,
				event_start: false,
				mouse_down: false
			},
			callback_fired: {
				start: false,
				middle_open: false,
				middle_close: true,
				complete: false
			}
		},
		body_css: {
			position: 'relative'
		},
		menu_css: {
			position: 'fixed',
			top: 0,
			left: 0,
			bottom: 0,
			overflow: 'auto',
			zIndex: 1000,
			display: 'block',
			opacity: 1
		},
		bg_css: {
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			background: '#000',
			opacity: 0.75,
			zIndex: 999	
		},
		menu_location: 'right',
		parallax_ratio: 1,
		menu_toggle_button_selector: '',
		move_with_menu_selector: '',
		on_loaded: '',
		on_resize: '',
		on_update: '',
		on_start: '',
		on_middle: '',
		on_complete: '',
		on_step: ''
	}
	
	/* private methods */
	var helpers = {
		
		/* initialize global variables */
		init_globals: function() {
		
			globals.browser.orientation_event = globals.browser.orientation_change ? 'orientationchange' : 'resize';
			
			helpers.has_3d_transform();
			
		},
		
		/* initialize settings */
		init_settings: function(custom_settings) {
			
			globals.menu_count++;
			
			//clone defaults without reference
			var default_deep_copy = $.extend(true, {}, default_settings);
			
			var settings = $.extend(true, default_deep_copy, custom_settings);
			settings.menu_number = globals.menu_count;
			
			return settings;
		
		},
		
		/* initialize required css on elements */
		init_css: function(settings) {
			
			$(settings.obj).css(settings.menu_css).css({
				opacity: 0,
				zIndex: -1000,
				display: 'none'
			});
			
			var bg = $('<div />', {
				'class': 'iosmenu-bg-' + settings.menu_number
			}).css(settings.bg_css).css({
				opacity: 0,
				zIndex: 999,
				display: 'none'
			});
			
			settings.bg_obj = bg;
			
			$('body').append(bg).css(settings.body_css);
			
			return settings;
			
		},
		
		/* calculate position and size of elements responsively */
		set_resp_settings: function(settings) {
			
			globals.browser.window_w = $(window).width();
			globals.browser.window_h = $(window).height();
			
			$(settings.obj).css('width', '');
			settings.resp.menu_w = $(settings.obj).width();
			settings.resp.menu_outer_w = $(settings.obj).outerWidth(true);
			settings.resp.menu_h = $(settings.obj).height();
			
			settings.resp.offset_left_op = (settings.menu_location == 'left') ? settings.resp.menu_outer_w : -settings.resp.menu_outer_w;
			settings.resp.offset_left_cl = 0;
			settings.resp.offset_left_mi = (settings.menu_location == 'left') ? settings.resp.menu_outer_w * 0.5 : settings.resp.menu_outer_w * -0.5;
			
			settings.resp.pull_threshold_px = parseInt(globals.browser.window_w * settings.touch.pull_threshold_perc, 10);
			
			if(settings.resp.pull_threshold_px < settings.touch.pull_threshold_min_px) {
				settings.resp.pull_threshold_px = settings.touch.pull_threshold_min_px;
			} else if(settings.resp.pull_threshold_px > settings.touch.pull_threshold_max_px) {
				settings.resp.pull_threshold_px = settings.touch.pull_threshold_max_px;
			}
			
			settings.resp.pull_threshold = (settings.menu_location == 'left') ? settings.resp.pull_threshold_px : globals.browser.window_w - settings.resp.pull_threshold_px;
			
			return settings;
			
		},
		
		/* set position and size of elements responsively */
		set_resp_css: function(settings) {
			
			$(settings.obj).css(settings.menu_css).css({
				width: settings.resp.menu_w + 'px'
			});
			
			var position = (settings.state.open) ? settings.resp.offset_left_op : settings.resp.offset_left_cl;
			helpers.set_position(settings, position);
			
		},
		
		/* set browser information */
		set_browser_info: function() {
			
			if(navigator.userAgent.match('WebKit') != null) {
				globals.browser.is_webkit = true;
			} else if(navigator.userAgent.match('Gecko') != null) {
				globals.browser.is_gecko = true;
			} else if(navigator.userAgent.match('MSIE 7') != null) {
				globals.browser.is_ie7 = true;
				globals.browser.is_ie = true;
			} else if(navigator.userAgent.match('MSIE 8') != null) {
				globals.browser.is_ie8 = true;
				globals.browser.is_ie = true;
			} else if(navigator.userAgent.match('MSIE 9') != null) {
				globals.browser.is_ie9 = true;
				globals.browser.is_ie = true;
			}
			
			if(navigator.userAgent.match(/(iPad|iPhone);.*CPU.*OS 7_\d/i)) {
				globals.browser.is_io7 = true;
			}
			
		},
		
		/* check if browser supports 3d transformations */
		has_3d_transform: function() {
			
			var has_3d = false;
			
			var testElement = $('<div />').css({
				'webkitTransform': 'matrix(1,1,1,1,1,1)',
				'MozTransform': 'matrix(1,1,1,1,1,1)',
				'transform': 'matrix(1,1,1,1,1,1)'
			});
			
			if(testElement.attr('style') == '') {
				has_3d = false;
			} else if(testElement.attr('style') != undefined) {
				has_3d = true;
			}
			
			globals.browser.has_3d_transform = has_3d;
			
		},
		
		/* update jQuery.data() object for the menu */
		update_data: function(settings) {
			
			$(settings.obj).data('iosmenu', {
				settings: settings
			});
			
		},
		
		/* get the current menu position */
		get_position: function(settings) {
		
			var offset = 0;
			
			//disabled due to browser limitiation preventing transform on body element
			if(globals.browser.has_3d_transform && !globals.browser.is_ie7 && !globals.browser.is_ie8 && false) {
				
				var transforms = new Array('-webkit-transform', '-moz-transform', 'transform');
				var transformArray;
				
				for(var i = 0; i < transforms.length; i++) {
					
					if($('body').css(transforms[i]) != undefined) {
						
						if($('body').css(transforms[i]).length > 0) {
						
							transformArray = $('body').css(transforms[i]).split(',');
							
							break;
							
						}
					
					}
				
				}
				
				offset = (transformArray[4] == undefined) ? 0 : parseInt(transformArray[4], 10) / settings.parallax_ratio;
		
			} else {
			
				offset = parseInt($('body').css('left'), 10) / settings.parallax_ratio;
			
			}
			
			return offset;
			
		},
		
		/* set the menu position */
		set_position: function(settings, left) {
			
			var opacity = (left == settings.resp.offset_left_cl) ? 0 : 1;
			var display = (left == settings.resp.offset_left_cl) ? 'none' : 'block';
			var perc = ((left - settings.resp.offset_left_op) / (settings.resp.offset_left_cl - settings.resp.offset_left_op) * -settings.bg_css.opacity) + settings.bg_css.opacity;
			var menu_left = (settings.menu_location == 'left') ? left - settings.resp.menu_w : globals.browser.window_w + left;
			var selection_left = left;
			var left = left * settings.parallax_ratio;
			
			//if browser can transform
			if(globals.browser.has_3d_transform) {
				
				//disable due to browser limitiation preventing transform on body element
				/*$('body').add(settings.fixed_nav_selection).css({
					'webkitTransform': 'matrix(1,0,0,1,' + left + ',0)',
					'MozTransform': 'matrix(1,0,0,1,' + left + ',0)',
					'transform': 'matrix(1,0,0,1,' + left + ',0)'
				});*/
				
				$(settings.obj).css({
					'webkitTransform': 'matrix(1,0,0,1,' + menu_left + ',0)',
					'MozTransform': 'matrix(1,0,0,1,' + menu_left + ',0)',
					'transform': 'matrix(1,0,0,1,' + menu_left + ',0)'
				});
				
				$(settings.move_with_menu_selector).css({
					'webkitTransform': 'matrix(1,0,0,1,' + selection_left + ',0)',
					'MozTransform': 'matrix(1,0,0,1,' + selection_left + ',0)',
					'transform': 'matrix(1,0,0,1,' + selection_left + ',0)'
				});
			
			} else {
				
				//disable due to browser limitiation preventing transform on body element
				/*$('body').add(settings.fixed_nav_selection).css({
					'left': left + 'px'
				});*/
				
				$(settings.obj).css('left', menu_left + 'px');
				
				$(settings.move_with_menu_selector).css('left', selection_left + 'px');
				
			}
			
			$('body').css({
				'left': left + 'px'
			});

			$(settings.obj).css({
				'opacity': opacity
			});
			
			settings.bg_obj.css({
				'opacity': perc,
				'display': display
			});
			
		},
		
		/* calculate snap direction */
		snap_direction: function(settings, x_pull) {
	
			var snap_dir = 0;
			
			if(x_pull.distance > settings.touch.snap_threshold) {
				snap_dir = 1;
			} else if(x_pull.distance < (settings.touch.snap_threshold * -1)) {
				snap_dir = -1;
			}
			
			if((snap_dir == 0) && (helpers.get_position(settings) <= settings.resp.offset_left_mi)) {
				snap_dir = 1;
			} else if((snap_dir == 0) && (helpers.get_position(settings) > settings.resp.offset_left_mi)) {
				snap_dir = -1;
			}
			
			if(settings.menu_location == 'left') 
				snap_dir = -snap_dir;
			
			return snap_dir;
			
		},
		
		/* animation builder */
		animate_menu: function(settings, dir) {
			
			var steps = settings.anim.fps/settings.anim.duration;
			var timer_step = settings.anim.duration/steps;
			var offset_left_1 = helpers.get_position(settings);
			var offset_left_2 = (dir == 1) ? settings.resp.offset_left_op : settings.resp.offset_left_cl;
			
			helpers.animate_menu_timer_clear(settings);
			
			for(var i = 1; i <= steps; i++) {
				
				var t = i; t /= steps; t--;
				var pow = Math.pow(t,5) + 1;
				var left = Math.round(offset_left_1 - (offset_left_1 - offset_left_2) * pow);
				
				settings = helpers.animate_menu_timer(i*timer_step, left, false, settings);
				
				//if steps have been generated to stop position already, break loop
				if(left == offset_left_2) break;
				
			}
			
			settings = helpers.animate_menu_timer((i+1)*timer_step, offset_left_2, true, settings);
			
			return settings;
			
		},
		
		/* animation frame queuing function */
		animate_menu_timer: function(time, left, is_last_frame, settings) {
			
			settings.anim.menu_timeouts[settings.anim.menu_timeouts.length] = setTimeout(function() {
				settings = helpers.animate_menu_step(left, is_last_frame, settings);
			}, time);
			
			return settings;
			
		},
		
		/* animation frame step */
		animate_menu_step: function(left, is_last_frame, settings) {
			
			settings.state.open = (left == settings.resp.offset_left_cl) ? false : true;
			
			helpers.set_position(settings, left);
			
			settings = helpers.callback.start(settings);
			
			settings = helpers.callback.step(settings);
			
			settings = helpers.callback.middle(settings);
			
			//last animation step only
			if(is_last_frame)
				helpers.callback.complete(settings);
			
			return settings;
			
		},
		
		/* clear all animation frames from the queue */
		animate_menu_timer_clear: function(settings) {
		
			for(var i = 0; i < settings.anim.menu_timeouts.length; i++) {
				clearTimeout(settings.anim.menu_timeouts[i]);
				settings.anim.menu_timeouts[i] = undefined;
			}
			
		},
		
		/* unselect/remove highlighting from all elements when dragging */
		deselect_elements: function() {
				
			if (window.getSelection) {
				if (window.getSelection().empty) {
					window.getSelection().empty();
				} else if (window.getSelection().removeAllRanges) {
					window.getSelection().removeAllRanges();
				}
			} else if (document.selection) {
				if(globals.browser.is_ie8) {
					try { document.selection.empty(); } catch(e) { 
						//absorb ie8 bug 
					}
				} else {
					document.selection.empty();
				}
			}
		
		},
		
		/* callbacks */
		callback: {
			
			/* simplified arguements object supplied to callbacks */
			args: function(settings) {
				
				var args = {
					is_open: settings.state.open,
					is_open_past_mid: settings.state.callback_fired.middle_open,
					perc_open: Math.round(helpers.get_position(settings) / settings.resp.offset_left_op * 100),
					settings_raw: settings
				}
				
				return args;
				
			},
			
			/* reset callback flags */
			reset: function(settings) {
			
				settings.state.callback_fired.start = false;
				settings.state.callback_fired.middle = false;
				settings.state.callback_fired.complete = false;
				
				return settings;
				
			},
			
			/* on menu initialization */
			loaded: function(settings) {
			
				if(settings.on_loaded != '')
					settings.on_loaded(helpers.callback.args(settings));
			
			},
				
			/* on browser resize or orientation change */
			resize: function(settings) {
			
				if(settings.on_resize != '')
					settings.on_resize(helpers.callback.args(settings));
				
			},
			
			/* on update public method call */
			update: function(settings) {
			
				if(settings.on_update != '')
					settings.on_update(helpers.callback.args(settings));
				
			},
			
			/* on movement start callback */
			start: function(settings) {
				
				settings.state.callback_fired.complete = false;
				
				//callback is set and not already fired
				if((settings.on_start != '') && !settings.state.callback_fired.start) {
					settings.state.callback_fired.start = true;
					settings.on_start(helpers.callback.args(settings));
				}
				
				return settings;
				
			},
			
			/* on movement beyond 50% (half way) open/close */
			middle: function(settings) {
			
				var args = helpers.callback.args(settings);
				
				//callback is set and not already fired and passing beyond half way open
				if((args.perc_open >= 50) && !settings.state.callback_fired.middle_open) {					
					settings.state.callback_fired.middle_open = true;
					settings.state.callback_fired.middle_close = false;
					
					if(settings.on_middle != '')
						settings.on_middle(helpers.callback.args(settings));
				}
				
				//callback is set and not already fired and passing beyond half way closed
				if((args.perc_open < 50) && !settings.state.callback_fired.middle_close) {					
					settings.state.callback_fired.middle_open = false;
					settings.state.callback_fired.middle_close = true;
					
					if(settings.on_middle != '')
						settings.on_middle(helpers.callback.args(settings));
				}
			
				return settings;
				
			},
			
			/* on movement complete callback */
			complete: function(settings) {
				
				settings.state.callback_fired.start = false;
				
				//callback is set and not already fired
				if((settings.on_complete != '') && !settings.state.callback_fired.complete) {	
					settings.state.callback_fired.complete = true;
					settings.on_complete(helpers.callback.args(settings));
				}
				
				return settings;
				
			},
			
			/* on animation step callback */
			step: function(settings) {
				
				if(settings.on_step != '')
					settings.on_step(helpers.callback.args(settings));
				
				return settings;
				
			}
		}
        
    }
    
    helpers.set_browser_info();
    
    /* public methods */
    var methods = {
		
		/* initialize the menu */
		init: function(options, node) {
			
			if(node == undefined) node = this;
			
			var data = $(node).data('iosmenu');
			if(data != undefined) return true;
				
			helpers.init_globals();
			
			var settings = helpers.init_settings(options);
			settings.obj = $(node).eq(0);
			
			settings = helpers.init_css(settings);
			
			settings = helpers.set_resp_settings(settings);
			helpers.set_resp_css(settings);
			
			helpers.callback.loaded(settings);
				
			//touch/click event data
			var x_pull = {
				event: 0,
				rate: 0,
				distance: 0,
				direction: 0,
				started: false,
				start_position: undefined
			}
			
			var y_pull = {
				event: 0,
				rate: 0,
				distance: 0,
				direction: 0,
				started: false,
				start_position: undefined
			}
			
			//selector event bindings 
			$(settings.menu_toggle_button_selector).css('cursor', 'pointer');
			$(settings.menu_toggle_button_selector).bind('click', function(e) {
				methods.toggle(settings.obj);
			});
			
			var menu_vertical_scroll_lock_top = false;
			var menu_vertical_scroll_lock_bottom = false;
			
			//touchstart/mousedown event binding
			$(window).bind('touchstart.iosmenu-' + settings.menu_number + ', mousedown.iosmenu-' + settings.menu_number, function(e) {
				
				if(settings.state.flags.event_start) return true;
				settings.state.flags.event_start = true;
				settings = helpers.callback.reset(settings);
				
				if((!globals.browser.is_ie7) && (!globals.browser.is_ie8)) e = e.originalEvent;
				
				//if event originated from touch
				if(e.type == 'touchstart') {
							
					x_pull.event = e.touches[0].pageX;
					y_pull.event = e.touches[0].pageY;
					
				} else {
					
					x_pull.event = e.pageX;
					y_pull.event = e.pageY;
					
					settings.state.flags.mouse_down = true;

				}
				
				//check vertical scroll location of menu
				if(($(e.target).closest('.iosmenu').length == 1) && ($(e.target).closest('.iosmenu').scrollTop() <= 0))
					menu_vertical_scroll_lock_top = true;
					
				if(($(e.target).closest('.iosmenu').length == 1) && ($(e.target).closest('.iosmenu').scrollTop() >= ($(e.target).closest('.iosmenu')[0].scrollHeight - settings.resp.menu_h)))
					menu_vertical_scroll_lock_bottom = true;
									
				settings.state.flags.pull_threshold = false;
				
				x_pull.rate = new Array(0, 0);
				x_pull.distance = 0;
				x_pull.started = false;
				
				x_pull.start_position = (helpers.get_position(settings) - x_pull.event) * -1;
				x_pull.rate[1] = x_pull.event;
				
				y_pull.rate = new Array(0, 0);
				y_pull.distance = 0;
				y_pull.started = false;
				
				y_pull.start_position = y_pull.event * -1;
				y_pull.rate[1] = y_pull.event;
			
			});
			
			//touchmove/mousemove event binding
			$(window).bind('touchmove.iosmenu-' + settings.menu_number + ', mousemove.iosmenu-' + settings.menu_number, function(e) {
				
				if((!globals.browser.is_ie7) && (!globals.browser.is_ie8)) e = e.originalEvent;
				
				if(settings.state.flags.pull_threshold) return true;
				
				var menu_offset = helpers.get_position(settings);
				
				//if event originated from touch
				if(e.type == 'touchmove') {
					
					x_pull.event = e.touches[0].pageX;
					y_pull.event = e.touches[0].pageY;
					
				} else {
					
					if(!settings.state.flags.mouse_down) return true;
					
					x_pull.event = e.pageX;
					y_pull.event = e.pageY;

				}
				
				x_pull.rate[0] = x_pull.rate[1];
				x_pull.rate[1] = x_pull.event;
				x_pull.distance = (x_pull.rate[0] - x_pull.rate[1]) / 2;
				
				y_pull.rate[0] = y_pull.rate[1];
				y_pull.rate[1] = y_pull.event;
				y_pull.distance = (y_pull.rate[0] - y_pull.rate[1]) / 2;
				
				//menu open, prevent browser scrolling outside of the menu
				if(settings.state.open && ($(e.target).closest('.iosmenu').length != 1))
					e.preventDefault();
				
				//touch did not originate from within touch threshold
				if((((x_pull.event > settings.resp.pull_threshold) && (settings.menu_location == 'left')) || ((x_pull.event < settings.resp.pull_threshold) && (settings.menu_location != 'left'))) && !x_pull.started && !settings.state.open)
					return true;
				
				//vertical velocity is hit before horizontal
				if(((y_pull.distance > settings.touch.v_pull_threshold) || (y_pull.distance < (settings.touch.v_pull_threshold * -1))) && !x_pull.started)
					y_pull.started = true;
				
				//if menu scroll is at top and dragging down
				if(menu_vertical_scroll_lock_top && (y_pull.distance > 0))
					menu_vertical_scroll_lock_top = false;
				
				//if menu scroll is at bottom and dragging up
				if(menu_vertical_scroll_lock_bottom && (y_pull.distance < 0))
					menu_vertical_scroll_lock_bottom = false;
				
				//menu scroll is at top and dragging up
				if(menu_vertical_scroll_lock_top && (y_pull.distance < 0)) {
					menu_vertical_scroll_lock_top = false;
					e.preventDefault();	
				}
				
				//menu scroll is at bottom and dragging down
				if(menu_vertical_scroll_lock_bottom && (y_pull.distance > 0)) {
					menu_vertical_scroll_lock_bottom = false;
					e.preventDefault();
				}
				
				//horizontal velocity is hit before vertical
				if(((x_pull.distance < settings.touch.h_pull_threshold) || (x_pull.distance > (settings.touch.h_pull_threshold * -1))) && ($(e.target).closest('.iosmenu').length != 1))
					e.preventDefault();
				
				//horizontal movement is starting
				if(((x_pull.distance < settings.touch.start_threshold) || (x_pull.distance > (settings.touch.start_threshold * -1))) && !y_pull.started && !x_pull.started) {
					x_pull.start_position = (menu_offset - x_pull.event) * -1;
					x_pull.started = true;
					
					settings = helpers.callback.start(settings);
				}
				
				//if horizontal movement has started and vertical has not
				if(!y_pull.started && x_pull.started) {
					
					helpers.deselect_elements();
					
					settings.state.open = true;
					helpers.animate_menu_timer_clear(settings);
					
					var new_position = (x_pull.start_position - x_pull.event) * -1;
					
					//greater than max menu position
					if(((settings.menu_location == 'left') && (new_position > settings.resp.offset_left_op)) || ((settings.menu_location != 'left') && (new_position < settings.resp.offset_left_op))) {
						new_position = settings.resp.offset_left_op;
					}
					
					//less than min menu position
					if(((settings.menu_location == 'left') && (new_position < settings.resp.offset_left_cl)) || ((settings.menu_location != 'left') && (new_position > settings.resp.offset_left_cl))) {
						new_position = settings.resp.offset_left_cl;
					}
					
					helpers.set_position(settings, new_position);
					
					settings = helpers.callback.step(settings);
					settings = helpers.callback.middle(settings);
					
				}
			
			});
			
			//touchend/mouseup event binding
			$(window).bind('touchend.iosmenu-' + settings.menu_number + ', mouseup.iosmenu-' + settings.menu_number, function(e) {
				
				//???
				if(settings.state.flags.pull_threshold) return true;
				
				//close if click is detected outside menu
				if((((settings.menu_location == 'left') && (x_pull.event > helpers.get_position(settings))) || ((settings.menu_location != 'left') && (x_pull.event < (helpers.get_position(settings) + globals.browser.window_w)))) && !x_pull.started) {
					x_pull.direction = -1;
				} else {
					x_pull.direction = helpers.snap_direction(settings, x_pull);
				}
				
				//menu open or pull has started
				if(x_pull.started || settings.state.open) {
					settings = helpers.animate_menu(settings, x_pull.direction);	
				}
				
				helpers.update_data(settings);
				
				settings.state.flags.event_start = false;
				settings.state.flags.mouse_down = false;
				x_pull.started = false;
				
				menu_vertical_scroll_lock_top = false;
				menu_vertical_scroll_lock_bottom = false;
				
			});
			
			//orientationchange/resize event binding
			$(window).bind(globals.browser.orientation_event + '.iosmenu-' + settings.menu_number, function() {
			
				methods.update(settings.obj);
				
				helpers.callback.resize(settings);
					
			});
			
			helpers.update_data(settings);
			
		},
		
		/* destroy the menu */
		destroy: function(clear_style) {
			
			var data = $(this).data('iosmenu');
			if(data == undefined) return false;
			
			$(data.settings.obj).removeAttr('style').unbind('.iosmenu, .iosmenu-' + data.settings.menu_number);
			$('body').removeAttr('style').unbind('.iosmenu, .iosmenu-' + data.settings.menu_number);
			$(window).unbind('.iosmenu, .iosmenu-' + data.settings.menu_number);
			
			$(data.settings.obj).removeData();
			$(data.settings.bg_obj).remove();
		
		},
		
		/* recalibrate the menu */
		update: function(node) {
			
			if(node == undefined) node = this;
			
			var node = $(node).eq(0);
			var data = $(node).data('iosmenu');

			if(data == undefined) return false;

			settings = helpers.set_resp_settings(data.settings);
			helpers.set_resp_css(settings);
			
			helpers.callback.update(settings);
		
		},
		
		/* toggle the menu */
		toggle: function(node) {
			
			if(node == undefined) node = this;
			
			var node = $(node).eq(0);
			var data = $(node).data('iosmenu');
			
			if(data == undefined) return false;
			
			var direction = (data.settings.state.open) ? -1 : 1;
			helpers.animate_menu(data.settings, direction);
			
		},
		
		/* open the menu */
		open: function(node) {
			
			if(node == undefined) node = this;
			
			var node = $(node).eq(0);
			var data = $(node).data('iosmenu');
			
			if(data == undefined) return false;
			
			helpers.animate_menu(data.settings, 1);
			
		},
		
		/* close the menu */
		close: function(node) {
			
			if(node == undefined) node = this;
			
			var node = $(node).eq(0);
			var data = $(node).data('iosmenu');
			
			if(data == undefined) return false;
			
			helpers.animate_menu(data.settings, -1);
			
		}
	
	}
	
	/* public method switcher */
	$.fn.iosMenu = function(method) {

		if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('invalid method call!');
		}
	
    };

}) (jQuery);