const https = require('https');

const AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {

	if (event.queryStringParameters.code) {

		var path = '/v2.10/oauth/access_token?client_id=' + process.env.clientId + '&redirect_uri=https://api.vidulo.com/facebook/' + event.pathParameters.videoId + '&client_secret=' + process.env.clientSecret + '&code=' + event.queryStringParameters.code;

		var options = {
			host: 'graph.facebook.com',
			path: path
		};

		https.request(options, (response) => {
			var str = '';

			//another chunk of data has been recieved, so append it to `str`
			response.on('data', (chunk) => {
				str += chunk;
			});

			//the whole response has been recieved, so we just print it out here
			response.on('end', () => {
				
				var decoded = JSON.parse(str);
				
				decoded.node_id = 'me';
				decoded.key = event.pathParameters.videoId + '.mp4';
				decoded.bucket = 'video-repository-vl7bfe';

				var sns = new AWS.SNS({
					apiVersion: '2010-03-31'
				});

				var params = {
					Message: JSON.stringify(decoded),
					TopicArn: 'arn:aws:sns:ap-southeast-2:659947208484:initialize'
				};

				sns.publish(params, (error, data) => {
					if (error) {
						console.log(error, error.stack);
					}
					else {
						console.log(data);

						callback(null, {
							"isBase64Encoded": false,
							"statusCode": 302,
							"headers": {
								"Location": "https://demo.vidulo.com/facebook/successful"
							}
						});
					}
				});
			});
		}).end();
	}
	else {
		callback(null, {
			"isBase64Encoded": false,
			"statusCode": 302,
			"headers": {
				"Location": "https://demo.vidulo.com/facebook/unsuccessful"
			}
		});
	}
};
