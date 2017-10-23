const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

const s3 = new AWS.S3({
	apiVersion: '2006-03-01'
});

const lambda = new AWS.Lambda({
	apiVersion: '2015-03-31'
});

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

			// TODO: Change from 'me' to event.???
			var node_id = 'me';
			
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

					// Populate upload_session_id, video_id, start_offset & end_offset
					var payload = JSON.parse(body);

					payload.access_token = event.access_token;
					payload.node_id = node_id;
					payload.key = event.key;
					payload.bucket = event.bucket;

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

					var parsed = JSON.parse(chunk);

					if (parsed.start_offset === parsed.end_offset) {
						// Nothing more to upload
						var topicArn = 'arn:aws:sns:ap-southeast-2:659947208484:post';
					}
					else {
						// More chunks to send
						var topicArn = 'arn:aws:sns:ap-southeast-2:659947208484:upload';
					}

					// TODO: Update to new syntax
					message.start_offset = parsed.start_offset;
					message.end_offset = parsed.end_offset;

					//var params = {
					//	Message: JSON.stringify(message),
					//	TopicArn: topicArn
					//};
					var params = {
						FunctionName: context.functionName,
						InvocationType: 'Event',
						Payload: JSON.stringify(payload),
						Qualifier: context.functionVersion
					}

					//sns.publish(params, function(error, data) {
					//	if (error) {
					//		callback(error);
					//	}
					//	else {
					//		callback(null);
					//	}
					//});
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

	form.append('access_token', message.access_token);
	form.append('upload_phase', 'finish');
	form.append('upload_session_id', message.upload_session_id);
	
	if (message.description) {
		form.append('description', message.description);
	}
	
	if (message.title) {
		form.append('title', message.title);
	}

	var request = https.request({
		method: 'post',
		host: 'graph-video.facebook.com',
		path: '/v2.10/' + message.node_id + '/videos',
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
