const https = require('https');

const AWS = require('aws-sdk');
const formData = require('form-data');

const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});


exports.handler = (event, context, callback) => {

};
