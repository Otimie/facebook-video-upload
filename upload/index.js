const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

exports.handler = (event, context, callback) => {

	var message = JSON.parse(event.Records[0].Sns.Message);

	var s3 = new AWS.S3({
		apiVersion: '2006-03-01'
	});

	var params = {
		Bucket: 'video-repository-vl7bfe',
		Key: 'demo.mp4',
		Range: 'bytes=' + start_offset + '-' + end_offset
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
			form.append('video_file_chunk', data.Body);

			var request = https.request({
				method: 'post',
				host: 'graph-video.facebook.com',
				path: '/v2.3/me/videos',
				headers: form.getHeaders()
			});

			form.pipe(request);

			request.on('response', (response) => {

				response.on('data', (chunk) => {

					var parsed = JSON.parse(chunk);

					if (parsed.start_offset === parsed.end_offset) {
						// Finished uploading
						var topicArn = 'arn:aws:sns:ap-southeast-2:659947208484:upload';
					}
					else {
						// Not finished uploading
						var topicArm = 'arn:aws:sns:ap-southeast-2:659947208484:post';
					}

					// TODO: Update to new syntax
					uploadSession.start_offset = parsed.start_offset;
					uploadSession.end_offset = parsed.end_offset;

					var sns = new AWS.SNS({
						apiVersion: '2010-03-31'
					});

					var params = {
						Message: JSON.stringify(uploadSession),
						TopicArn: topicArn
					};

					sns.publish(params, function(err, data) {
						if (err) {
							console.log(err, err.stack);
						}
						else {
							console.log(data);
							callback(null, 'Hello from Lambda');
						}
					});
				});
			});
		}
	});
};
