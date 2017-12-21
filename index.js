const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

function start(event, context, callback) {
	var params = {
		Bucket: event.bucket,
		Key: event.key
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
			
			var request = https.request({
				method: 'POST',
				host: 'graph-video.facebook.com',
				path: '/v2.10/' + event.node_id + '/videos',
				headers: form.getHeaders()
			});

			form.pipe(request);

			request.on('response', (response) => {

				var body = '';

				response.on('data', (data) => {
					body += data;
				});

				response.on('end', () => {

					// Populate upload_session_id, video_id, start_offset & end_offset
					var payload = JSON.parse(body);

					payload.access_token = event.access_token;
					payload.node_id = event.node_id;
					payload.key = event.key;
					payload.bucket = event.bucket;
					// TODO: Phase: transfer

					var params = {
						FunctionName: context.functionName,
						InvocationType: 'Event',
						Payload: JSON.stringify(payload),
						Qualifier: context.functionVersion
					}
					lambda.invoke(params, (error, data) => {
						if (error) {
							callback(error);
						}
						else {
							callback(null);
						}
					});
				});
			});
		}
	});
}

function transfer(event, context, callback) {
	var params = {
		Bucket: event.bucket,
		Key: event.key,
		Range: 'bytes=' + event.start_offset + '-' + event.end_offset
	};
	
	s3.getObject(params, (error, data) => {
		if (error) {
			callback(error);
		}
		else {
			var form = new formData();

			form.append('access_token', event.access_token);
			form.append('upload_phase', 'transfer');
			form.append('start_offset', event.start_offset);
			form.append('upload_session_id', event.upload_session_id);
			form.append('video_file_chunk', data.Body, {
				filename: 'demo.mp4',
				contentType: data.ContentType,
				knownLength: event.end_offset - event.start_offset
			});

			var request = https.request({
				method: 'POST',
				host: 'graph-video.facebook.com',
				path: '/v2.10/' + event.node_id + '/videos',
				headers: form.getHeaders()
			});

			form.pipe(request);

			request.on('response', (response) => {
				
				var body = '';
				
				response.on('data', (data) => {
					body += data;
				});

				response.on('end', () => {

					// Populate start_offset & end_offset
					var payload = JSON.parse(body);

					if (parsed.start_offset === parsed.end_offset) {
						// Nothing more to upload
						payload.phase = 'finish';
					}
					else {
						// More chunks to send
						payload.phase = 'transfer';
					}

					// TODO: Update to new syntax
					payload.start_offset = event.start_offset;
					payload.end_offset = event.end_offset;

					var params = {
						FunctionName: context.functionName,
						InvocationType: 'Event',
						Payload: JSON.stringify(payload),
						Qualifier: context.functionVersion
					}
					
					lambda.invoke(params, (error, data) => {
						if (error) {
							callback(error);
						}
						else {
							callback(null);
						}
					});
				});
			});
		}
	});	
}

function finish(event, context, callback) {
	var form = new formData();

	form.append('access_token', event.access_token);
	form.append('upload_phase', 'finish');
	form.append('upload_session_id', event.upload_session_id);
	
	if (event.description) {
		form.append('description', event.description);
	}
	
	if (event.title) {
		form.append('title', event.title);
	}

	var request = https.request({
		method: 'post',
		host: 'graph-video.facebook.com',
		path: '/v2.10/' + event.node_id + '/videos',
		headers: form.getHeaders()
	});

	form.pipe(request);

	request.on('response', (response) => {
		
		var body = '';
		
		response.on('data', (data) => {
			body += data;
		});
		response.on('end', () => {
			callback(null);
		});
	});
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
