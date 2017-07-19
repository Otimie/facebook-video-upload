const https = require('https');

const AWS = require('aws-sdk');

exports.handler = (event, context, callback) => {

	var path = '/v2.10/oauth/access_token?client_id=' + process.env.clientId + '&redirect_uri=https://api.vidulo.com/facebook/' + event.pathParameters.videoId + '&client_secret=' + process.env.clientSecret + '&code=' + event.queryStringParameters.code;

	var options = {
		host: 'graph.facebook.com',
		path: path
	};

	callback123 = function (response) {
		var str = '';

		//another chunk of data has been recieved, so append it to `str`
		response.on('data', function (chunk) {
			str += chunk;
		});

		//the whole response has been recieved, so we just print it out here
		response.on('end', function () {

			var sns = new AWS.SNS({
				apiVersion: '2010-03-31'
			});

			var params = {
				Message: str,
				TopicArn: 'arn:aws:sns:ap-southeast-2:659947208484:initialize'
			};

			sns.publish(params, function(error, data) {
				if (error) {
					console.log(error, error.stack);
				}
				else {
					console.log(data);

					callback(null, {
						"isBase64Encoded": false,
						"statusCode": 302,
						"headers": {
							"Location": "http://www.vidulo.com"
						}
					});
				}
			});
		});
	}
	https.request(options, callback123).end();
};
