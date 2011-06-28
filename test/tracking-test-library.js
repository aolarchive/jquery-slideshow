
/*
	This function registers a page view for Comscore.
*/
(function($, document, location){
$.comscoreView = function( options ) {
	
	var encode = encodeURIComponent,
		hostname = location.hostname,
		isSandbox = /\.sandbox\./.test(hostname),
		
		omnitureObj = window.s_265 || {},
		
		omnitureProp1 = options.prop1 || omnitureObj.prop1,
		omnitureProp2 = options.prop2 || omnitureObj.prop2,
		omniturePageName = options.pageName || document.title,
		omnitureChannel = options.channel || omnitureObj.channel,

		url; 
		
	// Disable tracking in developer sandboxes.	
	if ( isSandbox ) {
		if ( window.console ) {
			console.info("jQuery.mmTrack: Comscore tracking is disabled in sandbox.");
		}
	} else {
		
		url = [ location.protocol, 
				"//",
				hostname,
				"/mm_track/",
				omnitureProp1 ? omnitureProp1 + "/" : "",
				omnitureProp2 ? omnitureProp2 + "/" : "",
				omniturePageName ? "?title=" + encode( omniturePageName ) : "",
				omnitureChannel ? "&s_channel=" + omnitureChannel : ""
			].join("");
			
		$.get( url );
		
	}
/*
http://www.stylelist.com/mm_track/Fashion%7CCelebrity%7CNews%7CCelebrity%20Style/Article/?title=%5Bstylelist-stylelist_look_of_the_day%5D%20Look%20of%20the%20Day%3A%20Vanessa%20Hudgens%20-%20StyleList&omni=1&s_account=aolstylist,aolsvc&s_channel=us.style&pfxID=sty&ts=49924991
*/
};
})(jQuery, document, location);

/*

What needs to happen is this:
 
•  store page-level properties for s_265 into the temp object
•  destroy all properties on s_265  (this prevents bleed over between page views)
•  populate the s_265 properties that are specific to photo galleries
•  trigger the s_265.t() call
•  destroy all properties on s_265
•  re-populate s_265 with properties from temp object

*/
(function($, window){
$.omniView = function( options ){

	var omnitureObj = window.s_265,
		tempObj = {},
		prop;
	
	options = options || {};
	
	if ( omnitureObj ) {
		
		for ( prop in omnitureObj ) {
			if ( omnitureObj.hasOwnProperty( prop ) ) {
				var type = typeof omnitureObj[ prop ];
				if ( type !== "function" && type !== "object" ) {
					console.log( prop + " : " + omnitureObj[ prop ] );
				}
			}
		}
		
		// Temporarily save the original options to 
		// an object and set the new option.
/*		for ( prop in options ) {
			if ( options.hasOwnProperty( prop ) ) {
				tempObj[prop] = omnitureObj[prop];
				omnitureObj[prop] = options[prop];
			}
		}*/
		
		// Trigger an Omniture page view.
	//	omnitureObj.t();
		
		// Set the original values back to normal.
/*		for ( prop in options ) {
			if ( options.hasOwnProperty( prop ) ) {
				omnitureObj[prop] = tempObj[prop];
			}
		}*/
	}
};
// $.omniView(); // Test view.
})(jQuery, window);
/*
	This function registers a page view in Omniture
	and temporarily maps over settings on the s_265 object.
*/
/*
(function($, window){
$.omniView = function( options ){

	var omnitureObj = window.s_265,
		tempObj = {},
		prop;
	
	options = options || {};
	
	if ( omnitureObj ) {
		
		// Temporarily save the original options to 
		// an object and set the new option.
		for ( prop in options ) {
			if ( options.hasOwnProperty( prop ) ) {
				tempObj[prop] = omnitureObj[prop];
				omnitureObj[prop] = options[prop];
			}
		}
		
		// Trigger an Omniture page view.
		omnitureObj.t();
		
		// Set the original values back to normal.
		for ( prop in options ) {
			if ( options.hasOwnProperty( prop ) ) {
				omnitureObj[prop] = tempObj[prop];
			}
		}
	}
};
// $.omniView(); // Test view.
})(jQuery, window);
*/
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

	if (options.crop) {
		dimensions += "+" + (options.crop.x || 0) + "+" + (options.crop.y || 0);
	}
	
	if (options.format) {
		modifiers += "/format/" + options.format;
	}
		
	return "http://o.aolcdn.com/dims-global/dims3/GLOB/" + action + "/" + dimensions + modifiers + "/" + photoSrc;
};

})(jQuery);