/*
 * iosMenu - http://iosscripts.com/iosmenu/
 * 
 * Title
 *
 * Desc
 * 
 * Copyright (c) 2013 Marc Whitbread
 * 
 * Version: v0.1.12 (12/18/2013)
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
	
	var default_settings = {
		obj: '',
		bg_obj: '',
		resp: {
			menu_w: 0,
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
				pull_threshold: false
			}
		},
		body_css: {
			position: 'relative'
		},
		css: {
			position: 'fixed',
			top: 0,
			left: 0,
			bottom: 0,
			width: '80%',
			maxWidth: '300px',
			minWidth: '100px',
			zIndex: 1000,
			display: 'block',
			opacity: 1,
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
		menu_number: 0,
		fixed_nav_selection: ''
	}
	
	/* private functions */
	var helpers = {
		
		init_globals: function() {
		
			globals.browser.orientation_event = globals.browser.orientation_change ? 'orientationchange' : 'resize';
			
			helpers.has_3d_transform();
			
		},
		
		init_settings: function(custom_settings) {
			
			globals.menu_count++;
			
			var settings = $.extend(true, default_settings, custom_settings);
			settings.menu_number = globals.menu_count;
			
			return settings;
		
		},
		
		init_css: function(settings) {
			
			$(settings.obj).css(settings.css).css({
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
		
		set_resp_settings: function(settings) {
			
			globals.browser.window_w = $(window).width();
			globals.browser.window_h = $(window).height();
			
			settings.resp.menu_w = $(settings.obj).width();
			settings.resp.menu_h = $(settings.obj).height();
			
			settings.resp.offset_left_op = (settings.menu_location == 'left') ? settings.resp.menu_w : -settings.resp.menu_w;
			settings.resp.offset_left_cl = 0;
			settings.resp.offset_left_mi = (settings.menu_location == 'left') ? settings.resp.menu_w * 0.5 : settings.resp.menu_w * -0.5;
			
			settings.resp.pull_threshold_px = parseInt(globals.browser.window_w * settings.touch.pull_threshold_perc, 10);
			
			if(settings.resp.pull_threshold_px < settings.touch.pull_threshold_min_px) {
				settings.resp.pull_threshold_px = settings.touch.pull_threshold_min_px;
			} else if(settings.resp.pull_threshold_px > settings.touch.pull_threshold_max_px) {
				settings.resp.pull_threshold_px = settings.touch.pull_threshold_max_px;
			}
			
			settings.resp.pull_threshold = (settings.menu_location == 'left') ? settings.resp.pull_threshold_px : globals.browser.window_w - settings.resp.pull_threshold_px;
			
			return settings;
			
		},
		
		set_resp_css: function(settings) {
			
			$(settings.obj).css(settings.css).css({
				width: settings.resp.menu_w + 'px'
			});
			
			var position = (settings.state.open) ? settings.resp.offset_left_op : settings.resp.offset_left_cl;
			helpers.set_position(settings, position);
			
		},
		
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
		
		update_data: function(settings) {
			
			$(settings.obj).data('iosmenu', {
				settings: settings
			});
			
		},
		
		clear_animate_timer: function(settings) {
		
			for(var i = 0; i < settings.anim.menu_timeouts.length; i++) {
				clearTimeout(settings.anim.menu_timeouts[i]);
				settings.anim.menu_timeouts[i] = undefined;
			}
			
		},

		get_position: function(settings) {
		
			var offset = 0;
			
			/*if(globals.browser.has_3d_transform && !globals.browser.is_ie7 && !globals.browser.is_ie8) {
				
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
				
				offset = (transformArray[4] == undefined) ? 0 : parseInt(transformArray[4], 10);
		
			} else {
			
				offset = parseInt($('body').css('left'), 10);
			
			}*/
			
			offset = parseInt($('body').css('left'), 10);
			
			return offset;
			
		},
		
		set_position: function(settings, left) {
			
			var opacity = (left == settings.resp.offset_left_cl) ? 0 : 1;
			var display = (left == settings.resp.offset_left_cl) ? 'none' : 'block';
			var perc = ((left - settings.resp.offset_left_op) / (settings.resp.offset_left_cl - settings.resp.offset_left_op) * -settings.bg_css.opacity) + settings.bg_css.opacity;
			var menu_left = (settings.menu_location == 'left') ? left - settings.resp.menu_w : globals.browser.window_w + left;
			
			if(!globals.browser.has_3d_transform || true) {
				
				$('body').add(settings.fixed_nav_selection).css({
					'left': left + 'px'
				});
				
				$(settings.obj).css('left', menu_left + 'px');
			
			} else {
				
				$('body').add(settings.fixed_nav_selection).css({
					'webkitTransform': 'matrix(1,0,0,1,' + left + ',0)',
					'MozTransform': 'matrix(1,0,0,1,' + left + ',0)',
					'transform': 'matrix(1,0,0,1,' + left + ',0)'
				});
				
				$(settings.obj).css({
					'webkitTransform': 'matrix(1,0,0,1,' + menu_left + ',0)',
					'MozTransform': 'matrix(1,0,0,1,' + menu_left + ',0)',
					'transform': 'matrix(1,0,0,1,' + menu_left + ',0)'
				});
				
			}
			
			$(settings.obj).css({
				'opacity': opacity
			});
				
			settings.bg_obj.css({
				'opacity': perc,
				'display': display
			});
			
		},
		
		snap_direction: function(settings, x_pull) {
	
			var snap_dir = 0;
			
			if(x_pull.distance > settings.touch.snap_threshold) {
				snap_dir = (settings.menu_location == 'left') ? -1 : 1;
			} else if(x_pull.distance < (settings.touch.snap_threshold * -1)) {
				snap_dir = (settings.menu_location == 'left') ? 1 : -1;
			}
			
			if((snap_dir == 0) && (helpers.get_position(settings) <= settings.resp.offset_left_mi)) {
				snap_dir = (settings.menu_location == 'left') ? -1 : 1;
			} else if((snap_dir == 0) && (helpers.get_position(settings) > settings.resp.offset_left_mi)) {
				snap_dir = (settings.menu_location == 'left') ? 1 : -1;
			}
			
			return snap_dir;
			
		},
		
		toggle_menu: function(settings, dir) {
			
			var steps = settings.anim.fps/settings.anim.duration;
			var timer_step = settings.anim.duration/steps;
			var offset_left_1 = helpers.get_position(settings);
			var offset_left_2 = (dir == 1) ? settings.resp.offset_left_op : settings.resp.offset_left_cl;
			
			helpers.clear_animate_timer(settings);
			
			for(var i = 1; i <= steps; i++) {
				
				var t = i; t /= steps; t--;
				var pow = Math.pow(t,5) + 1;
				var left = Math.round(offset_left_1 - (offset_left_1 - offset_left_2) * pow);
				
				settings = helpers.animate_menu_timer(i*timer_step, left, settings);
				
			}
			
			settings = helpers.animate_menu_timer((steps+1)*timer_step, offset_left_2, settings);
			
			return settings;
			
		},
		
		animate_menu_timer: function(time, left, settings) {
			
			settings.anim.menu_timeouts[settings.anim.menu_timeouts.length] = setTimeout(function() {
				settings = helpers.animate_menu(left, settings);
			}, time);
			
			return settings;
			
		},
		
		animate_menu: function(left, settings) {
			
			settings.state.open = (left == settings.resp.offset_left_cl) ? false : true;
			
			helpers.set_position(settings, left);
			
			return settings;
			
		}
        
    }
    
    helpers.set_browser_info();
    
    var methods = {
		
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
			
			/* resize event */
			$(window).bind(globals.browser.orientation_event + '.iosmenu-' + settings.menu_number, function() {
				methods.update(settings.obj);
			});
			
			/* touch events */
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
			
			var start_flag = false;
			var is_mouse_down = false;
			
			/* touch/move start */
			$(window).bind('touchstart.iosmenu-' + settings.menu_number + ', mousedown.iosmenu-' + settings.menu_number, function(e) {
				
				if(start_flag) return true;
				start_flag = true;
								
				if((!globals.browser.is_ie7) && (!globals.browser.is_ie8)) e = e.originalEvent;
				
				if(e.type == 'touchstart') {
							
					x_pull.event = e.touches[0].pageX;
					y_pull.event = e.touches[0].pageY;
					
				} else {
				
					if (window.getSelection) {
						if (window.getSelection().empty) {
							window.getSelection().empty();
						} else if (window.getSelection().removeAllRanges) {
							window.getSelection().removeAllRanges();
						}
					} else if (document.selection) {
						if(globals.browser.is_ie8) {
							try { document.selection.empty(); } catch(e) { /* absorb ie8 bug */ }
						} else {
							document.selection.empty();
						}
					}
					
					x_pull.event = e.pageX;
					y_pull.event = e.pageY;
					
					is_mouse_down = true;

				}
				
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
			
			/* touch move */
			$(window).bind('touchmove.iosmenu-' + settings.menu_number + ', mousemove.iosmenu-' + settings.menu_number, function(e) {
				
				if((!globals.browser.is_ie7) && (!globals.browser.is_ie8)) e = e.originalEvent;
				
				if(settings.state.flags.pull_threshold) return true;
				
				var menu_offset = helpers.get_position(settings);
				
				//if event originated from touch
				if(e.type == 'touchstart') {
							
					x_pull.event = e.touches[0].pageX;
					y_pull.event = e.touches[0].pageY;
					
				} else {
					
					if(!is_mouse_down) return true;
					
					if (window.getSelection) {
						if (window.getSelection().empty) {
							window.getSelection().empty();
						} else if (window.getSelection().removeAllRanges) {
							window.getSelection().removeAllRanges();
						}
					} else if (document.selection) {
						if(globals.browser.is_ie8) {
							try { document.selection.empty(); } catch(e) { /* absorb ie8 bug */ }
						} else {
							document.selection.empty();
						}
					}
					
					x_pull.event = e.pageX;
					y_pull.event = e.pageY;

				}
				
				x_pull.rate[0] = x_pull.rate[1];
				x_pull.rate[1] = x_pull.event;
				x_pull.distance = (x_pull.rate[0] - x_pull.rate[1]) / 2;
				
				y_pull.rate[0] = y_pull.rate[1];
				y_pull.rate[1] = y_pull.event;
				y_pull.distance = (y_pull.rate[0] - y_pull.rate[1]) / 2;
				
				//if open, prevent browser scrolling
				if(settings.state.open)
					e.preventDefault();
				
				//if touch did not originate from within touch threshold
				if((((x_pull.event > settings.resp.pull_threshold) && (settings.menu_location == 'left')) || ((x_pull.event < settings.resp.pull_threshold) && (settings.menu_location != 'left'))) && !x_pull.started)
					return true;	
				
				//if vertical velocity is hit before horizontal
				if(((y_pull.distance > settings.touch.v_pull_threshold) || (y_pull.distance < (settings.touch.v_pull_threshold * -1))) && !x_pull.started)
					y_pull.started = true;
				
				//if horizontal velocity his hit before vertical
				if((x_pull.distance < settings.touch.h_pull_threshold) || (x_pull.distance > (settings.touch.h_pull_threshold * -1)))
					e.preventDefault();
				
				//???
				if(((x_pull.distance < settings.touch.start_threshold) || (x_pull.distance > (settings.touch.start_threshold * -1))) && !y_pull.started && !x_pull.started) {
					x_pull.start_position = (menu_offset - x_pull.event) * -1;
					x_pull.started = true;
				}
				
				//if horizontal movement has started and vertical has not
				if(!y_pull.started && x_pull.started) {

					settings.state.open = true;
					helpers.clear_animate_timer(settings);
					
					var new_position = (x_pull.start_position - x_pull.event) * -1;
					
					//
					if(((settings.menu_location == 'left') && (new_position > settings.resp.offset_left_op)) || ((settings.menu_location != 'left') && (new_position < settings.resp.offset_left_op))) {
						new_position = settings.resp.offset_left_op;
					}
					
					if(((settings.menu_location == 'left') && (new_position < settings.resp.offset_left_cl)) || ((settings.menu_location != 'left') && (new_position > settings.resp.offset_left_cl))) {
						new_position = settings.resp.offset_left_cl;
					}
					
					helpers.set_position(settings, new_position);
					
				}
			
			});
			
			/* touch end */
			$(window).bind('touchend.iosmenu-' + settings.menu_number + ', mouseup.iosmenu-' + settings.menu_number, function(e) {
				
				//???
				if(settings.state.flags.pull_threshold) return true;
				
				//close if click is detected outside menu
				if((((settings.menu_location == 'left') && (x_pull.event > helpers.get_position(settings))) || ((settings.menu_location != 'left') && (x_pull.event < (helpers.get_position(settings) + globals.browser.window_w)))) && !x_pull.started) {
					x_pull.direction = -1;
				} else {
					x_pull.direction = helpers.snap_direction(settings, x_pull);
				}
				
				settings = helpers.toggle_menu(settings, x_pull.direction);
				helpers.update_data(settings);
				
				start_flag = false;
				is_mouse_down = false;
				x_pull.started = false;
				
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
		
		/* reinitialize the menu */
		update: function(node) {
			
			if(node == undefined) node = this;
			
			var node = $(node).eq(0);
			var data = $(node).data('iosmenu');

			if(data == undefined) return false;

			settings = helpers.set_resp_settings(data.settings);
			helpers.set_resp_css(settings);
		
		},
		
		/* toggle the menu */
		toggle: function(node) {
			
			if(node == undefined) node = this;
			
			var node = $(node).eq(0);
			var data = $(node).data('iosmenu');
			
			if(data == undefined) return false;
			
			var direction = (data.settings.state.open) ? -1 : 1;
			helpers.toggle_menu(data.settings, direction);
			
		},
		
		/* open the menu */
		open: function(node) {
			
			if(node == undefined) node = this;
			
			var node = $(node).eq(0);
			var data = $(node).data('iosmenu');
			
			if(data == undefined) return false;
			
			helpers.toggle_menu(data.settings, 1);
			
		},
		
		/* close the menu */
		close: function(node) {
			
			if(node == undefined) node = this;
			
			var node = $(node).eq(0);
			var data = $(node).data('iosmenu');
			
			if(data == undefined) return false;
			
			helpers.toggle_menu(data.settings, -1);
			
		}
	
	}
	
	/* public functions */
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