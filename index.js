const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

function start(event, context, callback) {
	var params = {
		Bucket: event.Bucket,
		Key: event.Key
	};
	
	s3.headObject(params, (error, data) => {
		if (error) {
			callback(error);
		}
		else {
			var form = new formData;

			form.append('access_token', event.access_token);
			form.append('upload_phase', 'start');
			form.append('file_size', data.ContentLength);
			
			var node_id = event.node_id;
			
			var request = https.request({
				method: 'POST',
				host: 'graph-video.facebook.com',
				path: '/v2.10/' + node_id + '/videos',
				headers: form.getHeaders()
			});
			
			form.pipe(request);
			
			request.on('response', (response) => {
				var body = '';
				
				response.on('data', (data) => {
					body += data;
				});
				
				response.on('end', () => {
					// TODO	
				});
			}
		}
	});
}

function transfer(event, context, callback) {
	var params = {
		Bucket: event.Bucket,
		Key: event.Key,
		Range: 'bytes=' + event.start_offset + '-' + event.end_offset
	};

	s3.getObject(params, (error, data) => {
		if (error) {
			callback(error);
		}
		else {
			// TODO
		}
	});
}

function finish(event, context, callback) {
	// TODO
}

exports.handler = (event, context, callback) => {
	switch (event.phase) {
		// Start
		case (null):
			start(event, context, callback);
			break;
			
		// Transfer
		case ('transfer'):
			transfer(event, context, callback);
			break;
			
		// Finish
		case ('finish'):
			finish(event, context, callback);
			break;
	}
};
