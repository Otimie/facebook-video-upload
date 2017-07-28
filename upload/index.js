const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

exports.handler = (event, context, callback) => {

	var message = JSON.parse(event.Records[0].Sns.Message);

	var s3 = new AWS.S3({
		apiVersion: '2006-03-01'
	});

	var params = {
		Bucket: message.bucket,
		Key: message.key,
		Range: 'bytes=' + message.start_offset + '-' + message.end_offset
	};

	s3.getObject(params, function(err, data) {
		if (err) {
			console.log(err, err.stack);
		}
		else {
			var form = new formData();

			form.append('access_token', message.access_token);
			form.append('upload_phase', 'transfer');
			form.append('start_offset', message.start_offset);
			form.append('upload_session_id', message.upload_session_id);
			form.append('video_file_chunk', data.Body, {
				filename: 'demo.mp4',
				contentType: data.ContentType,
				knownLength: message.end_offset - message.start_offset
			});

			var request = https.request({
				method: 'post',
				host: 'graph-video.facebook.com',
				path: '/v2.10/' + message.node_id + '/videos',
				headers: form.getHeaders()
			});

			form.pipe(request);

			request.on('response', (response) => {

				response.on('data', (chunk) => {

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
					
					var lambda = new AWS.Lambda({
						apiVersion: '2015-03-31'
					});

					var params = {
						FunctionName: topicArn,
						InvocationType: 'Event',
						Payload: JSON.stringify(message),
						Qualifier: '1',
						
						Message: JSON.stringify(message),
						TopicArn: topicArn
					};

					lambda.invoke(params, function(error, data) {
						if (error) {
							callback(error);
						}
						else {
							callback(null);
						}
					});
				});
			});
			
			request.on('error', (error) => {
				callback(error);
			});
		}
	});
};
