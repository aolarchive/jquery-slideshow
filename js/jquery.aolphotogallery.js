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
	* Convert to mousedowns for next/back/thumbnail clicks, feels faster.
	* LINE 889: Remove thumbnail opacity effect from the core code, make it optional.
	* Convert my div buttons to anchor links, a bit more trackable, accessible, etc., unless we dare try buttons.
	* For ad refresh to work, be sure adPage is set up properly (reference aol-advertising module).
	* To account for issues with status-reset, we may need to maintain an "oldIndex" global internally, similar to "activeIndex". 
	* Think we got this for the most part, but we should trace all relevant spots and use getIndex() function once.
	* <script type="text/javascript">

GET SPONSORSHIP IN.

<!--
 adSetType('F');
 htmlAdWH('93302143','215','35');
 adSetType('');  
//-->
</script>
</div><!-- 215x35 ad --> 
	 
	
*/
(function($, window, document, location){

var defaultOptions = {
		
	//	customClass: "aol-photo-gallery-portrait",
	
		// This allows developers to add addtional 
		// class names to the container <div>, useful
		// for making override styles.
		theme: "default",

		// This can be set to any of the presetOptions
		// to quickly set some common configurations.
		// This will also add a class with the below preset.
		preset: "",
		presetOptions: {
			
			"carousel": { // aol-photo-gallery-carousel
				carousel: 1,
				controlsInside: 1,
				toggleThumbnails: 0, // These don't work just yet.	
				creditInside: "$slides"		
			},
			
			"portrait": { // aol-photo-gallery-portrait
				captionsAfter: 0,
				photoWidth: 325,
				showFullscreen: 0,
				toggleThumbnails: 0
			},
			
			"launch": { // aol-photo-gallery-launch
				showControls: 0,
				showDescription: 1,
				descriptionAfter: 1,
				template: {
					fullscreen: "Launch Gallery"
				},
				toggleThumbnails: 0
			}
		},

		// Turns the gallery into a carousel module
		// where there are slides on both sides.
		carousel: 0,
		
		// How many slides are visible on each side,
		// needed for prefetch logic and understanding
		// when to pop the last slide to the front,
		// and vice versa.
		carouselSiblings: 2,
		
		// How long all transition animations take.
		speed: 300,
		
		// The max width and the height of the photos
		// inside of the gallery. We dynamically 
		// resize to these. Future: Auto flags depending
		// on the screen real estate!
		photoWidth: 450, //"auto",
		photoHeight: 325, //"auto",
		
		// The max width and height of generated thumbs.
		thumbnailWidth: 74,
		thumbnailHeight: 74,
		
		// Default options for full screen.
		fullscreenOptions: {
			photoWidth: 559,
			photoHeight: 487,
			preset: "carousel"
		},

//		Is there a house 300x250 we can display?	
//		fullscreenAdMN: "773630",
		fullscreenAdWidth: 300,
		fullscreenAdHeight: 250,
		
		// How many thumbs to display, we don't quite
		// do anything with this yet, may be useful
		// later for showing an initial thumb set, 
		// or controlling how many per thumbnail pane.
		thumbnailCount: 999,
		
		// Inserts thumnbails immediately after
		// the gallery <div>. Falsy inserts before.
		thumbnailAfter: 1,
		
		// The active photo on initialization.
		activeIndex: 1,
		
		// If supplied, make a sponsorship advertisement.
//		sponsorAdMN: "93302143",
		sponsorAdWidth: 215,
		sponsorAdHeight: 35,
		
		// The <div> containing the AJAX ad to refresh.
		// This is tied to the gallery slides.
		refreshDivId: "",
		
		// The refresh ratio, i.e. 3 means refresh the
		// ad every 1 in 3 clicks.
		refreshCount: 9,
		
		// This controls whether we show the thumbnails
		// by default instead of the gallery view.
		showThumbnails: 0,
		
		// Enables the thumbnails toggle functionality,
		// note, builds the "Show Thumbnails" button.
		toggleThumbnails: 1,
		
		// Inserts the "Show Thumbnails" button before 
		// the gallery in the DOM if truthy, after
		// if falsy.
		toggleThumbnailsAfter: 1,	
		
		// Toggle to show the name of the gallery.
		showName: 1,
		
		// Toggle to show the description of the gallery.
		showDescription: 0,
		
		// In some cases we may want the description after.
		descriptionAfter: 0,
		
		// Toggle to show the Next/Back buttons.
		showControls: 1,
		
		// Inserts the controls inisde the gallery <div>,
		// falsy inserts outside.
		controlsInside: 0,
		
		// If above flag is set to inside, this inserts
		// the controls before (prepends) the photos list in the 
		// gallery <div>, falsy sets them after (appends).
		// If above flag is outside, this inserts the controls 
		// after the gallery <div>, falsy inserts before.
		controlsAfter: 1,
		
		// Show the full screen button and build the 
		// Full screen experience.
		showFullscreen: 1,
				
		// Shows the status indicator.
		showStatus: 1,
		
		// Shows the captions for the photos. By default this
		// is a standard fade-in/out.
		showCaptions: 1,
		
		// Inserts the controls inisde the gallery <div>,
		// falsy inserts outside.
		captionsAfter: 1,
		
		// Shows the credit box.
		showCredit: 1,
		
		// Shows the credits inside this UI element.
		creditInside: "$captions",
		
		// Initializes Comscore, Data Layer and Omniture tracking.
		// Note: This should be handled automatically in the future.
		initTracking: 1,
		
		// Prepends if falsy or appends if truthy to 
		// the "creditInside" container.
		creditAfter: 0,
		
		// Templates that developers can override.
		template: {
			status: "{{active}} of {{total}}",
			credit: "Photo: {{credit}}",
			fullscreen: "Fullscreen",
			thumbnails: "Thumbnails",
			next: "Next",
			back: "Back"
		},
		
		// Overrides for DOM elements, generally 
		// developers shouldn't touch these.
		ui: {
			slides: "> .photos > li",
			galleryName: "> h2",
			galleryDescription: "> .description",
			anchors: "> .photos > li > a",
			thumbnails: "> .thumbnails"
		},
		
		// Container to store data our widget
		// can expose to others.
		data: {
			galleryPhotos: []
		},
		
		// Namespace of the widget for event
		// bubbling.
		namespace: "aol-photo-gallery"

	},

	// Internal private variable, used to ensure we 
	// stay between a 1:2 and 1:9 refresh rate.
	refreshMinimum = 2,
	refreshLimit = 9,
	
	// We use this for naming our advertisement <div>
	adDivId = 0,
	adDivName = defaultOptions.namespace + "-ad",
	
	// The standard tracking area for what constitutes a page view.
	trackingArea = 1024 * 768,
	trackingRatio = 0.5,
	
	// Standard naming convention for deep linked photos.
	deepLinkHashName = "photo";

$.aolPhotoGallery = function( customOptions, elem ){
	// Initialize the gallery.
	if ( elem ) {
		
		var $aolPhotoGallery = $(elem),
			$aolPhotoGalleryClone = $aolPhotoGallery.clone(), // Offline copy.
			
			// Options that are passable on the 
			// element as data attributes.
			dataOptions = {
				fullscreenAdMN: $aolPhotoGallery.data("fullscreen-mn"),
				sponsorAdMN: $aolPhotoGallery.data("sponsor-mn")
			},
			
			presetOptions = $.extend( true, {}, defaultOptions.presetOptions, customOptions.presetOptions )[ customOptions.preset ] || {},

 			options = $.extend( true, {}, defaultOptions, presetOptions, customOptions, dataOptions ),
 
			documentElem = document.documentElement,
			body = document.body,
			
			ui = options.ui,
			data = options.data,
			photos = data.galleryPhotos,
			namespace = options.namespace,
			
			// Subtract 1 to convert from user-friendly to an index.
			activeIndex = options.activeIndex - 1, 
			totalPhotos,
			
			speed = options.speed,
			template = options.template,
			
			photoWidth = options.photoWidth,
			photoHeight = options.photoHeight,
			thumbnailWidth =  options.thumbnailWidth,
			thumbnailHeight = options.thumbnailHeight,
			
			statusRateLimit = 0,
			
			isCarousel = options.carousel,
			// Used to understand how many slides to be sure to load up front.
			carouselSiblings = options.carouselSiblings, 
			
			// Object we use to store if photo has been cached.
			photoCached = {},
			
			$anchors,
			$slides,
			$slideContainer,
			$captions,
			$captionContainer,
			$gallery,
			$credit,
			$fullscreen,
			$fullscreenButton,
			$status,
			$controls,
			$thumbnailContainer,
			$thumbnails,
			$showThumbnails,
			$sponsor,
			
			core = {
				
				// For a given index and length, return the true index.
				getIndex: function( index, length ){
					
					// We're going to assume this for this widget.
					length = totalPhotos;
					
					var trueIndex = index < length ? index : index % length;
					if (trueIndex < 0 ) { 
						trueIndex = length + trueIndex;
					}
					
					return trueIndex;
				},
				
				init: function(){
					
					// Expose options for this instance externally.
					$aolPhotoGalleryClone.data( "options", options );
					
					var $galleryName = ui.$galleryName = $aolPhotoGalleryClone.find( ui.galleryName ),
						$galleryDescription = ui.$galleryDescription = $aolPhotoGalleryClone.find( ui.galleryDescription );
					
					$galleryName.click(function(event){
						event.preventDefault();
					});
					
					data.galleryName = $galleryName.text();
					data.galleryDescription = $galleryDescription.html();
					
					if ( options.descriptionAfter ) {
						$aolPhotoGalleryClone.append( $galleryDescription );
					}
					
					$anchors = ui.$anchors = $aolPhotoGalleryClone.find( ui.anchors );
					$slides = ui.$slides = $aolPhotoGalleryClone.find( ui.slides );
					$slideContainer = ui.$slideContainer = $slides.parent();
					
					// Just a temporary assurance of fixed width. 
					// Think we will want this to be dynamic at some point.
	//				$aolPhotoGalleryClone.css({
	//					width: photoWidth + "px"
	//				});
					
					totalPhotos = $anchors.length;
					
					// If we have photos, continue.
					if ( totalPhotos ) {
					
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
								height: photoHeight + "px"
	//							lineHeight: photoHeight + "px" // Artz: Don't think this is needed.
							});
							
						}
						
						if ( activeIndex >= totalPhotos ) {
							activeIndex = totalPhotos - 1;
						}
						
						$anchors.each(function(i){
							
							var anchorElem = this,
								$anchorElem = $(anchorElem),
	
								// Save the details of this photo for later.	
								photoName = $anchorElem.text(),
								photoDescription = $anchorElem.attr("title"),
								photoSrc = $anchorElem.data("photo-src"),
								photoCredit = $anchorElem.data("credit");
							
							photos.push({
								photoName: photoName,
								photoDescription: photoDescription,
								photoSrc: photoSrc,
								photoCredit: photoCredit
							});
							
							// Assign an index to this anchor's parent element.
							$anchorElem.parent().data("index", i);
							
						});
						
						if ( options.preset ) {
							$aolPhotoGalleryClone.addClass( namespace + "-" + options.preset );
						}
						
						if ( options.theme ) {
							$aolPhotoGalleryClone.addClass( namespace + "-" + options.theme );
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
						
						if ( options.showCredit ) {
							core.buildCredits();
						}
						
						if ( options.showFullscreen ) {
							core.buildFullscreen();
						}
						
						if ( options.ui.$parentGallery ) {
							core.bindFullscreenParent();
						}
						
						
						if ( options.showThumbnails || options.toggleThumbnails ) {
							core.buildThumbnails();
						}
						
						if ( options.sponsorAdMN ) {
							core.buildSponsorAd();
						}

						$aolPhotoGallery.replaceWith( $aolPhotoGalleryClone );
					}
				},
				
				buildCredits: function(){
					// Credits just hang out in one of the other UI containers.
					var creditTemplate = template.credit,
						$creditParent = ui[ options.creditInside ],
						photoCredit;
					
					if ( options.creditAfter ) {
						$creditParent.each(function(i){
							photoCredit = photos[i].photoCredit;
							if ( photoCredit ) {
								$creditParent.eq(i).append("<div class=\"credit\"><i>" + creditTemplate.replace("{{credit}}", photoCredit ) + "</i></div>");
							}
						});
					} else {
						$creditParent.each(function(i){
							photoCredit = photos[i].photoCredit;
							if ( photoCredit ) {
								$creditParent.eq(i).prepend("<div class=\"credit\"><i>" + creditTemplate.replace("{{credit}}", photoCredit) + "</i></div>");
							}
						});
					}
				},
				
				preloadPhoto: function( index ){
					
					index = getIndex( index );
					
					var $slide = $slides.eq( index ),
						photo,
						photoSrc,
						dynamicPhotoSrc,
						image;		
					
					if ( ! $slide.data("image-loaded." + namespace) ) {
						
						photo = photos[ index ];
						photoSrc = photo.photoSrc;
						dynamicPhotoSrc = $.getDynamicImageSrc( photoSrc, photoWidth, photoHeight );
							
						// Preload this image and be sure its siblings are loaded.
						if ( isCarousel ) {
							
							// Images are tricky because we need to know the width
							// to pull off a carousel.  We must first download the 
							// image, figure out the width, and set its parent.
							image = new Image();
							
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
							
							// Set the src after event hooks for IE.
							image.src = dynamicPhotoSrc;

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
						core.preloadPhoto( currentIndex );
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
								
								// This is here simply to fix IE8.  Don't ask?
								$slideContainer.attr("");
							}
						}
						core.updateCarouselPosition();
						next();
					});
					
				},
				
				// Think about moving this back into preloadImage.
				updateCarouselPosition: function( oldIndex ){
					
						// Look into caching some of these widths.
					var $slide = $slides.eq( getIndex( activeIndex ) ),
						galleryWidth = $gallery.width(),
						activePosition,
						$oldSlide,
						oldPosition;
	
					activePosition = ( galleryWidth - $slide.width() )/2 - $slide.position().left	
					
					// If we are passed an old index, we want to first set the position 
					// to the old one, and animate to the new one.
					if ( typeof oldIndex === "number" ) {
						
						$oldSlide = $slides.eq( oldIndex );
						oldPosition = ( galleryWidth - $oldSlide.width() )/2 - $oldSlide.position().left;
						$slideContainer.queue(function( next ){ $slideContainer.css( "left", oldPosition + "px" ); next(); });
						$slideContainer.animate({ "left": activePosition + "px" }, speed );
						
					} else {
						
						$slideContainer.css( "left", activePosition + "px" );
						
					}
	
				},
				
				buildFullscreen: function(){	
					
					var fullscreenButtonHTML = "<div class=\"show-fullscreen button\"><b>" + template.fullscreen + "</b></div>",
						fullscreenHTML = "<div class=\"aol-photo-gallery-fullscreen\"><div class=\"fullscreen\"><div class=\"close button\"><b>Close</b></div><div class=\"aside\"></div></div></div>";
					
					// Create the button.
					$fullscreenButton = ui.$fullscreenButton = $( fullscreenButtonHTML );
					
					// Insert it after the gallery.
					$gallery.after( $fullscreenButton );
					
					// Create the full screen backdrop <div>
					$fullscreen = ui.$fullscreen = $( fullscreenHTML );
					
					$fullscreen.css({
						opacity: 0	
					});
					
					// Insert it after the <body>
					$fullscreen.prependTo( body );
					
					core.bindFullscreen();
					
				},
				
				bindFullscreen: function(){
					
					var $fullscreenPhotoGallery,
						$fullscreenContainer = $fullscreen.find(".fullscreen"),
						$fullscreenAd,
						fullscreenAdId = adDivName + (adDivId++),
						fullscreenOptions = options.fullscreenOptions,
					
						bodyElemWidth,
						bodyElemHeight,
						htmlElemWidth,
						htmlElemHeight,
						documentHeight,
						documentWidth;
				
					// Mousedown feels faster.
					$aolPhotoGalleryClone.delegate(".show-fullscreen", "mousedown", function(){

						bodyElemWidth = body.offsetWidth;
						bodyElemHeight = body.offsetHeight;
						htmlElemWidth = documentElem.offsetWidth;
						htmlElemHeight = documentElem.offsetHeight;
						documentHeight = document.height;
						documentWidth = document.width;
						
					
						// Turn the lights out.
						$fullscreen.css({
							display: "block",
//							width: ( bodyElemWidth > htmlElemWidth ? bodyElemWidth : htmlElemWidth ) + "px",
//							height: ( bodyElemHeight > htmlElemHeight ? bodyElemHeight : htmlElemHeight ) + "px",
							width: Math.max( bodyElemWidth, htmlElemWidth, documentWidth ) + "px",
							height: Math.max( bodyElemHeight, htmlElemHeight, documentHeight ) + "px",
							opacity: 0
						}).animate({
							opacity: 1
						}, speed * 1.5)
						
						// We could try doing position: fixed instead, but people
						// won't be able to scroll unless we are very good about
						// designing an auto-height experience.
						$fullscreenContainer.css({
							top: documentElem.scrollTop || window.pageYOffset || body.scrollTop || 0
						});
						
						// If we didn't initialize full screen yet, 
						// let's render shit.
						if ( ! $fullscreenPhotoGallery ) {
												
							$fullscreenPhotoGallery = $aolPhotoGallery.clone();
							
							// Insert the photo gallery after the close button.
							$fullscreenContainer.children().first().after( $fullscreenPhotoGallery );
							
							// If we have a fullscreen ad magic number.
							if ( options.fullscreenAdMN ) {
								
								// Build the ad spot.
								$fullscreenAd = $( "<div id=\"" + fullscreenAdId + "\" class=\"advertisement\"></div>" );
								
								// Append the ad spot.
								$fullscreenContainer.find("div.aside").append( $fullscreenAd );
	
								// Render the ad.
								if ( window.htmlAdWH && options.fullscreenAdMN ) {
									htmlAdWH( options.fullscreenAdMN, options.fullscreenAdWidth, options.fullscreenAdHeight, "ajax", fullscreenAdId );	
								}
															
								// Set up refresh for the ad.
								fullscreenOptions.refreshDivId = fullscreenAdId;
							}

							fullscreenOptions.showFullscreen = 0;
							fullscreenOptions.activePhoto = activeIndex + 1;
							fullscreenOptions.ui = {
								$parentGallery: $aolPhotoGalleryClone
							};
							
							// Initialize the photo gallery in full screen.
							$fullscreenPhotoGallery.aolPhotoGallery( fullscreenOptions );
								
						} else {
							
							// If we're already initialized, we need to ensure 
							// to set to the current active index.
							$aolPhotoGalleryClone.trigger("fullscreen-open." + namespace, [{ index: activeIndex }]);
							
						}
						
					});

					$fullscreen.delegate(".close", "mousedown", function(){
					// Turn the lights on.
						$fullscreen.animate({
							opacity: 0
						}, speed * 1.5).queue(function(next){
							$fullscreen.css({
								display: "none"
							});
							next();
						});
						
						// Reset the parent gallery to whatever slide we're on right now.
						$aolPhotoGalleryClone.trigger("fullscreen-close." + namespace);
						
					});

					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							$fullscreenButton.css("visibility", "hidden");
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
							$fullscreenButton.css({
								"display": "block",
								"visibility": "visible"
							});
						});
					}

				},
				
				// This serves as a bridge between the fullscreen gallery
				// and the embedded gallery, maintaining the active index
				// between the two.
				bindFullscreenParent: function(){
					
					var $parentGallery = options.ui.$parentGallery;
					
					// If we hear an open, we need to update our status to match.
					$parentGallery.bind("fullscreen-open." + namespace, function(event, data){

						$aolPhotoGalleryClone.trigger("status-reset", [{ index: data.index }]);
						
					});
					
					// If we hear a close, tell the parent to update to our index.
					$parentGallery.bind("fullscreen-close." + namespace, function(){

						$parentGallery.trigger("status-reset", [{ index: activeIndex }]);
						
					});
					
				},

				buildGallery: function(){
					
					// Remove the anchor links, we no longer need them.
					// On second thought, leave them in for screen readers.
					// $anchors.remove();
					
					// Wrap the photos for design hooks.
					$slideContainer.wrap( "<div class=\"gallery\"></div>" );
					
					$gallery = ui.$gallery = $slideContainer.parent();
					
					if ( isCarousel ) {
					
						$slides.eq( activeIndex ).addClass("active");
						
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
						}).addClass("active");

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
					
					// If we are not in a carousel, clicking on the photos doesn't just go next.
					if ( ! isCarousel ) {
						
						$aolPhotoGalleryClone.delegate(".photos > li", "mousedown." + namespace, function(){
							$(this).trigger("next-mousedown." + namespace);
						});
						
						$aolPhotoGalleryClone.delegate(".photos > li", "mouseover." + namespace, function(){
							$(this).trigger("next-mouseover." + namespace);
						});
						
					} else {
						$aolPhotoGalleryClone.delegate(".photos > li", "mousedown." + namespace, function(){
								
							var photo = this,
								$photo = $(photo),
								photoIndex = +$photo.data("index");  // The + converts the string to a number.
							
							$photo.trigger("photo-mousedown." + namespace, [{ index: photoIndex }]);

						});
					}
					
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
						
						$activeSlide.addClass("active");
						$oldSlide.removeClass("active");
						
						if ( isCarousel ) {
							// Handle carousel transition.
							if ( data.init ) {
								// Disables the transition and jumps right 
								// to the photo.
								core.updateCarousel();
							} else {
								core.updateCarousel( oldIndex );
							}
							
							
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
							
							// Artz: Make this a simple loop, perhaps?
							// Be sure this photo has loaded.
							core.preloadPhoto( activeIndex );
													
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
									"left": -$gallery.outerWidth()
								}, speed);
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(event, data){
							
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
						$aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
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
					
					var statusTemplate = template.status.replace("{{active}}", activeIndex + 1).replace("{{total}}", totalPhotos),
						statusHTML = "<div class=\"status\">" + statusTemplate + "</div>";
						
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
					
					var statusTemplate = template.status;
					
					function getStatusTemplate(){
						return statusTemplate.replace("{{active}}", activeIndex + 1).replace("{{total}}", totalPhotos);
					}
					
					$aolPhotoGalleryClone.bind("status-reset." + namespace, function( event, data ) {
						
						var oldIndex = activeIndex;
						
						activeIndex = data.index;
						
						if ( oldIndex !== activeIndex ) {
							$status.html( getStatusTemplate() )
							// Here, we don't send the oldIndex so animations know to snap right to the active one.
								.trigger("status-update." + namespace, [{ activeIndex: activeIndex, oldIndex: oldIndex, init: true }]);
						}
					});
					
					$aolPhotoGalleryClone.bind("photo-mousedown." + namespace, function( event, data ){
						
						var oldIndex = activeIndex;
						
						activeIndex = data.index;
						
						if ( oldIndex !== activeIndex ) {
							$status.html( getStatusTemplate() )
								.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);
						}
					});
					
					$aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function( event, data ){
						
						var oldIndex = activeIndex;
						
						activeIndex = data.index;
						
						if ( oldIndex !== activeIndex ) {
							$status.html( getStatusTemplate() )
								.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);
						}
					});
					
					$aolPhotoGalleryClone.bind("back-mousedown." + namespace, function( event, data ){
						if ( ! statusRateLimit ) {
							statusRateLimit = 1;
							var oldIndex = activeIndex;
								
							activeIndex = activeIndex === 0 ? totalPhotos - 1 : activeIndex - 1;
							
							$status.html( getStatusTemplate() )
								.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);
						
							setTimeout(function(){
								statusRateLimit = 0;
							}, speed );
						}
					});
					
					$aolPhotoGalleryClone.bind("next-mousedown." + namespace, function(){
						if ( ! statusRateLimit ) {
							statusRateLimit = 1;
								
							var oldIndex = activeIndex;
								
							activeIndex = activeIndex === totalPhotos - 1 ? 0 : activeIndex + 1;
							
							$status.html( getStatusTemplate() )
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
						
						$aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
							$status.css({
								"display": "block",
								"visibility": "visible"
							});
						});
						
					}
					
				},
				
				buildControls: function(){
					
					$controls = ui.$controls = $("<ul class=\"controls\"><li class=\"back button\"><b>" + template.back + "</b></li><li class=\"next button\"><b>" + template.next + "</b></li></ul>");
					
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
					
					$aolPhotoGalleryClone.delegate(".controls > .back", "mousedown." + namespace, function(){
						$(this).trigger("back-mousedown." + namespace);
					});
					$aolPhotoGalleryClone.delegate(".controls > .next", "mousedown." + namespace, function(){
						$(this).trigger("next-mousedown." + namespace);
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
						
						$aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
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
									left: $aolPhotoGalleryClone.width(),
									top: $slideContainer.position().top,
									width: $aolPhotoGalleryClone.width(),
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
							thumbnailIndex = +$thumbnail.data("index");  // The + converts the string to a number.

						$thumbnail.trigger("thumbnail-mouseover." + namespace, [{ index: thumbnailIndex }]);
						
						if ( thumbnailIndex !== activeIndex ) {
							$thumbnail.stop().fadeTo(speed, 1); 
						}
						
					});
					
					$aolPhotoGalleryClone.delegate(".thumbnails > li", "mouseout." + namespace, function(){
						
						var thumbnail = this,
							$thumbnail = $(thumbnail),
							thumbnailIndex = +$thumbnail.data("index");  // The + converts the string to a number.
						
						$thumbnail.trigger("thumbnail-mouseout." + namespace, [{ index: thumbnailIndex }]);
						
						if ( thumbnailIndex !== activeIndex ) {
							$thumbnail.stop().fadeTo(speed, 0.7);
						}
					
					});
					
					// Bind event trigger.
					$aolPhotoGalleryClone.delegate(".thumbnails > li", "mousedown." + namespace, function(){
						
						var thumbnail = this,
							$thumbnail = $(thumbnail),
							thumbnailIndex = +$thumbnail.data("index");  // The + converts the string to a number.
						
						$thumbnail.trigger("thumbnail-mousedown." + namespace, [{ index: thumbnailIndex }]);
						
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
							// this toggle is mousedowned.
							if ( ! $thumbnailContainer.data("thumbnails-loaded") ) {
								$thumbnails.css("backgroundImage", function(i, value){
									return "url(" + $thumbnails.eq(i).data("src") + ")";
								});
								$thumbnailContainer.data("thumbnails-loaded", 1);
							}
							
							// Position the thumbnail container at top of the gallery.
							$thumbnailContainer.css({
								"top": $gallery.position().top,
								"left": $aolPhotoGalleryClone.width()
							});

							// Animate it to the left.
							$thumbnailContainer.animate({
								"left": 0 - parseInt( $thumbnailContainer.css("marginLeft"), 10 )
							}, speed);
							
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
							
							$thumbnailContainer.css({
								"position": "absolute"
							}).animate({
								"left": $aolPhotoGalleryClone.width()
							}, speed).queue(function( next ){
								$aolPhotoGalleryClone.height( "auto" );
								next();
							});
							
						});
					}
				},

				buildShowThumbnails: function(){
					
					var showThumbnailsHTML = "<div class=\"show-thumbnails button\"><b>" + template.thumbnails + "</b></div>";
					
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
					
					$aolPhotoGalleryClone.delegate( ".show-thumbnails", "mousedown." + namespace, function(){
						$aolPhotoGalleryClone.trigger( "show-thumbnails." + namespace );
					});			
					
					$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
						ui.$showThumbnails.css("visibility", "hidden");
					});
					
					$aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
						ui.$showThumbnails.css("visibility", "visible");
					});
					
				},
				
				buildSponsorAd: function(){
					
					var sponsorAdId = adDivName + (adDivId++),
						sponsorHTML = "<div id=\"" + sponsorAdId + "\" class=\"sponsor advertisement\"></div>";

					$sponsor = ui.$sponsor = $( sponsorHTML );
					
					// Sponsorship goes at the top.
					$aolPhotoGalleryClone.prepend( $sponsor );

					// Render the ad in the next UI thread, once everything is visible.
					if ( window.htmlAdWH ) {
						setTimeout(function(){
							htmlAdWH( options.sponsorAdMN, options.sponsorAdWidth, options.sponsorAdHeight, "ajax", sponsorAdId );
						}, 0);
					}

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
					// Listen for status updates to count photo mousedowns.
					$aolPhotoGalleryClone.bind("status-update." + namespace, function(){
					// Code for refreshing ads here.

						// Increment our status counter.
						refreshStatus++;

						// If we are at the limit, time to refresh and reset.
						if ( refreshStatus === refreshCount ) {
							
							if ( window.adsReloadAd ) {
								refreshStatus = 0;
								// Set a timeout so that it doesn't interfere
								// with our transition animation.
								setTimeout(function(){
									adsReloadAd( refreshDivId )
								}, speed);
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
			
			initTracking = function(){
				
				// Whenever there's a status update, let's fire a page view.
				$aolPhotoGalleryClone.bind("status-update." + namespace, function(){
					
					var updateArea = $aolPhotoGalleryClone.width() * $aolPhotoGalleryClone.height(),
						updateRatio = updateArea / trackingArea;
						
					// Check for Comscore page refresh requirements.
					if ( updateArea > trackingRatio ) {
						$.mmTrack();
					}
					
				});
				
			},
			
			init = function(){

				if ( options.refreshDivId ) {
					initRefreshAd( options );
				}
				
				if ( options.initTracking ) {
					initTracking();
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
	
	// Since these point to the original DOM nodes, 
	// we may want to reset the pointers.
	return this.each(function(){
		$.aolPhotoGallery( customOptions, this );
	});
	
}
	
})(jQuery, window, document, location);

/*
	Creates an mm_track URL, used for tracking page views to Comscore.
*/
(function( $, window, document, location ){
	
	var encode = encodeURIComponent,
		omnitureObj,
		omnitureAccount = "",
		omnitureChannel = "",
		omnitureProp1 = "",
		omnitureProp2 = "",
		omnitureEnabled = "",
		
		protocol = location.protocol,
		host = location.hostname,
		url = location.href,
		urlClean,
		
		title = "?title=" + encode( document.title ),
		
		mmTrackIframe,
		mmTrackIframeStyle;
	
	function populateOmniVars(){
		if ( omnitureObj = window.s_265 ) {
			omnitureEnabled = "&omni=1";
			omnitureAccount = "&s_account=" + window.s_account;
			omnitureChannel = "&s_channel=" + omnitureObj.channel;
			omnitureProp1 = omnitureObj.prop1 + "/";
			omnitureProp2 = omnitureObj.prop2 + "/";
		}
	}
	
	function initIframe(){
		
	}
	
	$.mmTrack = function() {
		
		if ( ! omnitureObj ) {
			populateOmniVars();
		}
		
		if ( ! mmTrackIframe ) {
			mmTrackIframe = document.createElement("iframe");
			mmTrackIframeStyle = mmTrackIframe.style;
			mmTrackIframe.id = "aol-mmtrack";
		//	mmTrackIframeStyle.width = 0;
		//	mmTrackIframeStyle.height = 0;
			mmTrackIframeStyle.display = "none";
			
			$( document.body ).append( mmTrackIframe );
		}		
		
		var mmTrackUrl = [ 
			protocol, 
			"//",
			host,
			"/mm_track/",
			omnitureEnabled,
			omnitureProp1,
			omnitureProp2,
			omnitureAccount,
			omnitureChannel,
			title].join("");
		
		mmTrackIframe.src = mmTrackUrl + "&ts=" + +new Date();
	}
	
})( jQuery, window, document, location );

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