const https = require('https');

const formData = require('form-data');

exports.handler = (event, context, callback) => {

	var message = JSON.parse(event.Records[0].Sns.Message);

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
		response.on('data', (data) => {
			callback(null);
		});
	});
};
