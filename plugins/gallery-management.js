<blogsmith:box>
	<blogsmith:title>AOL Photo Gallery Media Button Override</blogsmith:title>
	<blogsmith:body>
		<script>		
			$(function() {			
				var $configure = $("#aol-photo-gallery-configuration"),
					$container = $configure.parent().parent(),
					$metaKeys = $(blogsmith.listMetaDataKeys()),
					$configForm = $('<dl>'),
					writeToEditorOriginal = writeToEditor,
					metaData = blogsmith.getMetaData(),
					galleryMetaKeys = { "GallerySponsorName" : "Sponsor name.",
										"GallerySponsorURL" : "Sponsorship URL target.",
										"GallerySponsorImage" : "Sponsorship image url.",
										"GalleryAdRefreshMN" : "Magic number for gallery ad.",
										"GalleryAdRefreshCount" : "Number of gallery clicks between ad refresh."},
					contents;

				// Override default insert gallery button
				writeToEditor = function(text) {
					if (/%Gallery-\d+%/.test(text))
						text = text.replace(/Gallery/, 'VIRTUAL-Gallery');

					writeToEditorOriginal(text);
				};
				
				// Initalize plugin -	Hide plugin.  Create configuration form. 
				//						Search for missing meta data keys and add if needed.
				$container.hide();
				
				// Create configuration form
				for (key in galleryMetaKeys) {
					$configForm.append(
						$('<dt>').text(key + ":")
					).append($('<dd>').append(
						$('<input>').attr({
							'type' : 'text',
							id : 'aol-photo-gallery-metadata-' + key
						}).data('key', key)
					));
				}
				
				$metaKeys.each(function(index, item) {
					if (typeof galleryMetaKeys[item.key] != "undefined") {
						delete galleryMetaKeys[item.key];
					}
				});

				for (key in galleryMetaKeys) {
					blogsmith.addMetaDataKey(key, galleryMetaKeys[key]);
				}
				
				// Check contents for included galleries
				contents = blogsmith.getContents();
				if (/%VIRTUAL-Gallery-\d+%/.test(contents)) {
					$container.show();
					$configure.prepend($configForm);
					
					for (key in metaData) {
						$("#aol-photo-gallery-metadata-" + key).val(metaData[key]);
					}
					
					$configure.find("input[name=save]").click(function(e) {
						e.preventDefault();
						
						$configure.find('input[type=text]').each(function(index, item) {
							blogsmith.setMetaData(blogsmith.getPostID(), $(item).data('key') + "=" + $(item).val());
						});
					});
				}
			});
		</script>
		<div id="aol-photo-gallery-configuration">
			<input type="button" name="save" value="Save" id="" />
		</div>
	</blogsmith:body>
</blogsmith:box>