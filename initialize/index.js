const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

exports.handler = (event, context, callback) => {

	var message = JSON.parse(event.Records[0].Sns.Message);

	var s3 = new AWS.S3({
		apiVersion: '2006-03-01'
	});

	var params = {
		Bucket: "video-repository-vl7bfe",
		Key: "demo.mp4"
	};

	s3.headObject(params, (error, data) => {
		if (error) {
			console.log(error, error.stack);
		}
		else {
			var form = new formData;

			form.append('access_token', message.access_token);
			form.append('upload_phase', 'start');
			form.append('file_size', data.ContentLength);

			var request = https.request({
				method: 'post',
				host: 'graph-video.facebook.com',
				path: '/v2.3/me/videos',
				headers: form.getHeaders()
			});

			form.pipe(request);

			request.on('response', (res) => {
				res.on('data', (chunk) => {
					console.log('Response: ' + chunk);

					var uploadSession = JSON.parse(chunk);
					uploadSession.access_token = message.access_token;

					var sns = new AWS.SNS({
						apiVersion: '2010-03-31'
					});

					var params = {
						Message: JSON.stringify(uploadSession),
						TopicArn: 'arn:aws:sns:ap-southeast-2:659947208484:upload'
					};

					sns.publish(params, function(error, data) {
						if (error) {
							console.log(error, error.stack);
						}
						else {
							console.log(data);
							callback(null, 'Hello from Lambda');
						}
					});

				});
			});

			console.log(data);
		}
	});
};
