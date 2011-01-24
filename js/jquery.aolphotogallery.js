/*
	AOL Photo Gallery Module
	@author David Artz
	@since 1/21/2011
*/
(function($, location){

var defaultOptions = {

		photoWidth: 600,//"auto",
		photoHeight: 456,//"auto",
		thumbnailWidth: 74,
		thumbnailHeight: 74,
		
		thumbnailCount: 999,
		thumbnailAfter: 1,
		
		activeIndex: 1,
		
		refreshAd: 0,
		refreshCount: 3,
		
		showThumbnails: 0,
		showName: 1,
		showDescription: 1,
		showControls: 1,
		showStatus: 1,
		
		toggleThumbnails: 1,
		
		showCaptions: 1,
	
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

$.getDynamicImageSrc = function(photoSrc, photoWidth, photoHeight, thumbnail, settings) {
    var options,
        dimensions,
        action,
        modifiers;
    
    if (typeof thumbnail == "object") {
        settings = thumbnail;
    }
        
    $.extend(options = {}, {
        action : 'resize',
        format : null,
        quality : 60,
    }, settings);
        
    dimensions = photoWidth + "x" + photoHeight;
    action = (thumbnail && typeof thumbnail != "object") ? "thumbnail" : options.action;
    modifiers = "/quality/" + options.quality;

    if (options.crop) {
        dimensions += "+" + (options.crop.x || 0) + "+" + (options.crop.y || 0);
    }
    
    if (options.format) {
        modifiers += "/format/" + options.format;
    }
        
    return "http://o.aolcdn.com/dims-global/dims3/GLOB/" + action + "/" + dimensions + modifiers + "/"+ photoSrc;
}

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
			
			photoWidth = options.photoWidth,
			photoHeight = options.photoHeight,
			thumbnailWidth =  options.thumbnailWidth,
			thumbnailHeight = options.thumbnailHeight,
			
			// Object we use to store if photo has been cached.
			photoCached = {},
			
			$slides,
			$images,
			$anchors,
			
			core = {
				
				init: function(){
					
					var $galleryName = ui.$galleryName = $aolPhotoGalleryClone.find( ui.galleryName ),
						galleryName = data.galleryName = $galleryName.text(),
						$galleryDescription = ui.$galleryDescription = $aolPhotoGalleryClone.find( ui.galleryDescription ),
						galleryDescription = data.galleryDescription = $galleryDescription.html();
					
					$anchors = ui.$anchors = $aolPhotoGalleryClone.find( ui.anchors );
					$slides = ui.$slides = $aolPhotoGalleryClone.find( ui.slides );
					
					$slides.parent().css({
						height: photoHeight + "px"
					});
					
					$slides.css({
						width: photoWidth + "px",
						height: photoHeight + "px",
						lineHeight: photoHeight + "px"
					});
					
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
				
				preloadPhoto: function(i){
					
					if ( ! photoCached[i] ) {
						var img = new Image();
						img.src = $.getDynamicImageSrc( photos[i].photoSrc, photoWidth, photoHeight );
						photoCached[i] = 1;
					}
					
				},

				
				buildGallery: function(){

					$slides.css({
						opacity: 0
					});
					
					// Set up the active photo.
					$slides.eq( activeIndex ).css({
						zIndex: 1,
						opacity: 1,
						visibility: "visible"
					});
					
					// Set up background images on slides. This is nice because we don't have to 
					// mess with <img>, which downloads automatically where as CSS will only
					// download when visible.
					$slides.css( "background", function(i){
						
						var photo = photos[i],
							photoSrc = photo.photoSrc,
							dynamicPhotoSrc = $.getDynamicImageSrc( photoSrc, photoWidth, photoHeight );
							
						this.style.background = "url(" + dynamicPhotoSrc + ") no-repeat center center";
						
					});
					
					// Remove the anchor links, we no longer need them.
					$anchors.remove();
					
					// If we need to show thumbnails by default and 
					// hide the gallery, do so now. 
					// Note: We hide from the DOM so the Thumbnails
					// look casual.
					if ( options.showThumbnails && options.toggleThumbnails ) {
						$slides.parent().hide();
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
						core.preloadPhoto( backIndex );
					});
					
					$aolPhotoGalleryClone.bind("next-mouseover." + namespace, function( event, data ){
						var nextIndex = activeIndex === totalPhotos - 1 ? 0 : activeIndex + 1;
						core.preloadPhoto( nextIndex );
					});
					
					$aolPhotoGalleryClone.bind("status-update." + namespace, function(event, data){
						
						var oldIndex = data.oldIndex,
							activeIndex = data.activeIndex,
							
							$oldSlide = $slides.eq( oldIndex ),
							$activeSlide = $slides.eq( activeIndex ),
							
							backIndex = activeIndex === 0 ? totalPhotos - 1 : activeIndex - 1,
							nextIndex = activeIndex === totalPhotos - 1 ? 0 : activeIndex + 1;
							
						// Handle transition.
						$oldSlide.css({
							zIndex: 0 
						}).animate({
							opacity: 0
						}, 200);
						
						$activeSlide.css({ 
							visibility: "visible",
							zIndex: 1 
						}).animate({
							opacity: 1
						}, 200);	

						
						// Preload the previous image if needed.	
						core.preloadPhoto( backIndex );
						
						// Preload the next image if needed.
						core.preloadPhoto( nextIndex );

					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							$slides.parent()
								.css("position", "relative")
								.animate({
									"left": -$slides.parent().width()
								}, 200);
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(event, data){
							
							$slides.parent()
								.css("visibility", "visible")
								.animate({
									"left": 0
								}, 200);

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
						$captions,
						photo;
								
					// Build thumbnail HTML.
					for (; i < l; i++) {
						photo = photos[i];
						captionHTML.push("<li data-index=\"" + i + "\"><h3>" + photo.photoName + "</h3>" + photo.photoDescription + "</li>");
					}
					
					captionHTML.push("</ul>")
					
					$captions = $( captionHTML.join("") );
					
					// Append captions.
					$slides.parent().after( $captions );
					
					$captions = $captions.find("li");
					$captions.eq( activeIndex ).css({
						zIndex: 1,
						visibility: "visible",
						position: "absolute"
					});
					
					// Need to make this tweak in the next UI thread.
					setTimeout(function(){
						$captions.parent().height( $captions.eq( activeIndex ).height() );
					}, 0);
					
					ui.$captions = $captions;
					
					core.bindCaptions();
					
					// If we need to show thumbnails by default and 
					// hide the captions, do so now.
					if ( options.showThumbnails && options.toggleThumbnails ) {
//						$captions.parent().css("visibility", "hidden");
						$captions.parent().hide();
					}
				},
				
				bindCaptions: function(){
					$aolPhotoGalleryClone.bind("status-update." + namespace, function(event, data){
						
						var oldIndex = data.oldIndex,
							activeIndex = data.activeIndex,
							
							$captions = ui.$captions,
							
							$oldCaption = $captions.eq( oldIndex ),
							$activeCaption = $captions.eq( activeIndex );

						$activeCaption.css({
							visibility: "visible",
							opacity: 0,
							zIndex: 1
						}).animate({
							opacity: 1
						}, 200);	

						$oldCaption.css({
							zIndex: 0
						}).animate({
							opacity: 0
						}, 200); // Fade out didn't work when its parent container was not displayed.

						$captions.parent().animate({
							height: $activeCaption.height()
						}, 200);

					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							ui.$captions.parent().css("visibility", "hidden");
						});
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){
							ui.$captions.parent().css("visibility", "visible");
						});
					}
					
				},
				
				buildStatus: function(){
					var statusHTML = "<div class=\"status\">" + ( activeIndex + 1 ) + " of " + totalPhotos + "</div>",	
						$status = ui.$status = $( statusHTML );
					
					$slides.parent().after( $status );
					
					// We still need Status to live in the DOM.
					if ( ! options.showStatus ) {
						$status.hide();
					}
					
					// If we need to show thumbnails by default and 
					// hide the captions, do so now.
					if ( options.showThumbnails && options.toggleThumbnails ) {
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
							ui.$status.html( ( activeIndex + 1 ) + " of " + totalPhotos )
								.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);
						}
					});
					
					$aolPhotoGalleryClone.bind("back-click." + namespace, function( event, data ){
						
						var oldIndex = activeIndex,
							backIndex;
							
						activeIndex = activeIndex === 0 ? totalPhotos - 1 : activeIndex - 1;
						ui.$status.html( ( activeIndex + 1 ) + " of " + totalPhotos )
							.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);

					});
					
					$aolPhotoGalleryClone.bind("next-click." + namespace, function(){
						
						var oldIndex = activeIndex,
							nextIndex;
							
						activeIndex = activeIndex === totalPhotos - 1 ? 0 : activeIndex + 1;
						ui.$status.html( ( activeIndex + 1 ) + " of " + totalPhotos )
							.trigger("status-update." + namespace, [{ oldIndex: oldIndex, activeIndex: activeIndex }]);
							
					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							ui.$status.css("visibility", "hidden");
						});
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){
							ui.$status.css("visibility", "visible");
						});
					}
					
				},
				
				buildControls: function(){
					var $controls = ui.$controls = $("<ul class=\"controls\"><li class=\"back\"><b>Back</b></li><li class=\"next\"><b>Next</b></li></ul>");
					$slides.parent().after( $controls );
					core.bindControls();
					
					// If we need to show thumbnails by default and 
					// hide the captions, do so now.
					if ( options.showThumbnails && options.toggleThumbnails ) {
						$controls.hide();
						// $controls.css("visibility", "hidden");
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
							ui.$controls.css("visibility", "hidden");
						});
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){
							ui.$controls.css("visibility", "visible");
						});
					}
					
				},
				
				buildThumbnails: function(){
					
					var i = 0, 
						l = ui.$anchors.length, 
						thumbnailCount = options.thumbnailCount, 
						thumbnailHTML = ["<ul class=\"thumbnails\">"],
						
						activeThumbnail = activeIndex,
						
						$thumbnails;
					
					// Build thumbnail HTML.
					for (; i < l; i++) {
						thumbnailHTML.push("<li style=\"background: url(" + $.getDynamicImageSrc( photos[i].photoSrc, thumbnailWidth, thumbnailHeight, 1 ) + ") no-repeat center center; width: " + thumbnailWidth + "px; height: " + thumbnailHeight + "px; display: " + ( ( i >= thumbnailCount) ? "none" : "block" )  + "; opacity: .7;\" data-index=\"" + i + "\"></li>");
					}
					
					// <img " + ( ( i >= thumbnailCount) ? "data-src=\"" : "src=\"" ) +  + "\" /> // Save for later.
					
					thumbnailHTML.push("</ul>")
					
					$thumbnails = $( thumbnailHTML.join("") );
					
					// Append thumbnails.
					options.thumbnailAfter ? $aolPhotoGalleryClone.append( $thumbnails ) : $slides.parent().prepend( $thumbnails );
					
					ui.$thumbnails = $thumbnails.find("li");
					
					// Set the active thumbnail's opacity to full.
					ui.$thumbnails.eq( activeIndex ).css({
						"opacity": 1
					});
					
					core.bindThumbnails();
					
					if ( options.toggleThumbnails ) {
						
						// If we have a toggle, we dynamically 
						// manage the height and positioning.
						// Set this once our module has layout.					
						if ( ! options.showThumbnails ) {
							setTimeout(function(){
								var $slideContainer = $slides.parent(),
									padding = parseInt( $thumbnails.css("paddingTop"), 10 ) + parseInt( $thumbnails.css("paddingBottom"), 10 );

								$thumbnails.css({
									position: "absolute",
									left: $thumbnails.width(),
									top: $slideContainer.position().top,
									width: $slideContainer.width(),
									height: $slideContainer.height() - padding
								});
							}, 0);
						}
						
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
							$thumbnail.stop().fadeTo(200, 1); 
						}
					});
					
					$aolPhotoGalleryClone.delegate(".thumbnails > li", "mouseout." + namespace, function(){
						var thumbnail = this,
							$thumbnail = $(thumbnail),
							thumbnailIndex = +$thumbnail.attr("data-index");  // The + converts the string to a number.
						
						$thumbnail.trigger("thumbnail-mouseout." + namespace, [{ index: thumbnailIndex }]);
						if ( thumbnailIndex !== activeIndex ) {
							$thumbnail.stop().fadeTo(200, .7);
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
							activeIndex = data.activeIndex,
							$thumbnails = ui.$thumbnails;

						$thumbnails.eq( oldIndex ).removeClass("active")
							.fadeTo( 200, .7 );
						$thumbnails.eq( activeIndex ).addClass("active")
							.fadeTo( 200, 1 );

					});
					
					// If the toggle feature is present, add those bindings.
					if ( options.toggleThumbnails ) {
						$aolPhotoGalleryClone.bind("show-thumbnails." + namespace, function(){
							var $thumbnailContainer = ui.$thumbnails.parent(),
								$slideContainer = $slides.parent();
							
							// Position the thumbnail container at top of the gallery.
							$thumbnailContainer.css({
								"top": $slideContainer.position().top,
								"left": $slideContainer.width()
							});
							
							// Animate it to the left.
							$thumbnailContainer.animate({
								"left": 0 - parseInt( $thumbnailContainer.css("marginLeft"), 10 )
							}, 200);
						});
						
						$aolPhotoGalleryClone.bind("thumbnail-click." + namespace, function(){

							var $thumbnailContainer = ui.$thumbnails.parent(),
								$slideContainer = $slides.parent();

							$thumbnailContainer.animate({
								"left": $thumbnailContainer.width()
							}, 200);
						});
					}
					
					
				},

				buildShowThumbnails: function(){
					
					var $thumbnails = ui.$thumbnails,
						showThumbnailsHTML = "<div class=\"show-thumbnails\"><b>Show Thumbnails</b></div>",
						$showThumbnails = ui.$showThumbnails = $( showThumbnailsHTML );
					
					if ( options.showThumbnails && options.toggleThumbnails ) {
						$showThumbnails.hide();
					}
					
					$slides.parent().before( $showThumbnails );
					
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
							"</a>"].join(""),
						$sponsor = ui.$sponsor = $( sponsorHTML );
					
					$aolPhotoGalleryClone.prepend( $sponsor );
					
				}
				
			},
			
			initRefreshAd = function(){

				function refreshAd(){
					// Code for refreshing ads here.
				}
				
				var adMagicNumbers = options.refreshAd.split(),
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

				// Listen for status updates to count photo clicks.
				$aolPhotoGalleryClone.bind("status-update." + namespace, function(){
					
					// Increment our status counter.
					refreshStatus++;
					
					// If we are at the limit, time to refresh and reset.
					if ( refreshStatus === refreshCount ) {
						refreshAd();
						refreshStatus = 0;
					}
					
				});
				
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
				
				if ( options.refreshAd ) {
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