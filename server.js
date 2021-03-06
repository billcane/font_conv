var	formidable = require('formidable'),
	http = require('http'),
    	exec = require("child_process").exec,
    	fs = require("fs"),
    	port = process.env.PORT || 8080,
	Q = require('q'),
	AdmZip = require('adm-zip');


http.createServer(function(req, res) {
if (req.method.toLowerCase() == 'post') {
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      
	if (fields.format == 'all') {
		
		var zip = new AdmZip();

		Q().then(convertToFormat(".woff"))
			.then(convertToFormat(".eot"))
			.then(convertToFormat(".ttf"))
			.then(createFontFace())
			.finally(function(error){
				fs.rename(files.upload.path, files.upload.name);
				zip.addLocalFile(files.upload.name);
				var willSendThis = zip.toBuffer();
				fs.unlink(files.upload.path + '.afm', function (err) {
					if (err) deferred.reject(err);
				});
				res.setHeader('Content-disposition', 'attachment; filename=prototypo-webkit-' + files.upload.name.replace('svg', 'zip'));
				res.writeHead(200, {'Content-Type': 'application/zip'});
				res.end(willSendThis);
				console.log(error);
				})

		function convertToFormat(format) {
			return function() {
				var deferred = Q.defer();
				exec("fontforge -script convert.sh -format \"" + format + "\" " + files.upload.path, function(error, stdout, stderr) {
					if (err) deferred.reject(err);
					fs.readFile(files.upload.path + format, function(err, data) {
						if (err) deferred.reject(err);
						zip.addFile(files.upload.name.replace('.svg', format), data);
        				fs.unlink(files.upload.path + format, function (err) {
						if (err) deferred.reject(err);
       		 			});
				
						deferred.resolve();	
					}); //end readfile
				}); //end exec
				return deferred.promise;
			} // end return
		} //end Q function

		function createFontFace() {
			return function() {
				var deferred = Q.defer();
				var now = new Date();
				var fd = fs.openSync('stylesheet.css', 'w+');
				fs.writeFileSync('stylesheet.css', '/* Generated by Prototypo on ' + now + '*/' + '\n\n\n'
						+ '@font-face {' + '\n'
						+ '\t' + "font-family: 'prototypo-customfont';" + '\n'
						+ '\t' + "src: url('" + files.upload.name.replace('svg', 'eot') + "');" + '\n'
						+ '\t' + "src: url('" + files.upload.name.replace('svg', 'eot') + "?#iefix') format('embedded-opentype')," + '\n'
						+ '\t\t' + "url('" + files.upload.name.replace('svg', 'woff') + "') format('woff')," + '\n'
						+ '\t\t' + "url('" + files.upload.name.replace('svg', 'ttf') + "') format('truetype')," + '\n'
						+ '\t\t' + "url('" + files.upload.name + "#prototypo-customfont') format('svg');" + '\n'
						+ '\t' + 'font-weight: normal;' + '\n'						
						+ '\t' + 'font-style: normal;' + '\n' + '\n' + '}');						
				zip.addLocalFile('stylesheet.css');
				fs.unlink('stylesheet.css', function(err) {
						if (err) deferred.reject(err);
				});
				fs.closeSync(fd);
				deferred.resolve();
				return deferred.promise;
			} //end return
		} //end Q function
	} //endif

	else {
		exec("fontforge -script convert.sh -format \"." + fields.format + "\"" + " " + files.upload.path, function(error, stdout, stderr) {
       			if (error !== null) {
          			console.log('exec error: ' + error);
       		 	}
        		res.setHeader('Content-disposition', 'attachment; filename=' + files.upload.name.replace('svg', fields.format));
        		res.writeHead(200, {'Content-Type': 'application/x-font-' + fields.format});
			fs.readFile(files.upload.path + "." + fields.format, function (err, data) {
 				if (err) throw err;
				fs.unlink(files.upload.path, function (err) {
          				if (err) throw err;
       		 		});
        			fs.unlink(files.upload.path + "." + fields.format, function (err) {
         		 		if (err) throw err;
       		 		});
        			res.end(data);
       			}); //end read
	
      		}); //end exec
	} //end else
    }); //end parse
} //end if

    return;
}).listen(port); //end http
