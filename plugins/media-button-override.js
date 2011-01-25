<blogsmith:box>
	<blogsmith:title>AOL Photo Gallery Media Button Override</blogsmith:title>
	<blogsmith:body>
	<script>
	    $(function() {
            var writeToEditorOriginal = writeToEditor;
            
            writeToEditor = function(text) {
                if (/%Gallery-\d+%/.test(text))
                    text = text.replace(/Gallery/, 'VIRTUAL-Gallery');

                writeToEditorOriginal(text);
            };
        });
	</script>
	</blogsmith:body>
</blogsmith:box>