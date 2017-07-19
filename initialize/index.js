const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

exports.handler = (event, context, callback) => {

	var message = JSON.parse(event.records[0].Sns.Message);
	
	var s3 = new AWS.S3({
		apiVersion: '2006-03-01'
	});

	var params = {
		Bucket: "video-repository-vl7bfe",
		Key: "demo.mp4"
	};

	s3.headObject(params, (err, data) => {
		if (err) {
			console.log(err, err.stack);
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
				});
			});

			console.log(data);
        }
    });
};
