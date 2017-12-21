const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

function start(event, context, callback) {
	var params = {
		Bucket: event.Bucket,
		Key: event.Key
	};
	
	s3.headObject(params, (error, data) => {
		if (error) {
			callback(error);
		}
		else {
			// TODO
		}
	});
}

function transfer(event, context, callback) {
	// TODO
}

function finish(event, context, callback) {
	// TODO
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
