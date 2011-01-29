/*
	AOL Photo Gallery Module
	@author David Artz
	@since 1/21/2011
	
	To Do:
	
	* Set the gallery container width the width the user specifies.
	* Autodetect the width of the column, and adjust the image size.
	* Make default thumbnail view with toggle.
	* Portrait galleries: http://www.stylelist.com/2011/01/24/look-of-the-day-emily-blunt/
	* Keep track of dimensions of the gallery as a whole.
	* Create a function that handles inside/outside and before/after based on settings.
	
*/
(function($, location){

var defaultOptions = {
		
	//	customClass: "aol-photo-gallery-portrait",
    //  customClass: "aol-photo-gallery-carousel",
	//	carousel: 1,
		carouselSiblings: 2,
		
		speed: 250,
		
		photoWidth: 450, //"auto",
		photoHeight: 325, //"auto",
		
		thumbnailWidth: 74,
		thumbnailHeight: 74,
		
		thumbnailCount: 999,
		thumbnailAfter: 1,
		
		activeIndex: 1,
		
		refreshAd: 0,
		refreshDivId: "",
		refreshCount: 3,
		
		showThumbnails: 0,
		showName: 1,
		showDescription: 1,
		showControls: 1,
		controlsAfter: 1,
		controlsInside: 1,
		showStatus: 1,
		
		toggleThumbnails: 0,
		toggleThumbnailsAfter: 1,
		
		showCaptions: 1,
		captionsAfter: 1,
	
		ui: {
			slides: "> .photos > li",
			galleryName: "> h2",
			galleryDescription: "> .description",
			anchors: "> .photos > li > a",
			thumbnails: "> .thumbnails"
		},
	
		data: {
			galleryPhotos: []
		},
		
		namespace: "aol-photo-gallery"

	},

	// Internal private variable, used to ensure we 
	// stay between a 1:2 and 1:9 refresh rate.
	refreshMinimum = 2,
	refreshLimit = 9,
	
	// Standard naming convention for deep linked photos.
	deepLinkHashName = "photo";

$.aolPhotoGallery = function( customOptions, elem ){
	// Initialize the gallery.
	if ( elem ) {
		
		var options = $.extend( true, {}, defaultOptions, customOptions ),
		
			$aolPhotoGallery = $(elem),
			$aolPhotoGalleryClone = $aolPhotoGallery.clone(), // Offline copy.
			
			ui = options.ui,
			data = options.data,
			photos = data.galleryPhotos,
			namespace = options.namespace,
			
			// Subtract 1 to convert from user-friendly to an index.
			activeIndex = options.activeIndex - 1, 
			totalPhotos,
			
			speed = options.speed,
			
			photoWidth = options.photoWidth,
			photoHeight = options.photoHeight,
			thumbnailWidth =  options.thumbnailWidth,
			thumbnailHeight = options.thumbnailHeight,
			
			statusRateLimit = 0,
			
			isCarousel = options.carousel,
			// Used to understand how many slides to be sure to load up front.
			carouselSiblings = options.carouselSiblings, 
			carouselPosition,
			
			// Object we use to store if photo has been cached.
			photoCached = {},
			
			$anchors,
			$slides,
			$slideContainer,
			$captions,
			$captionContainer,
			$gallery,
			$status,
			$controls,
			$thumbnailContainer,
			$thumbnails,
			$showThumbnails,
			$sponsor,
			
			core = {
				
				// For a given index and length, return the true index.
				getIndex: function( index, length ){
					length = totalPhotos;
					var trueIndex = index < length ? index : index % length;
					if (trueIndex < 0 ) { 
						trueIndex = length + trueIndex; 
					}
					return trueIndex;
				},
				
				init: function(){
					
					var $galleryName = ui.$galleryName = $aolPhotoGalleryClone.find( ui.galleryName ),
						$galleryDescription = ui.$galleryDescription = $aolPhotoGalleryClone.find( ui.galleryDescription );

					data.galleryName = $galleryName.text();
					data.galleryDescription = $galleryDescription.html();
					
					$anchors = ui.$anchors = $aolPhotoGalleryClone.find( ui.anchors );
					$slides = ui.$slides = $aolPhotoGalleryClone.find( ui.slides );
					$slideContainer = ui.$slideContainer = $slides.parent();
					
					// Just a temporary assurance of fixed width. 
					// Think we will want this to be dynamic at some point.
	//				$aolPhotoGalleryClone.css({
	//					width: photoWidth + "px"
	//				});
					
					if ( isCarousel ) {
							
						$slideContainer.css({
							height: photoHeight + "px"
						});
						
					} else {
						
						$slideContainer.css({
							height: photoHeight + "px",
							width: photoWidth + "px"
						});
						
						$slides.css({
							width: photoWidth + "px",
							height: photoHeight + "px",
							lineHeight: photoHeight + "px"
						});
						
					}
					
					totalPhotos = $anchors.length;
					
					if ( activeIndex >= totalPhotos ) {
						activeIndex = totalPhotos - 1;
					}
					
					$anchors.each(function(i){
						
						var anchorElem = this,
							$anchorElem = $(anchorElem),

							// Save the details of this photo for later.	
							photoName = $anchorElem.text(),
							photoDescription = $anchorElem.attr("title"),
							photoSrc = $anchorElem.attr("data-photo-src");
						
						photos.push({
							photoName: photoName,
							photoDescription: photoDescription,
							photoSrc: photoSrc
						});
						
					});
					
					if ( options.customClass ) {
						$aolPhotoGalleryClone.addClass( options.customClass );
					}
					
					core.buildGallery();
					
					if ( ! options.showName ) {
						$galleryName.hide();
					}
					
					if ( ! options.showDescription ) {
						$galleryDescription.hide();
					}
					
					if ( options.showCaptions ) {
						core.buildCaptions();
					}
					
					core.buildStatus();
					
					if ( options.showControls ) {
						core.buildControls();
					}
					
					if ( options.showThumbnails || options.toggleThumbnails ) {
						core.buildThumbnails();
					}
					
					if ( options.sponsorImage ) {
						core.buildSponsor();
					}
					
					$aolPhotoGallery.replaceWith( $aolPhotoGalleryClone );
				},
				
				preloadPhoto: function( index ){
					
					var photo = photos[ index ],
						photoSrc = photo.photoSrc,
						dynamicPhotoSrc = $.getDynamicImageSrc( photoSrc, photoWidth, photoHeight ),
						$slide = $slides.eq( index ),
						image;
					
					if ( ! $slide.data("image-loaded." + namespace) ) {

						// Preload this image and be sure its siblings are loaded.
						if ( isCarousel ) {
							
							// Images are tricky because we need to know the width
							// to pull off a carousel.  We must first download the 
							// image, figure out the width, and set its parent.
							image = new Image();
							image.src = dynamicPhotoSrc;
							image.onload = function(){
								
								// Once an image loads, be sure to do this 
								// after all animations have finished.
								$slideContainer.queue(function(next){
									var slideContainerWidth = $slideContainer.width();
	
									$slide.css({
										backgroundImage: "url(" + dynamicPhotoSrc + ")",
										width: image.width + "px",
					//					height: image.height + "px", // We want images to center, so we keep this full height.
										height: photoHeight + "px",
										visibility: "visible"
									});
									
									// Update the slide container's width.
									$slideContainer.width( slideContainerWidth + $slide.outerWidth() );
	
									// Update the position of the active index if needed.
									core.updateCarouselPosition();
									next();
								});
								
							};


							
						} else {
							// Set up background images on slides. This is nice because we don't have to 
							// mess with <img>, which downloads automatically where as CSS will only
							// download when visible.
							$slide.css("backgroundImage", "url(" + dynamicPhotoSrc + ")");
	
						}
						
						$slide.data("image-loaded." + namespace, 1);
					}
					
				},
				
				preloadCarouselPhotos: function( index ) {
					
					var currentIndex = index - carouselSiblings,
						lastIndex = index + carouselSiblings;
						
					// For the active index and its siblings, we'll need
					// to load the image as well.
					while ( currentIndex <= lastIndex ) {
						core.preloadPhoto( getIndex( currentIndex ) );
						currentIndex++;
					} 
				},
				
				updateCarousel: function( oldIndex ){

					var	$nodeBack,
						$nodeNext;
					
					// Before we do anything, we should animate to ensure it's smooth.
					core.updateCarouselPosition( oldIndex );
					
					// Next we should start fetching any new photos.
					core.preloadCarouselPhotos( activeIndex );
					
					// After all animations are done, and before
					// any others start, we do this.
					$slideContainer.queue(function( next ){

						// Based on the position of the active index, ensure 
						// siblings exist in the DOM to the left and to 
						// the right of the active.
						$nodeBack = $nodeNext = $slides.eq( activeIndex );
						for ( var i = 0; i < carouselSiblings; i++ ) {
							
							$nodeBack = $nodeBack.prev();
							$nodeNext = $nodeNext.next();
							
							// If we don't have the previous one, we need to grab
							// the last node and put it in the beginning.
							if ( ! $nodeBack.length ) {
								$slideContainer.prepend( $slides.eq( getIndex( activeIndex - i - 1 ) ) );
							}
							// If we don't have the next one, we need to grab
							// the first node and put it at the end.
							if ( ! $nodeNext.length ) {
								$slideContainer.append( $slides.eq( getIndex( activeIndex + i + 1 ) ) );
							}
						}
						core.updateCarouselPosition();
						next();
					});
					
				},
				
				// Think about moving this back into preloadImage.
				updateCarouselPosition: function( oldIndex ){

						// Look into caching some of these widths.
					var $slide = $slides.eq( activeIndex ),
						galleryWidth = $gallery.width(),
						activePosition = ( galleryWidth - $slide.width() )/2 - $slide.position().left,
						$oldSlide,
						oldPosition;
					
					// If we are passed an old index, we want to first set the position 
					// to the old one, and animate to the new one.
					if ( oldIndex >= 0 ) {

						$oldSlide = $slides.eq( oldIndex );
						oldPosition = ( galleryWidth - $oldSlide.width() )/2 - $oldSlide.position().left;
						$slideContainer.queue(function( next ){ $slideContainer.css( "left", oldPosition + "px" ); next(); });
						$slideContainer.animate({ "left": activePosition + "px" }, speed );
					
					} else {
					
						if ( activePosition !== carouselPosition ) {
							$slideContainer.css( "left", activePosition + "px" );
							carouselPosition = activePosition;
						}
					}

															
				},

				buildGallery: function(){
					
					// Remove the anchor links, we no longer need them.
					// On second thought, leave them in for screen readers.
					// $anchors.remove();
					
					// Wrap the photos for design hooks.
					$slideContainer.wrap( "<div class=\"gallery\"></div>" );
					
					$gallery = ui.$gallery = $slideContainer.parent();
					
					if ( isCarousel ) {
					
						setTimeout(function(){
							core.updateCarousel();
						}, 0);

					// Preload the active index.					
					} else {
						
						$slides.css({
							opacity: 0
						});
						
						// Set up the active photo.
						$slides.eq( activeIndex ).css({
							zIndex: 1,
							opacity: 1,
							visibility: "visible"
						});
						
						core.preloadPhoto( activeIndex );
					}
					
					// In the carousel, the gallery height is fixed.
					if ( options.carousel ) {
						$gallery.height( photoHeight );
					}
									
					// If we need to show thumbnails by default and 
					// hide the gallery, do so now. 
					// Note: We hide from the DOM so the Thumbnails
					// look casual.
					if ( options.showThumbnails && options.toggleThumbnails ) {
						setTimeout(function(){
							$slideContainer.css({
								position: "absolute",
								left: -$gallery.width()
							});
						}, 0);
					}
					
					core.bindGallery();
					
				},
				
				bindGallery: function(){
					
					$aolPhotoGalleryClone.delegate(".photos > li", "click." + namespace, function(){
						$(this).trigger("next-click." + namespace);
					});
					
					$aolPhotoGalleryClone.delegate(".photos > li", "mouseover." + namespace, function(){
						$(this).trigger("next-mouseover." + namespace);
					});
	
					// Listen for thumbnail mouseovers and morph the image if needed.
					$aolPhotoGalleryClone.bind("thumbnail-mouseover." + namespace, function( event, data ){
						var index = data.index;
						core.preloadPhoto( index );
					});

					$aolPhotoGalleryClone.bind("back-mouseover." + namespace, function( event, data ){
						var backIndex = activeIndex === 0 ? totalPhotos - 1 : activeIndex - 1;
						if ( isCarousel ) {
							core.preloadCarouselPhotos( backIndex);
						} else {
							core.preloadPhoto( backIndex );
						}
					});
					
					$aolPhotoGalleryClone.bind("next-mouseover." + namespace, function( event, data ){
						var nextIndex = activeIndex === totalPhotos - 1 ? 0 : activeIndex + 1;
						if ( isCarousel ) {
							core.preloadCarouselPhotos( nextIndex );
						} else {
							core.preloadPhoto( nextIndex );
						}
					});
					
					$aolPhotoGalleryClone.bind("status-update." + namespace, function(event, data){

						var oldIndex = data.oldIndex,
							activeIndex = data.activeIndex,

							$oldSlide = $slides.eq( oldIndex ),
							$activeSlide = $slides.eq( activeIndex ),
							
							backIndex = activeIndex === 0 ? totalPhotos - 1 : activeIndex - 1,
							nextIndex = activeIndex === totalPhotos - 1 ? 0 : activeIndex + 1;			

						if ( isCarousel ) {
							
							// Handle carousel transition.
							core.updateCarousel( oldIndex );
							
						} else {
							// Handle fade transition.
							$oldSlide.css({
								zIndex: 0 
							}).animate({
								opacity: 0
							}, speed);
							
							$activeSlide.css({ 
								visibility: "visible",
								zIndex: 1 
							}).animate({
								opacity: 1
							}, speed);	
							
													
							// Preload the previous image if needed.	
							core.preloadPhoto( backIndex );
							
							// Preload the next image if needed.
							core.preloadPhoto( nextIndex );

						}

					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							$slideContainer
								.css("position", "relative")
								.animate({
									"left": -$gallery.width()
								}, speed);
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(event, data){
							
							$slideContainer
								.css({
									"position": "relative" // Artz: Why do we need this? (re: visibility: visible)
								}) 
								.animate({
									"left": 0
								}, speed);

							// Prempt the fade in by setting our opacity 
							// to full, for the slide in effect.
							$slides.eq( activeIndex ).css({
								opacity: 0
							});
							$slides.eq( data.index ).css({
								opacity: 1
							});
							
						});	
					}
					
				},
				
				buildCaptions: function(){
					
					var i = 0, 
						l = ui.$anchors.length,
						captionHTML = ["<ul class=\"captions\">"],
						photo;
								
					// Build thumbnail HTML.
					for (; i < l; i++) {
						photo = photos[i];
						captionHTML.push("<li data-index=\"" + i + "\"><h3>" + photo.photoName + "</h3>" + photo.photoDescription + "</li>");
					}
					
					captionHTML.push("</ul>");
					
					$captions = $( captionHTML.join("") );
					
					// Append captions.
					if ( options.captionsAfter ) {
						$gallery.after( $captions );
					} else {
						$gallery.prepend( $captions );
					}
					
					$captions = ui.$captions = $captions.find("li");
					
					$captions.eq( activeIndex ).css({
						zIndex: 1,
						visibility: "visible"
					});
	
					$captionContainer = ui.$captionContainer = $captions.parent();
									
					// Need to make this tweak in the next UI thread.
					setTimeout(function(){
						$captionContainer.height( $captions.eq( activeIndex ).height() )
                            .width( $captionContainer.width() );
                        
					}, 0);
					
					core.bindCaptions();
					
					// If we need to show thumbnails by default and 
					// hide the captions, do so now.
					if ( options.showThumbnails && options.toggleThumbnails ) {
//						$captions.parent().css("visibility", "hidden");
						$captionContainer.hide();
					}
				},
				
				bindCaptions: function(){
					$aolPhotoGalleryClone.bind("status-update." + namespace, function(event, data){
						
						var oldIndex = data.oldIndex,
							activeIndex = data.activeIndex,
														
							$oldCaption = $captions.eq( oldIndex ),
							$activeCaption = $captions.eq( activeIndex );

						$activeCaption.css({
							visibility: "visible",
							opacity: 0,
							zIndex: 1
						}).animate({
							opacity: 1
						}, speed);	

						$oldCaption.css({
							zIndex: 0
						}).animate({
							opacity: 0
						}, speed); // Fade out didn't work when its parent container was not displayed.
						
						$captionContainer.animate({
							height: $activeCaption.height()
						}, speed);

					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							$captionContainer.css("opacity", 0);
						});
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){
							$captions.eq( activeIndex ).css("opacity", 0);
							$captionContainer.css({
								"display": "block",
								"visibility": "visible",
								"opacity": 1
							});
						});
					}
					
				},
				
				buildStatus: function(){
					
					var statusHTML = "<div class=\"status\">" + ( activeIndex + 1 ) + " of " + totalPhotos + "</div>";
						
					$status = ui.$status = $( statusHTML );
					
					$gallery.after( $status );
					
					// We still need Status to live in the DOM.
					if ( ! options.showStatus ) {
						
						$status.hide();
										
					// If we need to show thumbnails by default and 
					// hide the captions, do so now.
					} else if ( options.showThumbnails && options.toggleThumbnails ) {
						// $status.css("visibility", "hidden");
						$status.hide();
					}
					
					core.bindStatus();
				},
				
				bindStatus: function(){
									
					$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function( event, data ){
						
						var oldIndex = activeIndex;
						
						activeIndex = data.index;
						
						if ( oldIndex !== activeIndex ) {
							$status.html( ( activeIndex + 1 ) + " of " + totalPhotos )
								.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);
						}
					});
					
					$aolPhotoGalleryClone.bind("back-click." + namespace, function( event, data ){
						if ( ! statusRateLimit ) {
							statusRateLimit = 1;
							var oldIndex = activeIndex;
								
							activeIndex = activeIndex === 0 ? totalPhotos - 1 : activeIndex - 1;
							
							$status.html( ( activeIndex + 1 ) + " of " + totalPhotos )
								.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);
						
							setTimeout(function(){
								statusRateLimit = 0;
							}, speed );
						}
					});
					
					$aolPhotoGalleryClone.bind("next-click." + namespace, function(){
						if ( ! statusRateLimit ) {
							statusRateLimit = 1;
								
							var oldIndex = activeIndex;
								
							activeIndex = activeIndex === totalPhotos - 1 ? 0 : activeIndex + 1;
							
							$status.html( ( activeIndex + 1 ) + " of " + totalPhotos )
								.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);
						
							setTimeout(function(){
								statusRateLimit = 0;
							}, speed );
						}	
					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							$status.css("visibility", "hidden");
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){
							$status.css({
								"display": "block",
								"visibility": "visible"
							});
						});
						
					}
					
				},
				
				buildControls: function(){
					
					$controls = ui.$controls = $("<ul class=\"controls\"><li class=\"back\"><b>Back</b></li><li class=\"next\"><b>Next</b></li></ul>");
					
					if ( options.controlsInside ) {
						if ( options.controlsAfter ) {
							$gallery.append( $controls );
						} else {
							$gallery.prepend( $controls );
						}	
					} else {
						if ( options.controlsAfter ) {
							$gallery.after( $controls );
						} else {
							$gallery.before( $controls );
						}	
					}
					
					core.bindControls();
					
					// If we need to show thumbnails by default and 
					// hide the captions, do so now.
					if ( options.showThumbnails && options.toggleThumbnails ) {
						$controls.hide();
					}

				},
				
				bindControls: function(){
					
					$aolPhotoGalleryClone.delegate(".controls > .back", "click." + namespace, function(){
						$(this).trigger("back-click." + namespace);
					});
					$aolPhotoGalleryClone.delegate(".controls > .next", "click." + namespace, function(){
						$(this).trigger("next-click." + namespace);
					});
					$aolPhotoGalleryClone.delegate(".controls > .back", "mouseover." + namespace, function(){
						$(this).trigger("back-mouseover." + namespace);
					});
					$aolPhotoGalleryClone.delegate(".controls > .next", "mouseover." + namespace, function(){
						$(this).trigger("next-mouseover." + namespace);
					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							$controls.css("visibility", "hidden");
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){
							$controls.css({
								"display": "block",
								"visibility": "visible"
							});
						});
					}
					
				},
				
				buildThumbnails: function(){
					
					var i = 0, 
						l = ui.$anchors.length, 
						thumbnailCount = options.thumbnailCount, 
						thumbnailHTML = ["<ul class=\"thumbnails\">"],
						thumbnailsLoaded = 0;
						
					// Build thumbnail HTML.					
					if ( options.showThumbnails ) {

						for (; i < l; i++) {
							thumbnailHTML.push("<li style=\"background: url(" + $.getDynamicImageSrc( photos[i].photoSrc, thumbnailWidth, thumbnailHeight, 1 ) + ") no-repeat center center; width: " + thumbnailWidth + "px; height: " + thumbnailHeight + "px; display: " + ( ( i >= thumbnailCount) ? "none" : "block" )  + "; opacity: .7;\" data-index=\"" + i + "\"></li>");
						}
						thumbnailsLoaded = 1;

					} else {

						for (; i < l; i++) {
                            // Nate: Added filter style for opacity in IE6/7
							thumbnailHTML.push("<li data-src=\"" + $.getDynamicImageSrc( photos[i].photoSrc, thumbnailWidth, thumbnailHeight, 1 ) + "\" style=\"width: " + thumbnailWidth + "px; height: " + thumbnailHeight + "px; display: " + ( ( i >= thumbnailCount) ? "none" : "block" )  + "; opacity: .7; filter: alpha(opacity = 70);\" data-index=\"" + i + "\"></li>");
						}

					}
				
					thumbnailHTML.push("</ul>");
					
					$thumbnailContainer = $( thumbnailHTML.join("") );
					
					$thumbnailContainer.data("thumbnails-loaded", thumbnailsLoaded);
					
					// Append thumbnails.
					if ( options.thumbnailAfter ) {
						$aolPhotoGalleryClone.append( $thumbnailContainer );
					} else {
						$gallery.prepend( $thumbnailContainer );
					}
					
					$thumbnails = ui.$thumbnails = $thumbnailContainer.find("li");
					
					// Set the active thumbnail's opacity to full.
					$thumbnails.eq( activeIndex ).css({
						"opacity": 1
					});
					
					core.bindThumbnails();
					
					if ( options.toggleThumbnails ) {
						
						// If we have a toggle, we dynamically 
						// manage the height and positioning.
						// Set this once our module has layout.				
						setTimeout(function(){
							
							// We need to calculate the original height for the thumbnail view.
							var moduleHeight = $aolPhotoGalleryClone.height(),
								galleryHeight = $gallery.height(),
								thumbnailHeight = $thumbnailContainer.height(),
								maxHeight = Math.max( moduleHeight - thumbnailHeight, moduleHeight - galleryHeight );
						
						//	var padding = parseInt( $thumbnailContainer.css("paddingTop"), 10 ) + parseInt( $thumbnailContainer.css("paddingBottom"), 10 );
							
							// Thumbnails are visible by default, so set 
							// them up to be visible.
							if ( options.showThumbnails ) {
								
								// Remember the initial height when the thumbnails were static for our toggle later.
								$aolPhotoGalleryClone.data( "thumbnail-view-height." + namespace, maxHeight );
								
								$thumbnailContainer.css({
									// Use the module width for now.
									width: $aolPhotoGalleryClone.width(),
									left: 0,
									top: $thumbnailContainer.position().top,
									height: thumbnailHeight
								});
							
							// Position the thumbnails off screen.	
							} else {
								
								// If thumbs are dynamic, the height should be equal to either the gallery height,
								// or the module - gallery or module - thumbnail height, whichever is bigger.
								$aolPhotoGalleryClone.data( "thumbnail-view-height." + namespace, maxHeight );
							
								$thumbnailContainer.css({
									position: "absolute",
									left: $gallery.width(),
									top: $slideContainer.position().top,
									width: $gallery.width(),
									// width: $slideContainer.width(),
									height: thumbnailHeight
								});
								
							}
						}, 0);
					
					
						core.buildShowThumbnails();
					}
					
				},
				
				bindThumbnails: function(){
					
					$aolPhotoGalleryClone.delegate(".thumbnails > li", "mouseover." + namespace, function(){
						
						var thumbnail = this,
							$thumbnail = $(thumbnail),
							thumbnailIndex = +$thumbnail.attr("data-index");  // The + converts the string to a number.

						$thumbnail.trigger("thumbnail-mouseover." + namespace, [{ index: thumbnailIndex }]);
						
						if ( thumbnailIndex !== activeIndex ) {
							$thumbnail.stop().fadeTo(speed, 1); 
						}
						
					});
					
					$aolPhotoGalleryClone.delegate(".thumbnails > li", "mouseout." + namespace, function(){
						
						var thumbnail = this,
							$thumbnail = $(thumbnail),
							thumbnailIndex = +$thumbnail.attr("data-index");  // The + converts the string to a number.
						
						$thumbnail.trigger("thumbnail-mouseout." + namespace, [{ index: thumbnailIndex }]);
						
						if ( thumbnailIndex !== activeIndex ) {
							$thumbnail.stop().fadeTo(speed, 0.7);
						}
					
					});
					
					// Bind event trigger.
					$aolPhotoGalleryClone.delegate(".thumbnails > li", "click." + namespace, function(){
						
						var thumbnail = this,
							$thumbnail = $(thumbnail),
							thumbnailIndex = +$thumbnail.attr("data-index");  // The + converts the string to a number.
						
						$thumbnail.trigger("thumbnail-click." + namespace, [{ index: thumbnailIndex }]);
						
					});
					
					$aolPhotoGalleryClone.bind("status-update." + namespace, function(event, data){
						
						var oldIndex = data.oldIndex,
							activeIndex = data.activeIndex;

						$thumbnails.eq( oldIndex ).removeClass("active")
							.fadeTo( speed, 0.7 );
							
						$thumbnails.eq( activeIndex ).addClass("active")
							.fadeTo( speed, 1 );

					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							
							// Bunch of junky height nonsense.
							var currentHeight = $aolPhotoGalleryClone.height(),
								originalHeight = $aolPhotoGalleryClone.data( "thumbnail-view-height." + namespace );
							
							if ( currentHeight > originalHeight ) {
								$aolPhotoGalleryClone.data( "thumbnail-view-height." + namespace, currentHeight );
								originalHeight = currentHeight;
							}
							$aolPhotoGalleryClone.height( originalHeight );
							
							// We want to ensure we preloaded all the photos once 
							// this toggle is clicked.
							if ( ! $thumbnailContainer.data("thumbnails-loaded") ) {
								$thumbnails.css("backgroundImage", function(i, value){
									return "url(" + $thumbnails.eq(i).attr("data-src") + ")";
								});
								$thumbnailContainer.data("thumbnails-loaded", 1);
							}
							
							// Position the thumbnail container at top of the gallery.
							$thumbnailContainer.css({
								"top": $gallery.position().top,
								"left": $gallery.width()
							});

							// Animate it to the left.
							$thumbnailContainer.animate({
								"left": 0 - parseInt( $thumbnailContainer.css("marginLeft"), 10 )
							}, speed);
							
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){
							
							$thumbnailContainer.css({
								"position": "absolute"
							}).animate({
								"left": $gallery.width()
							}, speed).queue(function( next ){
								$aolPhotoGalleryClone.height( "auto" );
								next();
							});
							
						});
					}
				},

				buildShowThumbnails: function(){
					
					var showThumbnailsHTML = "<div class=\"show-thumbnails\"><b>Show Thumbnails</b></div>";
					
					$showThumbnails = ui.$showThumbnails = $( showThumbnailsHTML );
					
					if ( options.showThumbnails ) {
						$showThumbnails.css("visibility", "hidden");
					} else {
						$showThumbnails.css("visibility", "visible");
					}
					
					if ( options.toggleThumbnailsAfter ) {
						$gallery.after( $showThumbnails );
					} else {
						$gallery.before( $showThumbnails );	
					}
					
					core.bindShowThumbnails();
				},
				
				bindShowThumbnails: function(){
					
					$aolPhotoGalleryClone.delegate( ".show-thumbnails", "click." + namespace, function(){
						$aolPhotoGalleryClone.trigger( "show-thumbnails." + namespace );
					});			
					
					$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
						ui.$showThumbnails.css("visibility", "hidden");
					});
					
					$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){
						ui.$showThumbnails.css("visibility", "visible");
					});
					
				},
				
				buildSponsor: function(){
					
					var sponsorHTML = ["<a class=\"sponsor\" style=\"background: url(",
							options.sponsorImage,
							") no-repeat center center\" href=\"",
							options.sponsorUrl,
							"\">",
							options.sponsorName,
							"</a>"].join("");
						
					$sponsor = ui.$sponsor = $( sponsorHTML );
					
					$aolPhotoGalleryClone.prepend( $sponsor );
					
				}
				
			},
			
			// Localize core functions for performance.
			getIndex = core.getIndex,
			
			initRefreshAd = function(){
				
				var // adMagicNumbers = options.refreshAd.split(),
					refreshDivId = options.refreshDivId,
					refreshStatus = 0,
					refreshCount = options.refreshCount;
				
				// If they set something greater than our limit, reset it.
				if ( refreshCount > refreshLimit ) {
					refreshCount = refreshLimit;
				}
				
				// If they set something less than our limit, reset it.
				if ( refreshCount < refreshMinimum ) {
					refreshCount = refreshMinimum;
				}
				
				if ( refreshDivId ) {
					// Listen for status updates to count photo clicks.
					$aolPhotoGalleryClone.bind("status-update." + namespace, function(){
					// Code for refreshing ads here.

						// Increment our status counter.
						refreshStatus++;

						// If we are at the limit, time to refresh and reset.
						if ( refreshStatus === refreshCount ) {
							
							if ( window.adsReloadAd ) {
								adsReloadAd( refreshDivId )
								refreshStatus = 0;
							}
							// Artz: Consider throwing an error here.
						}
						
					});
				}
				
			}, 
			
			initDeepLinking = function(){
				
				var pattern = new RegExp( "\#" + deepLinkHashName + "-[0-9]+" ),
					matches = pattern.exec( location.href );
				
				$aolPhotoGalleryClone.bind("status-update." + namespace, function(event, data){
					
					var activePhoto = data.activeIndex + 1,
						href = location.href,
						deepLinkHash = "#" + deepLinkHashName + "-" + activePhoto;
					
					if ( pattern.test( href ) ) {
						location.href = href.replace( pattern, deepLinkHash );
					} else {
						location.href = href + deepLinkHash;
					}
					
				});
				
				// Override the default active index with 
				// the one found in the hash.
				if ( matches ) {
					activeIndex = matches[0].replace( "#" + deepLinkHashName + "-", "" ) - 1;
				}
				
			},
			
			init = function(){

				if ( options.refreshDivId ) {
					initRefreshAd( options );
				}

				initDeepLinking();
			};
		
		
		// Initialize private functions.
		init();
		
		// Initialize public functions.
		core.init();
		
	// Otherwise, extend the default options.	
	} else {
		$.extend( true, defaultOptions, customOptions );
	}
	
};

$.fn.aolPhotoGallery = function( customOptions ){

	return this.each(function(){
		$.aolPhotoGallery( customOptions, this );
	});
	
}
	
})(jQuery, location);

(function($){
	
	$.mmTrack = function( customOptions ) {
		
	}
	
})(jQuery);

(function($){
	
$.getDynamicImageSrc = function( photoSrc, photoWidth, photoHeight, thumbnail, settings ) {
	
	var options,
		dimensions,
		action,
		modifiers;
	
	if ( typeof thumbnail === "object" ) {
		settings = thumbnail;
	}
		
	$.extend( options = {}, {
		action : 'resize',
		format : null,
		quality : 60
	}, settings);
		
	dimensions = photoWidth + "x" + photoHeight;
	action = (thumbnail && typeof thumbnail !== "object") ? "thumbnail" : options.action;
	modifiers = "/quality/" + options.quality;

	if (options.crop) {
		dimensions += "+" + (options.crop.x || 0) + "+" + (options.crop.y || 0);
	}
	
	if (options.format) {
		modifiers += "/format/" + options.format;
	}
		
	return "http://o.aolcdn.com/dims-global/dims3/GLOB/" + action + "/" + dimensions + modifiers + "/" + photoSrc;
};

})(jQuery);
