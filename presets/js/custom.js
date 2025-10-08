// JavaScript Document
jQuery(document).ready(function($) {
		
	"use strict";

	$(window).on('load', function() {
						
		/*----------------------------------------------------*/
		/*	Preloader
		/*----------------------------------------------------*/
		
		$("#loader").delay(100).fadeOut();
		$("#loader-wrapper").delay(100).fadeOut("fast");
				
		$(window).stellar({});

		//parallax scripts
         $('section.vc_parallax').each(function(){
            var opacity = $(this).data('opacity');
            var size = $(this).data('size');
            var position = $(this).data('position');
            var repeat = $(this).data('repeat');
            var attachment = $(this).data('attachment');
            var width = $(this).data('width');
            $(this).find('.vc_parallax-inner').css({
                opacity: opacity,
                backgroundSize: size,
                backgroundPosition: position,
                backgroundRepeat: repeat,
                backgroundAttachment: attachment,
                width: width
            });
        });
		
	});
	

	$(window).on('scroll', function() {	
								
		/*----------------------------------------------------*/
		/*	Navigtion Menu Scroll
		/*----------------------------------------------------*/	
		
		var b = $(window).scrollTop();
		
		if( b > 72 ){		
			$(".navbar.fixed-top").addClass("scroll");
		} else {
			$(".navbar.fixed-top").removeClass("scroll");
		}				

	});

	function landpick_setup_navwidth(){		
		if( $(window).width() < 992 ) return false;

		var navbarWidth = $('.navbar-nav').innerWidth();
		var navItemWidth = 0;
		var count = 1;

		$('.navbar-nav > .nav-item').each(function(){
			navItemWidth += parseInt($(this).outerWidth(true));	
		});

		if(navItemWidth > navbarWidth){
			$('.navbar-nav').addClass('navbar-overflowed');
			return false;
		}		
	}
	landpick_setup_navwidth();
	

	$('table').addClass('table');
	$('blockquote').addClass('blockquote');
	$('.sidebar-div select, .footer-widget select, .orderby').selectize({
		create: false,
	});

	$('.hero-class').each(function(){
		var section = $(this).closest('section');
		var sectionID = $(this).data('section_id');
		var sectionClass = $(this).data('class');

		if(section.hasClass('vc_section')){
			if(section.attr('id') != ''){
				section.attr( 'id', sectionID );
			}	

			section.addClass( sectionClass ).removeClass('wide-60');
		}else{
			$(this).closest('.vc_row').attr( 'id', sectionID );
			$(this).closest('.vc_row').addClass( sectionClass );
		}
	});

	$('.vc_row').each(function(){
    	 if($(this).children('.wpb_column').length > 1){
    	 	$(this).addClass('mul-cols');
	    	$(this).children('.wpb_column:last-child').addClass('last-column');
	    }
    });
    $('.row-inner-wrap').each(function(){
    	 if($(this).children('.wpb_column').length > 1){
    	 	$(this).addClass('mul-cols');
	    	$(this).children('.wpb_column:last-child').addClass('last-column');
	    }
    });


	/*----------------------------------------------------*/
	/*	Mobile Menu Toggle
	/*----------------------------------------------------*/

	if ( $(window).width() < 769 ) {
		$('.navbar-nav li.nav-item.nl-simple').on('click', function() {				
			$('#navbarSupportedContent').css("height", "1px").removeClass("in").addClass("collapse");
			$('#navbarSupportedContent').removeClass("show");						
		});
	}


	/*----------------------------------------------------*/
	/*	Animated Scroll To Anchor
	/*----------------------------------------------------*/
	
	$('.header a[href^="#"], .page a.btn[href^="#"], .page a.internal-link[href^="#"]').on('click', function (e) {
		
		e.preventDefault();

		var target = this.hash,
			$target = jQuery(target);

		if($target.length > 0)	{			
			$('html, body').stop().animate({
				'scrollTop': $target.offset().top - 60 // - 200px (nav-height)
			}, 'slow', 'easeInSine', function () {
				window.location.hash = '1' + target;
			});

		}

		
		
	});
	
	
	/*----------------------------------------------------*/
	/*	ScrollUp
	/*----------------------------------------------------*/
	
	$.scrollUp = function (options) {

		// Defaults
		var defaults = {
			scrollName: 'scrollUp', // Element ID
			topDistance: 600, // Distance from top before showing element (px)
			topSpeed: 800, // Speed back to top (ms)
			animation: 'fade', // Fade, slide, none
			animationInSpeed: 200, // Animation in speed (ms)
			animationOutSpeed: 200, // Animation out speed (ms)
			scrollText: '', // Text for element
			scrollImg: false, // Set true to use image
			activeOverlay: false // Set CSS color to display scrollUp active point, e.g '#00FFFF'
		};

		var o = $.extend({}, defaults, options),
				scrollId = '#' + o.scrollName;

		// Create element
		$('<a/>', {
			id: o.scrollName,
			href: '#top',
			title: o.scrollText
		}).appendTo('body');
		
		// If not using an image display text
		if (!o.scrollImg) {
			$(scrollId).html('<i class="fas fa-arrow-up"></i>');
		}

		// Minium CSS to make the magic happen
		$(scrollId).css({'display':'none','position': 'fixed','z-index': '2147483647'});

		// Active point overlay
		if (o.activeOverlay) {
			$("body").append("<div id='"+ o.scrollName +"-active'></div>");
			$(scrollId+"-active").css({ 'position': 'absolute', 'top': o.topDistance+'px', 'width': '100%', 'border-top': '1px dotted '+o.activeOverlay, 'z-index': '2147483647' });
		}

		// Scroll function
		$(window).on('scroll', function(){	
			switch (o.animation) {
				case "fade":
					$( ($(window).scrollTop() > o.topDistance) ? $(scrollId).fadeIn(o.animationInSpeed) : $(scrollId).fadeOut(o.animationOutSpeed) );
					break;
				case "slide":
					$( ($(window).scrollTop() > o.topDistance) ? $(scrollId).slideDown(o.animationInSpeed) : $(scrollId).slideUp(o.animationOutSpeed) );
					break;
				default:
					$( ($(window).scrollTop() > o.topDistance) ? $(scrollId).show(0) : $(scrollId).hide(0) );
			}
		});

		// To the top
		$(scrollId).on('click', function(event){
			$('html, body').animate({scrollTop:0}, o.topSpeed);
			event.preventDefault();
		});

	};
	if (LANDPICK.backtotop == 'on') {
		$.scrollUp();
	}
	

	/* count control */
    $('.count-control').on('click', function(){
    	var $quantity_input = $(this).closest('.quantity').find('.qty');
        var old = parseInt($quantity_input.val());
        if($(this).hasClass('plus')){
          $quantity_input.val(old+1);             

        }else{
          if(old > 1){
            $quantity_input.val(old-1);
          }     
        }

        $(this).closest('form').find('button[type="submit"]').prop('disabled', false);
        return false;
    });

    /*product-gallery-carousel*/
    $('.product-gallery-carousel').owlCarousel({
         margin: 15,
         nav: false,
         dots: true,
         items: 3,
         rtl: $('body').hasClass('rtl')? true : false
    });


	/*----------------------------------------------------*/
	/*	Single Image Lightbox
	/*----------------------------------------------------*/
	if( $('.image-link').length > 0 ){
		$('.image-link').magnificPopup({
		  type: 'image'
		});
	}		
	


	/*----------------------------------------------------*/
	/*	Video Link #1 Lightbox
	/*----------------------------------------------------*/
	if( $('.video-popup1').length > 0 ){
	$('.video-popup1').each(function(){		
		var videoUrl = $(this).attr( 'href' );
		$(this).magnificPopup({
		    type: 'iframe',
		  	  
				iframe: {
					patterns: {
						youtube: {
			   
							index: 'youtube.com',
							src: videoUrl
				
								}
							}
						}		  		  
		});
	});
	}


	/*----------------------------------------------------*/
	/*	Video Link #2 Lightbox
	/*----------------------------------------------------*/
	if( $('.video-popup2').length > 0 ){
	$('.video-popup2').each(function(){
		var videoUrl = $(this).attr( 'href' );
		$(this).magnificPopup({
		    type: 'iframe',		  	  
				iframe: {
					patterns: {
						youtube: {			   
							index: 'youtube.com',
							src: videoUrl				
								}
							}
						}		  		  
		});
	});
	}

	/*----------------------------------------------------*/
	/*	Statistic Counter
	/*----------------------------------------------------*/

	$('.count-element').each(function () {
		$(this).appear(function() {
			$(this).prop('Counter',0).animate({
				Counter: $(this).text()
			}, {
				duration: 4000,
				easing: 'swing',
				step: function (now) {
					$(this).text(Math.ceil(now));
				}
			});
		},{accX: 0, accY: 0});
	});

	/*----------------------------------------------------*/
		/*	Portfolio Grid
		/*----------------------------------------------------*/

		$('.grid-loaded').imagesLoaded(function () {

	        // filter items on button click
	        $('.gallery-filter').on('click', 'button', function () {
	            var filterValue = $(this).attr('data-filter');
	            $grid.isotope({
	              filter: filterValue
	            });
	        });

	        // change is-checked class on buttons
	        $('.gallery-filter button').on('click', function () {
	            $('.gallery-filter button').removeClass('is-checked');
	            $(this).addClass('is-checked');
	            var selector = $(this).attr('data-filter');
	            $grid.isotope({
	              filter: selector
	            });
	            return false;
	        });

	        // init Isotope
	        var $grid = $('.masonry-wrap').isotope({
	            itemSelector: '.gallery-item',
	            percentPosition: true,
	            
	            transitionDuration: '0.7s',
	            masonry: {
	              // use outer width of grid-sizer for columnWidth
	              columnWidth: '.gallery-item',
	            }

	        });

	    });
	    $('.gallery-filter button.is-checked').trigger('click');

	/*----------------------------------------------------*/
	/*	Gallery Images Rotator
	/*----------------------------------------------------*/

	var owl = $('.images-carousel');
		owl.owlCarousel({
			items: 6,
			loop:true,
			autoplay:true,
			navBy: 1,
			dots: false,
			autoplayTimeout: 4000,
			autoplayHoverPause: false,
			smartSpeed: 2000,
			responsive:{
				0:{
					items:1
				},
				550:{
					items:1
				},
				767:{
					items:2
				},
				768:{
					items:3
				},
				991:{
					items:4
				},				
				1000:{
					items:4
				},
				1600:{
					items:5
				}
			}
	});
	
	/*----------------------------------------------------*/
	/*	teams Slick Carousel
	/*----------------------------------------------------*/
	
	$('.teams-carousel .center').slick({
		centerMode: true,
		autoplay: true,
		centerPadding: '0px',
		speed: 800,
		slidesToShow: 5,
		dots: true,
		responsive: [
			{
				breakpoint: 1199,
				settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '0px',
				slidesToShow: 3
				}
			},
			{
				breakpoint: 991,
				settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '0px',
				slidesToShow: 3
				}
			},
			{
				breakpoint: 800,
				settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '0px',
				slidesToShow: 3
				}
			},
			{
				breakpoint: 767,
				settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '0px',
				slidesToShow: 3
				}
			},
			{
				breakpoint: 648,
				settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '0px',
				slidesToShow: 3
				}
			},
			{
				breakpoint: 575,
				settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '0px',
				slidesToShow: 1
				}
			}
		]
	});

	/*----------------------------------------------------*/
	/*	Bottom Quick Form
	/*----------------------------------------------------*/

	$('.bottom-form-header').parent().delay(1000).animate({bottom: '-311px'}, 1000, function(){
		$(this).find('.bottom-form-header').addClass('closed');
	}); 
	
	
	$('.bottom-form-header').on('click', function(){
		if ($(this).hasClass('closed')){
			$(this).next('.bottom-form-holder').css({display:'block'}).parent().animate({bottom: 0}, 1000, function(){
				$(this).find('.bottom-form-header').removeClass('closed');
			});
		} else {
			$(this).parent().animate({bottom: '-311px'}, 1000, function(){
				$(this).find('.bottom-form-header').addClass('closed');
			});
		}
		
		return false;
	});	

	
	if( LANDPICK.animation == 'on' ){
		var landpickAnimation = new WOW({
			boxClass:     'wow',      // default
            animateClass: 'animated',
		});
		landpickAnimation.init();
	}

	var preloader = $('#loader-wrapper'),
	loader = preloader.find('.loading-center');
	loader.fadeOut();
	preloader.delay(1500).fadeOut('slow');

});