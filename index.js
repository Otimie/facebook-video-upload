const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

const s3 = new AWS.S3({
	apiVersion: '2006-03-01'
});

const lambda = new AWS.Lambda({
	apiVersion: '2015-03-31'
});

exports.handler = (event, context, callback) => {
	var params = {
		Bucket: message.bucket,
		Key: message.key
	};

	var params = {
		FunctionName: context.functionName,
		InvocationType: 'Event',
		Payload: payload,
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
};
