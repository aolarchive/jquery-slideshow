/*
    AOL Photo Gallery Module
    @author David Artz
    @since 1/21/2011
    @6/17/2011: Ramesh Kumar added support for prop17 and prop21 omniture values for International blogs.
    @6/21/2011: Ramesh Kumar fixed another omniture bug, specific to International mmx tracking. pfxID was not getting passed onto mm_track page. Some values were showing up as "undefined".
    @7/20/2011 : Sobia Ali made some updates for the UK team. The file is checked in and is named: jquery.aolphotogallery.uk.js
    @4/30/2012 : Ramesh Kumar added a new feature for thumbnail carousel in fullscreenmode. Function name: buildThumbCarousel()

    To Do:
    * Related galleries.
    * End cards?
    * Autodetect the width of the column, and adjust the image size.
    * Make default thumbnail view with toggle.
    * LINE 889: Remove thumbnail opacity effect from the core code, make it optional.
    * Convert my div buttons to anchor links, a bit more trackable, accessible, etc., unless we dare try buttons.
    * For ad refresh to work, be sure adPage is set up properly (reference aol-advertising module).
    * Think we got this for the most part, but we should trace all relevant spots and use getIndex() function once.

    * Deep link into media ID.
    * Need to implement a hash change event to delete from history.

*/
(function($, window, document, location){

var defaultOptions = {

        // This allows developers to add addtional
        // class names to the container <div>, useful
        // for making override styles.
        theme: "default",

        // This can be set to any of the presetOptions
        // to quickly set some common configurations.
        // This will also add a class with the below preset.
        preset: "slideshow",
        presetOptions: {

            "slideshow": {
                toggleThumbnails: 1,
                thumbnailAfter: 0
            },

            "carousel": { // aol-photo-gallery-carousel
                carousel: 1,
                controlsInside: 1,
                showThumbnails: 1,
                toggleThumbnails: 0,
                build: {
                    "thumbnails-button": ""
                },
                creditInside: "$slides"
            },

            "portrait": { // aol-photo-gallery-portrait
                captionsAfter: 0,
                showCaptions: 1,
                photoWidth: 325,
                showFullscreen: 0,
                creditInside: "$slides",
                build: {
                    "thumbnails-button": ""
                }
            },

            "launch": { // aol-photo-gallery-launch
                showControls: 0,
                showCaptions: 0,
                showStatus: 0,
                showDescription: 1,
                showThumbnails: 0,
                toggleThumbnails: 0,
                descriptionAfter: 1,
                template: {
                    fullscreen: "Launch Gallery"
                },
                build: {
                    "next-button": "",
                    "back-button": "",
                    "thumbnails-button": ""
                }
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
        
        // Default options for Thumbnail Carousel
        buildThumbCarousel: 1,
        thumbCarouselOptions: {
            "startImage": 0,
            "scrollNumImages": 5,
            "animateSpeed": 300
        },

        // Default options for full screen.
        fullscreenOptions: {
            isInternational : 0,
            // Moving contents like "Title", "Description", "Captions" etc., to the right rail above the Ad. 
            // TODO: Need to create a separate function to accomodate this. For now, it will be used within buildCaptions() 
            contentsInRightRail: 0,
            photoWidth: 559,
            photoHeight: 487,
            preset: "carousel",
            carouselSiblings: 2,
            sponsorAdMN: "",
            build: {
                "status": "bottom-center append after $gallery",
                "back-button": "bottom-right append after $gallery",
                "next-button": "bottom-right append",
                "fullscreen-button": "",
                "thumbnails-button": ""
//				"thumbnails-button": "bottom-left append after $gallery"
            }
        },

        // If supplied, make a sponsorship advertisement.
//		sponsorAdMN: "93302143",
        sponsorAdWidth: 215,
        sponsorAdHeight: 35,

//		Is there a house 300x250 we can display?
//		fullscreenAdMN: "773630",
        fullscreenAdWidth: 300,
        fullscreenAdHeight: 250,

//		fullscreenSponsorAdMN: "",
        fullscreenSponsorAdWidth: 215,
        fullscreenSponsorAdHeight: 35,

        // How many thumbs to display, we don't quite
        // do anything with this yet, may be useful
        // later for showing an initial thumb set,
        // or controlling how many per thumbnail pane.
        thumbnailCount: 999,

        // Inserts thumnbails immediately after
        // the gallery <div>. Falsy inserts before.
        thumbnailAfter: 1,

        // The active photo on initialization.
        activePhoto: 1,

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
        toggleThumbnails: 0,

        // Inserts the "Show Thumbnails" button before
        // the gallery in the DOM if truthy, after
        // if falsy.
// TBR		toggleThumbnailsAfter: 1,

        // Toggle to show the name of the gallery.
        showName: 1,

        // Toggle to show the description of the gallery.
        showDescription: 1,

        // In some cases we may want the description after.
        descriptionAfter: 0,

        build: {
            "status": "bottom-center append after $gallery",
            "back-button": "top-right append before $gallery",
            "next-button": "top-right append",
            "fullscreen-button": "bottom-right append after $gallery",
            "thumbnails-button": "bottom-left append after $gallery",
            "wallpaper-button": "bottom-right append" // "after $gallery" not needed b/c it already exists.
        },

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

        imageQuality: 85, // Artz: Add this in. Not used just yet.

        // Templates that developers can override.
        template: {
            status: "{{active}} of {{total}}",
            credit: "Photo: {{credit}}",
            "fullscreen-button": "Fullscreen",
            "thumbnails-button": "Thumbnails",
            "next-button": "Next",
            "back-button": "Back",
            "wallpaper-button": "Download Wallpaper",
            wallpaperSeparator: " x ",
            wallpaperOriginal: "Original Size"
        },

        showCurrentWallpaper: 1,
        showOriginalWallpaper: 1,
        wallpaperCrop: 0,
        wallpaperSizes: [
            {
                width: 1024,
                height: 768
            },
            {
                width: 1600,
                height: 1200
            }
        ],

        // Overrides for DOM elements, generally
        // developers shouldn't touch these.
        ui: {
            slides: "> .photos > li",
            galleryName: "> h2",
            galleryDescriptionTitle: "> b > a", // We use the title attribute on the h2.
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
	
	// Sobia's parse Hashtag code. Defining this function at the top so that its available for ajaxURL call. 
	//TODO: Dave, need your inputs to do this in a better way. 
	
	parseHash = function (param) {
	
		   if (window.location.href.indexOf('#') !== -1) {
		   
			    var hashes = window.location.href.slice(window.location.href.indexOf('#') + 1).split('&');
			    for(var i = 0; i < hashes.length; i++) {
					hash = hashes[i].split('-');
					if (hash) {
						if (hash[0] === param) {
							return [hash[0], hash[1]]
						} 
					}
				}
		    }
	
	}

    // Initialize the gallery.
    if ( elem ) {

        var $elem = $(elem),
            ajaxSrc,
            $ajaxDiv;

        // If we are using an anchor based approach (for IE 7 performance reasons).
        if ( elem.nodeName === "A" ) {
            // Test for AJAX URL, if supplied stop everything, fetch
            // and use as content instead.
            ajaxSrc = $elem.data("ajax-url");
            if ( ajaxSrc ) {
  				//Launch Fullscreen for Ajax based gallery. URL should have #fullscreen in it for this to work. 
  				//So any page that has a ajax based gallery link, it should load the fullscreen. 
  				//This should help the AOL Music team to share the deeplink URLs with #fullscreen in it. 
            	var testHash = parseHash("fullscreen");
            		if (testHash) {
            			$.get( ajaxSrc, function( data ) {
            			    $ajaxDiv = $( data );
            			    $ajaxDiv.css("display", "none");
            			    $elem.after( $ajaxDiv );
            			    $ajaxDiv = $.aolPhotoGallery( customOptions, $ajaxDiv[0] );
            			    $ajaxDiv.trigger("fullscreen-button");
            			}, "html");
            		}
            		
                $elem.click(function(event){
                    if ( $ajaxDiv ) {
                        $ajaxDiv.trigger("fullscreen-button");
                    } else {
                        $.get( ajaxSrc, function( data ) {
                            $ajaxDiv = $( data );
                            $ajaxDiv.css("display", "none");
                            $elem.after( $ajaxDiv );
                            $ajaxDiv = $.aolPhotoGallery( customOptions, $ajaxDiv[0] );
                            $ajaxDiv.trigger("fullscreen-button");
                        }, "html");
                    }
                    event.preventDefault();
                });
                // Exit the plugin until we get the gallery HTML.
                return;
            } else {
                $elem = $elem.closest("div.aol-photo-gallery");
            }
        }

        var $aolPhotoGallery = $elem, // $aolPhotoGallery = ( elem.nodeName === "A" ) ? $(elem).closest("div.aol-photo-gallery").eq(0) : $(elem),

            $aolPhotoGalleryClone = $aolPhotoGallery.clone(), // Offline copy.

            // Options that are passable on the
            // element as data attributes.
            dataOptions = {
                preset: $aolPhotoGallery.data("preset"),
                fullscreenAdMN: $aolPhotoGallery.data("fullscreen-ad-mn"),
                sponsorAdMN: $aolPhotoGallery.data("sponsor-ad-mn"),
                fullscreenSponsorAdMN: $aolPhotoGallery.data("fullscreen-sponsor-ad-mn"),
                activePhoto: $aolPhotoGallery.data("active-photo"),
                trackingId: $aolPhotoGallery.data("tracking-id")
            },

            // Artz: We may not need this.
            presetOptions = $.extend( true, {}, defaultOptions.presetOptions, customOptions.presetOptions )[ dataOptions.preset || customOptions.preset || defaultOptions.preset ] || {},

            options = $.extend( true, {}, defaultOptions, presetOptions, customOptions, dataOptions ),

            documentElem = document.documentElement,
            body = document.body,

            ui = options.ui,
            data = options.data,
            photos = data.galleryPhotos,
            namespace = options.namespace,

            // Subtract 1 to convert from user-friendly to an index.
            activeIndex = options.activePhoto - 1,
            activePhotoId = options.activePhotoId,
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

            $anchors,
            $slides,
            $slideContainer,
            $captions,
            $captionContainer,
            $gallery,
            $fullscreen,
            $fullscreenButton,
            $status,
            $thumbnailContainer,
            $thumbnails,
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
                        $galleryDescription,

                        buildOptions = options.build,

                        control,
                        $control,

                        commands,

                        container,
                        $container,

                        name,
                        Name,

                        capitalize = function (string) {
                            return string.charAt(0).toUpperCase() + string.replace("-", "").slice(1);
                        };

                    $galleryName.click(function(event){
                        event.preventDefault();
                    });

                    data.galleryId = $aolPhotoGalleryClone.data("gallery-id") || 0;
                    data.galleryName = $galleryName.text();

                    $galleryDescription = $galleryName.find( ui.galleryDescriptionTitle );

                    // We do this for SEO reasons.  Basically we accept the description
                    // as a title attribute on the heading, or as a <div>.
                    if ( $galleryDescription.attr("title") ) {
                        data.galleryDescription = $galleryDescription.attr("title");
                        if ( options.descriptionAfter ) {
                            $aolPhotoGalleryClone.append( "<div class=\"description\">" + data.galleryDescription + "</div>" );
                        } else {
                            $galleryName.after( "<div class=\"description\">" + data.galleryDescription + "</div>" );
                        }
                    } else {
                        $galleryDescription = $aolPhotoGalleryClone.find( ui.galleryDescription );
                        data.galleryDescription = $galleryDescription.html();
                        if ( options.descriptionAfter ) {
                            $aolPhotoGalleryClone.append( $galleryDescription );
                        }
                    }

                    $anchors = ui.$anchors = $aolPhotoGalleryClone.find( ui.anchors );
                    $slides = ui.$slides = $aolPhotoGalleryClone.find( ui.slides );
                    $slideContainer = ui.$slideContainer = $slides.parent();

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
                                photoCredit = $anchorElem.data("credit"),
                                photoCreditURL = $anchorElem.data("credit-url"),
                                photoId = $anchorElem.data("media-id");

                            // Allows us to set the active index based on the Media ID.
                            if ( activePhotoId == photoId ) {
                                activeIndex = i;
                            }

                            photos.push({
                                photoName: photoName,
                                photoDescription: photoDescription,
                                photoSrc: photoSrc,
                                photoCredit: photoCredit,
                                photoCreditURL: photoCreditURL,
                                photoId: photoId
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

                        if ( options.trackingId ) {
                            $aolPhotoGalleryClone.addClass( namespace + "-" + options.trackingId );
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

                        // Move this to core.buildControls();
                        for ( control in buildOptions ) {
                            if ( buildOptions.hasOwnProperty( control ) && buildOptions[control] ) {

                                name = control.toLowerCase();
                                Name = capitalize( name );

                                commands = buildOptions[ control ].split(" ");

                                container = commands[0];
                                $container = ui[ "$" + container ];

                                if ( ! $container ) {
                                    $container = ui[ "$" + container ] = $("<ul class=\"" + container + "\"></ul>");

                                    // The following is similar to the following example:
                                    // ui.$gallery.after( $container );
                                    ui[ commands[3] ][ commands[2] ]( $container );
                                }

                                $control = $("<li class=\"" + name + "\">" + options.template[ name ] + "</li>");

                                ui[ "$" + name ] = $control;

                                // $container.append( $control );
                                $container[ commands[1] ]( $control );

                                // If a core build function exists, execute it.
                                if ( core[ "build" + Name ] ) {
                                    core[ "build" + Name ]();
                                }
                            }
                        }

                        core.bindControls();


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

                buildWallpaperbutton: function(){
                    core.buildWallpaper();
                },

                buildWallpaper: function(){

                    var wallpaperSizes = options.wallpaperSizes,
                        wallpaperWidth,
                        wallpaperHeight,
                        wallpaperHTML = ["<ul>"],
                        screenHeight = screen.height,
                        screenWidth = screen.width,
                        i, l;

                    $wallpaperButton = ui["$wallpaper-button"];

                    if ( options.showCurrentWallpaper ) {
                        wallpaperHTML.push(
                            ["<li data-width=\"",
                            screenWidth,
                            "\" data-height=\"",
                            screenHeight,
                            "\">",
                            screenWidth,
                            template.wallpaperSeparator,
                            screenHeight,
                            " (Current)</li>"].join("") );
                    }

                    for ( i = 0, l = wallpaperSizes.length; i < l; i++ ) {

                        wallpaperWidth = wallpaperSizes[i].width;
                        wallpaperHeight = wallpaperSizes[i].height;
                        wallpaperHTML.push(
                            ["<li data-width=\"",
                            wallpaperWidth,
                            "\" data-height=\"",
                            wallpaperHeight,
                            "\">",
                            wallpaperWidth,
                            template.wallpaperSeparator,
                            wallpaperHeight,
                            "</li>"].join("") );
                    }

                    if ( options.showOriginalWallpaper ) {
                        wallpaperHTML.push(
                        ["<li data-width=\"full\" data-height=\"full\">",
                        template.wallpaperOriginal,
                        "</li>"].join("") );
                    }

                    wallpaperHTML.push("</ul>");

                    $wallpaperButton.append( wallpaperHTML.join("") );

                    core.bindWallpaper();
                },

                bindWallpaper: function(){

                    var $wallpaperList = $wallpaperButton.find("> ul");

                    $wallpaperButton.bind("mouseenter." + namespace, function(){
                        $wallpaperList.slideDown( speed / 2 );
                    });

                    $wallpaperButton.bind("mouseleave." + namespace, function( event ){
                        $wallpaperList.slideUp( speed / 2 );
                    });

                    $wallpaperButton.delegate("ul > li", "click." + namespace, function(){

                        var $wallpaperLink = $(this),
                            wallpaperWidth = $wallpaperLink.data("width"),
                            wallpaperHeight = $wallpaperLink.data("height");

                        // Trigger the event if anyone cares.
                        $wallpaperLink.trigger( "wallpaper-download." + namespace, [{ width: wallpaperWidth, height: wallpaperHeight }] );

                    });

                    $aolPhotoGalleryClone.bind( "wallpaper-download." + namespace, function( event, data ) {

                        var photo = photos[ activeIndex ];

                        if ( photo ) {
                            photoSrc = photo.photoSrc;

                            if ( data.width === "full" ) {
                                location.href = photoSrc;
                            } else {
                                location.href = $.getDynamicImageSrc( photoSrc, data.width, data.height, options.wallpaperCrop );
                            }

                        }

                    });

                },

                buildCredits: function(){
                    // Credits just hang out in one of the other UI containers.
                    var creditTemplate = template.credit,
                        $creditParent = ui[ options.creditInside ],
                        photoCredit,
                        photoCreditURL;

                    if ( $creditParent ) {
                        $creditParent.each(function(i){
                            photoCredit = photos[i].photoCredit;
                            if ( photoCredit ) {
                                photoCredit = creditTemplate.replace("{{credit}}", photos[i].photoCredit );
                                photoCreditURL = photos[i].photoCreditURL;
                                if ( photoCreditURL ) {
                                    photoCredit = "<a href=\"" + photoCreditURL + "\">" + photoCredit + "</a>";
                                }
                                if ( options.creditAfter ) {
                                    $creditParent.eq(i).append("<div class=\"credit\"><i>" + photoCredit + "</i></div>");
                                } else {
                                    $creditParent.eq(i).prepend("<div class=\"credit\"><i>" + photoCredit + "</i></div>");
                                }
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

                        if ( photo ) {

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
                        $nodeNext,
                        i = 0;

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
                        for (; i < carouselSiblings; i++ ) {

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

                    activePosition = ( galleryWidth - $slide.width() )/2 - $slide.position().left;

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

                    var fullscreenHTML = "<div class=\"aol-photo-gallery-fullscreen\"><div class=\"fullscreen\"><div class=\"close-button\"><b>Close</b></div><div class=\"aside\"></div></div></div>";

                    // Create the full screen backdrop <div>
                    $fullscreen = ui.$fullscreen = $( fullscreenHTML );

                    $fullscreen.css({
                        opacity: 0
                    });

                    // Insert it after the <body>
                    $fullscreen.prependTo( body );

                    core.bindFullscreen();
                },

                buildFullscreenbutton: function(){
                    $fullscreenButton = ui["$fullscreen-button"];
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

                    $aolPhotoGalleryClone.delegate(".fullscreen-button", "mousedown", function(){
                        $(this).trigger("fullscreen-button." + namespace);
                    });

                    // Mousedown feels faster.
                    $aolPhotoGalleryClone.bind("fullscreen-button." + namespace, function(){

                        bodyElemWidth = body.offsetWidth || 0;
                        bodyElemHeight = body.offsetHeight || 0;
                        htmlElemWidth = documentElem.offsetWidth || 0;
                        htmlElemHeight = documentElem.offsetHeight || 0;
                        documentHeight = document.height || 0;
                        documentWidth = document.width || 0;

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
                        }, speed * 1.5);

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

                            // Ensure display is block for AJAX load.
                            $fullscreenPhotoGallery.css("display", "block");

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

                            // Build the Thumbnail Carousel only on Fullscreen mode:
                            // TODO: Make this work in non-fullscreen mode too.
                            if ( options.buildThumbCarousel ) {
                                	core.buildThumbCarousel( "fullscreen" );
                            }

                        } else {

                            // If we're already initialized, we need to ensure
                            // to set to the current active index.
                            $aolPhotoGalleryClone.trigger("fullscreen-open." + namespace, [{ index: activeIndex }]);

                        }

                                        });

                    $fullscreen.delegate(".close-button", "mousedown", function(){
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
                    
                    // Sobia's code for fullscreen hash tag.
                    var testHash = parseHash("fullscreen");
                    if (testHash) {
                    	if (testHash[0] === "fullscreen") {
                    		$fullscreenButton.trigger("fullscreen-button." + namespace);
                    	}
                    }


        /*
                    // If the toggle feature is present, add those bindings.
                    if ( options.toggleThumbnails ) {

                        $aolPhotoGalleryClone.bind("thumbnails-button." + namespace, function(){
                    //		$fullscreenButton.css("visibility", "hidden");
                        });

                        $aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
                            $fullscreenButton.css({
                    //			"visibility": "visible"
                            });
                        });
                    }
        */
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

                    // If we have fewer photos, we need to adjust the siblings if needed.
                    if ( totalPhotos < carouselSiblings * 2 + 1 ) {
                        carouselSiblings = parseInt( ( totalPhotos - 1 ) / 2, 10 );
                    }

                    if ( isCarousel ) {

                        // Artz: Does this remove the active ever? Probalby..jsut checking.
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
                    if ( isCarousel ) {
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
                            var $elem = $(this);
                            if ( options.preset === "launch" ) {
                                $elem.trigger("fullscreen-button." + namespace);
                            } else {
                                $elem.trigger("next-mousedown." + namespace);
                            }
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

                        $aolPhotoGalleryClone.bind("thumbnails-button." + namespace, function(){
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

                    // Need to move this into its own function. 
                    // Let's tie this with captions for now.
                    if ( options.contentsInRightRail ) {
                    		var $aside = $('div.aside');
                    					
                    		if ($aside.length !== 0) {
                    				$aside.prepend( $captions );
                    				$aside.prepend( $aolPhotoGalleryClone.find('.description') );
                    				$aside.prepend( ui.$galleryName );
                    			}
                    					
                    } else if ( options.captionsAfter ) {
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
//					console.log( $captions.parent() );

            //		if ( ! options.showThumbnails ) {
                        // Need to make this tweak in the next UI thread.
                        setTimeout(function(){
                            $captionContainer.height( $captions.eq( activeIndex ).height() );
                            //	.width( $captionContainer.width() );

                        }, 0);
            //		}

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
                            $oldCaption = $captions.eq( oldIndex ),
                            $activeCaption = $captions.eq( activeIndex );

                        $oldCaption.css({
                            zIndex: 0
                        }).animate({
                            opacity: 0
                        }, speed);

                        $activeCaption.css({
                            visibility: "visible",
                            opacity: 0,
                            zIndex: 1
                        }).animate({
                            opacity: 1
                        }, speed);
                        
                        $captionContainer.animate({
                            height: $activeCaption.height()
                        }, { duration: speed, queue: false } );

                    });

                    // If the toggle feature is present, add those bindings.
                    if ( options.toggleThumbnails ) {
                        $aolPhotoGalleryClone.bind("thumbnails-button." + namespace, function(){
                            $captionContainer.animate( { "opacity": 0 }, { duration: speed, queue: false } );
                        });
                        $aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(event, data){

                            // We do this here instead of status update because status update
                            // doesn't fire if we click the same thumbnail we're on.
                            var $activeCaption = $captions.eq( data.index );

                            $activeCaption.css({
                                visibility: "visible",
                                opacity: 0,
                                zIndex: 1
                            }).animate({
                                opacity: 1
                            }, speed);

                            $captionContainer.animate({
                                height: $activeCaption.height()
                            }, { duration: speed, queue: false } );

                            $captions.eq( activeIndex ).css( "opacity", 0 );
                            $captionContainer.animate( {"opacity": 1 }, { duration: speed, queue: false } );
                        });
                    }

                },

                buildStatus: function(){

                    var statusTemplate = template.status.replace("{{active}}", activeIndex + 1).replace("{{total}}", totalPhotos);

                    $status = ui.$status;

                    $status.html( statusTemplate );

                    // We still need Status to live in the DOM.
                    if ( ! options.showStatus ) {

                        $status.hide();

                    // If we need to show thumbnails by default and
                    // hide the status, do so now.
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
            /*
                    // If the toggle feature is present, add those bindings.
                    if ( options.toggleThumbnails ) {

                        $aolPhotoGalleryClone.bind("thumbnails-button." + namespace, function(){
                            $status.css("visibility", "hidden");
                        });

                        $aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
                            $status.css({
                                "display": "block",
                                "visibility": "visible"
                            });
                        });

                    }
            */
                },

                buildNextbutton: function(){
                    // If we need to show thumbnails by default and
                    // hide the next button, do so now.
                    // Also hide it if there's only 1 photo.
                    if ( ( options.showThumbnails && options.toggleThumbnails ) || totalPhotos === 1 ) {
                        ui["$next-button"].hide();
                    }
                    core.bindNextbutton();
                },

                bindNextbutton: function(){
                    $aolPhotoGalleryClone.delegate(".next-button", "mousedown." + namespace, function(){
                        $(this).trigger("next-mousedown." + namespace);
                    });
                    $aolPhotoGalleryClone.delegate(".next-button", "mouseover." + namespace, function(){
                        $(this).trigger("next-mouseover." + namespace);
                    });
                },

                buildBackbutton: function(){
                    // If we need to show thumbnails by default and
                    // hide the back button, do so now.
                    // Also hide it if there's only 1 photo.
                    if ( ( options.showThumbnails && options.toggleThumbnails ) || totalPhotos === 1 ) {
                        ui["$back-button"].hide();
                    }
                    core.bindBackbutton();
                },

                bindBackbutton: function(){
                    $aolPhotoGalleryClone.delegate(".back-button", "mousedown." + namespace, function(){
                        $(this).trigger("back-mousedown." + namespace);
                    });
                    $aolPhotoGalleryClone.delegate(".back-button", "mouseover." + namespace, function(){
                        $(this).trigger("back-mouseover." + namespace);
                    });
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
                    if ( options.toggleThumbnails ) {
                        $gallery.prepend( $thumbnailContainer );
                    } else {
                        if ( options.thumbnailAfter ) {
                            $aolPhotoGalleryClone.append( $thumbnailContainer );
                        } else {
                            $gallery.before( $thumbnailContainer );
                        }
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


                        core.buildShowthumbnails();
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

                        $aolPhotoGalleryClone.bind("thumbnails-button." + namespace, function(){

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
                                "top": 0,
                                "left": $gallery.width()
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

                buildThumbCarousel: function( view ) {
                
                	if ( view === "fullscreen" ) {
                		$view = ui.$fullscreen
                	} else {
                		$view = $aolPhotoGalleryClone;
                	}
					
                    var $thumbnailContainer = $view.find('ul.thumbnails'),
                        $thumbnailContainerParent = "<div class=\"thumbnail-container\"><div class=\"thumbnail-container-inner\"></div><ul class=\"thumbnail-carousel-controls\"><li class=\"thumbnail-prev\">Back</li><li class=\"thumbnail-next\">Next</li></ul></div>",
                        thumbCarouselOptions = options.thumbCarouselOptions;
                        

                    var isAnimating = false,
                        $thumbnailItems = $thumbnailContainer.find("li"),
                        totalImages = $thumbnailItems.size(),
                        sizeFirstElmnt = $thumbnailItems.first().outerWidth(true),
                        scroll = thumbCarouselOptions.scrollNumImages,
                        startImage = thumbCarouselOptions.startImage,
                        animateSpeed = thumbCarouselOptions.animateSpeed,
                        current,
                        visible = Math.round($thumbnailContainer.width() / sizeFirstElmnt);
                    
                    // Build the thumbnail carousel, only if there are more images beyond the thumbnail container width.     
					if ( totalPhotos >= visible ) {
						$thumbnailContainer.wrap($thumbnailContainerParent);
	                    // Clone items for the infinite carousel..
	                    $thumbnailContainer.prepend($thumbnailItems.slice(totalImages-visible-1+1).clone()).append($thumbnailItems.slice(0,visible).clone());
	                    startImage += visible;
	                    
	                    // Adding the styles for the thumbnail containers via JS itself. Dont want to modify the CSS file for it ;) 
	                    $(".thumbnail-container, .thumbnail-container-inner").css("overflow", "hidden");
	
	                    //After Cloning, we need to get the new count of the thumbnails..
	                    var $newThumbnailItems = $thumbnailContainer.find("li"),
	                        itemLength = $newThumbnailItems.size(),
	                        ulWidth = sizeFirstElmnt * itemLength;
	                        current = startImage;
	
	                    $thumbnailContainer.css({
	                                        width : ulWidth+"px",
	                                        position: "relative",
	                                        left : -(current*sizeFirstElmnt)
	                                        });
	
	                    $view.delegate(".thumbnail-prev", "mousedown." + namespace, function(){
	                            var activeCount = current-scroll;
	
	                            if(!isAnimating) {
	                                if ( activeCount <= startImage-visible-1 ) { // If first, then goto last
	                                         $thumbnailContainer.css("left", -((itemLength-(visible*2))*sizeFirstElmnt)+"px");
	
	                                         current = (activeCount==startImage-visible-1) ? itemLength-(visible*2)-1 : itemLength-(visible*2)-scroll;
	                                } else if (	activeCount>=itemLength-visible+1 ) { // If last, then goto first
	                                         $thumbnailContainer.css("left", -( (visible) * sizeFirstElmnt ) + "px" );
	
	                                         current = (activeCount==itemLength-visible+1) ? visible+1 : visible+scroll;
	                                } else   current = activeCount;
	
	                                isAnimating = true;
	
	                                $thumbnailContainer.animate({
	                                            left: -(current*sizeFirstElmnt)
	                                                }, animateSpeed,
	                                                function() { isAnimating = false;}
	                                        );
	                                    }
	                                return false;
	
	                    });
	
	                    $view.delegate(".thumbnail-next", "mousedown." + namespace, function(){
	                            var activeCount = current+scroll;
	
	                            if(!isAnimating) {
	                                if ( activeCount <= startImage-visible-1 ) { // If first, then goto last
	                                         $thumbnailContainer.css("left", -((itemLength-(visible*2))*sizeFirstElmnt)+"px");
	
	                                         current = (activeCount==startImage-visible-1) ? itemLength-(visible*2)-1 : itemLength-(visible*2)-scroll;
	                                } else if (	activeCount>=itemLength-visible+1 ) { // If last, then goto first
	                                         $thumbnailContainer.css("left", -( (visible) * sizeFirstElmnt ) + "px" );
	
	                                         current = (activeCount==itemLength-visible+1) ? visible+1 : visible+scroll;
	                                } else   current = activeCount;
	
	                                isAnimating = true;
	
	                                $thumbnailContainer.animate({
	                                            left: -(current*sizeFirstElmnt)
	                                                }, animateSpeed,
	                                                function() { isAnimating = false;}
	                                        );
	                                    }
	                                return false;
	
	                    });
                  } else {
                      if ( window.console ) {
                          console.info("jQuery.aolPhotoGallery: Not enough photos to build the thumbnail carousel");
                      }
                  }
                },

                bindControls: function(){

                    var $bottomRight = ui["$bottom-right"],
                        $bottomLeft = ui["$bottom-left"],
                        $bottomCenter = ui["$bottom-center"],
                        $topRight = ui["$top-right"],
                        $topLeft = ui["$top-left"],
                        $topCenter = ui["$top-center"];

                    // Listen for certain things and hide the controls.
                    $aolPhotoGalleryClone.delegate(".thumbnails-button", "mousedown", function(){

                        $aolPhotoGalleryClone.css("overflow", "hidden");

                        // Slide the bottom right controls right.
                        if ( $bottomRight ) {
                            $bottomRight.animate({
                                left: $bottomRight.outerWidth() + 1
                            }, speed);
                        }

                        // Slide the top right controls right.
                        if ( $topRight ) {
                            $topRight.animate({
                                left: $topRight.outerWidth() + 1
                            }, speed);
                        }

                        if ( $bottomLeft ) {
                            $bottomLeft.animate({
                                left: 0 - ($bottomLeft.outerWidth() + 1)
                            }, speed);
                        }

                        if ( $topLeft ) {
                            $topLeft.animate({
                                left: 0 - ($topLeft.outerWidth() + 1)
                            }, speed);
                        }

                        if ( $topCenter ) {
                            $topCenter.fadeOut(speed);
                        }
                        if ( $bottomCenter ) {
                            $bottomCenter.fadeOut(speed);
                        }

                    });

                    // Listen for certain things and show the controls.
                    $aolPhotoGalleryClone.delegate(".thumbnails > li", "mousedown", function(){

                        setTimeout(function(){
                            $aolPhotoGalleryClone.css("overflow", "visible");
                        }, speed);

                        // Slide the bottom right controls right.
                        if ( $bottomRight ) {
                            $bottomRight.animate({
                                left: 0
                            }, speed);
                        }

                        // Slide the top right controls right.
                        if ( $topRight ) {
                            $topRight.animate({
                                left: 0
                            }, speed);
                        }

                        if ( $bottomLeft ) {
                            $bottomLeft.animate({
                                left: 0
                            }, speed);
                        }

                        if ( $topLeft ) {
                            $topLeft.animate({
                                left: 0
                            }, speed);
                        }

                        if ( $bottomCenter ) {
                            $bottomCenter.fadeIn(speed);
                        }

                        if ( $topCenter ) {
                            $topCenter.fadeIn(speed);
                        }

                    });

                    // Ramesh: Keyboard shortcuts for next (right arrow), back (left arrow) and escape keys.

                    $(documentElem).keyup(function(event){
                        if (event.keyCode == 39) {
                            $aolPhotoGalleryClone.trigger("next-mousedown." + namespace);
                        }

                        if (event.keyCode == 37) {
                            $aolPhotoGalleryClone.trigger("back-mousedown." + namespace);
                        }
                        
                        if (event.keyCode == 27) {
                        	// Close the fullscreen, if esc key is pressed. 
                        	if ( $fullscreen ) {
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
                        	}
                        }
                    });
                },

// Artz: Move this into thumbnails?
                buildShowthumbnails: function(){
/*
                    $showThumbnails = ui["$thumbnails-button"];

                    if ( options.showThumbnails ) {
                        $showThumbnails.css("visibility", "hidden");
                    } else {
                        $showThumbnails.css("visibility", "visible");
                    }
*/
                    core.bindShowthumbnails();
                },

                bindShowthumbnails: function(){

                    $aolPhotoGalleryClone.delegate( ".thumbnails-button", "mousedown." + namespace, function(){
                        $aolPhotoGalleryClone.trigger( "thumbnails-button." + namespace );
                    });
/*
                    $aolPhotoGalleryClone.bind("thumbnails-button." + namespace, function(){
                        ui["$thumbnails-button"].css("visibility", "hidden");
                    });

                    $aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
                        ui["$thumbnails-button"].css("visibility", "visible");
                    });

                    // If the toggle feature is present, add those bindings. Artz: Not necessary?
                    // if ( options.toggleThumbnails ) {
                    // Artz: We will probably want a generic way to quickly hide all controls.
                    $aolPhotoGalleryClone.bind("thumbnails-button." + namespace, function(){
                        ui["$thumbnails-button"].css("visibility", "hidden");
                    });

                    $aolPhotoGalleryClone.bind("thumbnail-mousedown." + namespace, function(){
                        ui["$thumbnails-button"].css({
                            "display": "block",
                            "visibility": "visible"
                        });
                    });
*/
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
                            // If we are in fullscreen, our sponsor ad needs to be the fullscreen sponsor ad MN.
                            var sponsorAdMN = ui.$parentGallery ? options.fullscreenSponsorAdMN : options.sponsorAdMN;

                            htmlAdWH( sponsorAdMN, options.sponsorAdWidth, options.sponsorAdHeight, "ajax", sponsorAdId );
                        }, 0);
                    }

                }

            },

            // Localize core functions for performance.
            getIndex = core.getIndex,

            // Variable used to indicate we need to tell
            // Omniture this page view refreshed an ad.
            reportAdImpressionInOmniture = 0,

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

                        // Tell Omniture we need to report the impression.
                        reportAdImpressionInOmniture = 1;

                        // Increment our status counter.
                        refreshStatus++;

                        // If we are at the limit, time to refresh and reset.
                        if ( refreshStatus === refreshCount ) {

                            if ( window.adsReloadAd ) {
                                refreshStatus = 0;
                                // Set a timeout so that it doesn't interfere
                                // with our transition animation.
                                setTimeout(function(){
                                    adsReloadAd( refreshDivId );
                                }, speed);
                            }
                            // Artz: Consider throwing an error here.
                        }

                    });
                }

            },
          
            initDeepLinking = function(){
            			
            				var testHash = parseHash(deepLinkHashName);
            				if (testHash) {
            					if (testHash[0] === deepLinkHashName) {
            						activePhotoId = parseHash(deepLinkHashName)[1];
            					}
            				}
            
            
            				
            				var pattern = new RegExp( deepLinkHashName + "-[0-9]+" ),
            					matches = pattern.exec( location.href );
            				
            				$aolPhotoGalleryClone.bind("status-update." + namespace, function(event, data){
            					
            					// Attempt to use Media ID, fall back to photo number.
            					var photoId = photos[ activeIndex ].photoId || data.activeIndex + 1, 
            						href = location.href,
            						
            						
            						deepLinkHash = deepLinkHashName + "-" + photoId;
            						
            
            					if ( pattern.test( href ) ) {
            						
            						location.replace( href.replace( pattern, deepLinkHash ) );
            					
            					} else {
            						if (window.location.href.indexOf('#') !== -1)  {
            						
            						location.replace( href + '&' + deepLinkHash );
            						
            						} else {
            						
            						location.replace( href + '#' + deepLinkHash );
            						
            						
            						}
            						
            						
            					}
            					
            				});
            		
            				
            		
            		
            				// Override the default active index with 
            				// the one found in the hash.
            				//if ( matches ) {
            					// activeIndex = matches[0].replace( "#" + deepLinkHashName + "-", "" ) - 1;
            					//activePhotoId = parseInt( matches[0].replace( "#" + deepLinkHashName + "-", "" ), 10 );
            				//}
            				
            },

            initTracking = function(){

                    // Whenever there's a status update, let's fire a page view.
                    $aolPhotoGalleryClone.bind("status-update." + namespace, function(){

                        var updateArea = $aolPhotoGalleryClone.width() * $aolPhotoGalleryClone.height(),
                            omnitureConfig = {
                                pageName: data.galleryName,
                                prop1: options.preset || "default",
                                prop2: "gallery",
//								prop6custom: "", // Sponsorship info
                                prop9: "bsg:" + data.galleryId,
                                channel: options.trackingId,
                                isInternational : options.isInternational
//								prop11: "" // Ad refresh MN
//								channel: "" // Currently disabled, if needed we can make it a metadata option.
                            };

                        if ( reportAdImpressionInOmniture && options.fullscreenAdMN ) {
                            omnitureConfig.prop11 = options.fullscreenAdMN;
                        }

                        // Check for Comscore page refresh requirements.
                        if ( updateArea > ( trackingArea * trackingRatio ) ) {

                            // Call our tracking after animations complete.
                            setTimeout(function(){

                                // Pass in information about this gallery.
                                //$.omniView( omnitureConfig );
                                //$.comscoreView( omnitureConfig );

                                $.mmTrack( omnitureConfig );

                            }, speed);

                        } else {

                            if ( window.console ) {
                                console.info("jQuery.aolPhotoGallery: Gallery not large enough for Comscore PV tracking.");
                            }

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

        // Return
        return $aolPhotoGalleryClone;
    // Otherwise, extend the default options.
    } else {
        $.extend( true, defaultOptions, customOptions );
    }

};

$.fn.aolPhotoGallery = function( customOptions ){

    customOptions = customOptions || {};
    // Since these point to the original DOM nodes,
    // we may want to reset the pointers.
    return this.each(function(){
        $.aolPhotoGallery( customOptions, this );
    });

};

})(jQuery, window, document, location);

/*
    Creates an mm_track URL, used for tracking page views to Comscore.
*/
(function( $, window, document, location ){

    var encode = encodeURIComponent,
        // isSandbox = /\.sandbox\./.test(hostname),
        // isSandbox = /\.sandbox\./.test(hostname) && hostname !== "omniture.sandbox.platform.aol.com",

        protocol = location.protocol,
        host = location.hostname,

        isSandbox = /\.sandbox\./.test(host), // Disable tracking in developer sandboxes.

        mmTrackIframe,
        mmTrackIframeStyle;

    $.mmTrack = function( omnitureConfig ) {
        if ( isSandbox ) {
            if ( window.console ) {
                console.info("jQuery.mmTrack: Comscore tracking is disabled in sandbox.");
            }
        } else {

            var	omnitureObj = window.s_265,
                omnitureAccount = "",
                omnitureChannel = "",
                omnitureProp1 = "",
                omnitureProp2 = "",
                omnitureEnabled = "",
                omniturePageName = "?title=" + encode( document.title ),
                mmTrackUrl;

            if ( omnitureObj || omnitureConfig ) {

                if ( omnitureConfig.isInternational ) {
                    // Merged prop17 and prop21 with omni=2, which will get initiated only on International blogs.
                    // Passing the pfxID value to mm_track via GET vars - Ramesh Kumar
                    omnitureEnabled = "&omni=2&pfxID=" + omnitureObj.pfxID + "&sprop17=" + omnitureObj.prop17 + "&sprop21=" + omnitureObj.prop21;
                } else {
                    omnitureEnabled = "&omni=1";
                }

                // Set Omniture account
                if ( omnitureConfig.s_account ) {
                    omnitureAccount = "&s_account=" + omnitureConfig.s_account;
                } else if ( window.s_account ) {
                    omnitureAccount = "&s_account=" + window.s_account;
                }

                // Set Omniture channel
                if ( omnitureConfig.channel ) {
                    omnitureChannel = "&s_channel=" + omnitureConfig.channel;
                } else if ( omnitureObj.channel ) {
                    omnitureChannel = "&s_channel=" + omnitureObj.channel;
                }

                // Set Omniture Prop 1
                if ( omnitureConfig.prop1 ) {
                    omnitureProp1 = omnitureConfig.prop1 + "/";
                } else if ( omnitureObj.prop1 ) {
                    omnitureProp1 = omnitureObj.prop1 + "/";
                }

                // Set Omniture Prop 2
                if ( omnitureConfig.prop2) {
                    omnitureProp2 = omnitureConfig.prop2 + "/";
                } else if ( omnitureObj.prop2 ) {
                    omnitureProp2 = omnitureObj.prop2 + "/";
                }

                // Set Omniture Page Name
                if ( omnitureConfig.pageName ) {
                    omniturePageName = "?title=" + encode( omnitureConfig.pageName );
                } else if ( omnitureObj.channel ) {
                    omniturePageName = "?title=" + encode( omnitureObj.pageName );
                }

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

            mmTrackUrl = [
                protocol,
                "//",
                host,
                "/mm_track/",
                omnitureProp1,
                omnitureProp2,
                omniturePageName,
                omnitureEnabled,
                omnitureAccount,
                omnitureChannel].join("");

//			console.log( mmTrackUrl );

            mmTrackIframe.src = mmTrackUrl + "&ts=" + +new Date();

        }
    };

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
        quality : 85
    }, settings);

    dimensions = photoWidth + "x" + photoHeight;
    action = (thumbnail && typeof thumbnail !== "object") ? "thumbnail" : options.action;
    modifiers = "/quality/" + options.quality;

    if ( options.crop ) {
        dimensions += "+" + ( options.crop.x || 0 ) + "+" + ( options.crop.y || 0 );
    }

    if ( options.format ) {
        modifiers += "/format/" + options.format;
    }

    return "http://o.aolcdn.com/dims-global/dims3/GLOB/" + action + "/" + dimensions + modifiers + "/" + photoSrc;
};

})(jQuery);
