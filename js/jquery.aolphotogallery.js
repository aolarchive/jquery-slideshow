/*
	AOL Photo Gallery Module
	@author David Artz
	@since 1/21/2011
*/
(function($){

var defaultOptions = {

		photoWidth: 600,//"auto",
		photoHeight: 456,//"auto",
		thumbnailWidth: 75,
		thumbnailHeight: 75,
		
		activePhoto: 1,
		adRefreshCount: 9,
		ui: {
		/*	slides: "> .photos",
			images: "> .photos > a", */
			galleryName: "> h2",
			galleryDescription: "> .description",
			anchors: "> .photos > li > a"
		},
	
		data: {
			galleryPhotos: []
		}

	};

$.aolPhotoGallery = function( customOptions, elem ){
	// Initialize the gallery.
	if ( elem ) {
		
		var options = $.extend( true, {}, defaultOptions, customOptions ),
		
			$aolPhotoGallery = $(elem),
			$aolPhotoGalleryClone = $aolPhotoGallery.clone(), // Offline copy.
			
			ui = options.ui,
			data = options.data,
			photos = data.galleryPhotos,
			
			// Subtract 1 to convert from user-friendly to an index.
			activePhoto = options.activePhoto - 1, 
			
			photoWidth = options.photoWidth,
			photoHeight = options.photoHeight,
			thumbnailWidth =  options.thumbnailWidth,
			thumbnailHeight = options.thumbnailHeight,
			
			$slides,
			$images,
			$anchors,
			
			photoSources = [],
			
			core = {
				
				init: function(){
					
					var galleryName = data.galleryName = $aolPhotoGalleryClone.find( ui.galleryName ).text(),
						galleryDescription = data.galleryDescription = $aolPhotoGalleryClone.find( ui.galleryDescription ).html();
					
					$anchors = ui.$anchors = $aolPhotoGalleryClone.find( ui.anchors );
					
					$anchors.each(function(i){
						
						var anchorElem = this,
							$anchorElem = $(anchorElem),
							
							photoName = $anchorElem.text(),
							photoDescription = $anchorElem.attr("title"),
							photoSrc = $anchorElem.attr("data-photo-src");
						
						// Save the details of this photo for later.

						photos.push({
							photoName: photoName,
							photoDescription: photoDescription,
							photoSrc: photoSrc
						});
						
					});
					
					core.buildGallery();
					
					$aolPhotoGallery.replaceWith( $aolPhotoGalleryClone );
				},
				
				getDynamicImageSrc: function( src, width, height, quality ) {
					return src;
				},
				
				buildPhoto: function(i){
					
					var photo = photos[i],
						photoName = photo.photoName,
						photoDescription = photo.photoDescription,
						photoSrc = photo.photoSrc,
						
						$photo = $("<img src=\"" + core.getDynamicImageSrc( photoSrc, photoWidth, photoHeight ) + "\" />");
					
					return $photo;
				},
				
				buildGallery: function(){
					console.log( ui.$anchors[ activePhoto ] );
					// Set up the active photo.
					ui.$anchors.eq( activePhoto ).replaceWith( core.buildPhoto( activePhoto ) );
					
				}
				
			};
			
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
	
})(jQuery);