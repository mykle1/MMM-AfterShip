const express = require('express');
const { check, validationResult, matchedData } = require('express-validator');
const router = express.Router();
const apifetch = require('node-fetch');
var apiKey = require('./apikey') ;

router.get('/', (req, res) => {
  res.render('choose', { title: "MMM-Parcel" } );
});

router.post('/', [], (req, res) => {
  res.render('choose', { title: "MMM-Parcel" } );
});

router.get('/parcel', (req, res) => {
  res.render('parcel', {
    data: {},
    errors: {},
	title: 'MMM-Parcel'
  });
});

router.get('/getonce', (req, res) => {
  res.render('getonce', {
    data: {},
    errors: {},
	title: 'MMM-Parcel'
  });
});

router.post('/parcel', [
  check('trackingcode')
    .isLength({ min: 1 })
    .withMessage('Tracking Code is required')
    .trim(),
  check('handler')
    .isLength({ min: 1})
    .withMessage('Courier Code is required')
    .trim(),
  check('postalcode')
    .trim(),
  check('title')
     .trim()  
], (req, res) => {
  const regex = /^[0-9]{4}[A-Z]{2}$/ ;
  var errors = validationResult(req).mapped();

  if ( (req.body["postalcode"] === "" )&& (req.body["handler"] === "postnl-3s") ) {
	  errors.postalcode = {
		value: "",
		msg: "Postal code is required at postnl-3s",
		param: "postalcode",
		location: "body"
		}
  }	else if (req.body["postalcode"] != "" && req.body["handler"] != "postnl-3s") {
	  errors.postalcode = {
		value: "",
		msg: "Postal code only valid for postnl-3s, leave empty otherwise",
		param: "postalcode",
		location: "body"
		}
  } else if ( (!req.body["postalcode"].match(regex) ) && req.body["handler"] === "postnl-3s") {
	  errors.postalcode = {
		value: "",
		msg: "Postal code has wrong format: use 1234AB",
		param: "postalcode",
		location: "body"
		}
  }	
  
  if (Object.keys(errors).length != 0) {
    return res.render('parcel', {
      data: req.body,
      errors: errors,
	  title : 'MMM-Parcel'
    });
  }
  
    const data = matchedData(req);
    var apiurl = 'https://api.tracktry.com/v1' + '/trackings' ;
	var apiurlpost = apiurl + '/post';
	var apiurlrealtime = apiurl + '/realtime';
	const bodyjson = {tracking_number: data.trackingcode,
					  carrier_code: data.handler,
					  tracking_postal_code: data.postalcode,
					  title: data.title,	
					};
	if (data.postalcode != "") { bodyjson.destination_code = "nl"; bodyjson.destination = data.postalcode ; } 
	async function postandfetch() {
		var resultpost;
		var resultkick;
		try {
			const response = await apifetch( apiurlpost, {
				method: 'post',
				headers: { 
					'Content-Type': 'application/json',
					'Tracktry-Api-Key': apiKey
				},
				body: JSON.stringify(bodyjson)
			});
			resultpost = await response.json() ;
			if (resultpost.meta.code != 200) { throw ({name: "parcelput FAIL", message: resultpost}) }
			const response2 = await apifetch( apiurlrealtime, {
				method: 'post',
				headers: { 
					'Content-Type': 'application/json',
					'Tracktry-Api-Key': apiKey
				},
				body: JSON.stringify(bodyjson)
			});
			resultkick = await response2.json() ;
			req.flash('success', 'Entered '+ data.trackingcode + ' to Tracktry.com');
			res.redirect('/');
		} catch(error) {
			if (error.name === "parcelput FAIL") {
				req.flash('success', 'Failed to enter '+ data.trackingcode + ' to Tracktry.com: ' + error.message.meta.code + ", " + error.message.meta.type + ", " + error.message.meta.message);
			} else {
				req.flash('success', 'Failed to enter '+ data.trackingcode + ' to Tracktry.com:' + JSON.stringify(error));
			};
			res.redirect('/');
		}
	};
	postandfetch() ;
});			
			

router.post('/getonce', [
  check('trackingcode')
    .isLength({ min: 1 })
    .withMessage('Tracking Code is required')
    .trim(),
  check('handler')
    .isLength({ min: 1})
    .withMessage('Courier Code is required')
    .trim(),
  check('postalcode')
    .trim(),
  check('title')
     .trim()  
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('getonce', {
      data: req.body,
      errors: errors.mapped(),
	  title : 'MMM-Parcel'
    });
  }
  const data = matchedData(req);
    var apiurl = 'https://api.tracktry.com/v1' + '/trackings' ;
	var apiurlrealtime = apiurl + '/realtime';
	var bodyrequest = { tracking_number: data.trackingcode,
					carrier_code: data.handler,
					tracking_postal_code: data.postalcode,
					destination: data.postalcode,
					title: data.title
			};
	if (data.postalcode != "") { bodyrequest.destination_code = "nl" } ;
	(async function () {
		try {
			const result = await apifetch(apiurlrealtime, {
				headers: { 
					'Content-Type': 'application/json',
					'Tracktry-Api-Key': apiKey
					},
				method: 'POST',
				body: JSON.stringify(bodyrequest)
				});
			var trackingresult = await result.json() ;
			if (trackingresult.meta.code != 200) { throw ({name: "parcelrealtime ERROR", message: trackingresult}) };
			console.log('API b:', JSON.stringify(trackingresult, undefined,2));			
			req.flash('success', 'shown '+ data.trackingcode + ' to console.log');
			res.redirect('/');
		} catch (e) {
				console.log('API e:',e);
				res.redirect('/');
		}
		})();
});


router.get('/getlist', (req, res) => {
    var apiurl = 'https://api.tracktry.com/v1' + '/trackings' ;
	var apiurlget = apiurl + '/get?page=1&limit=25';
	(async function () {
		var parcelList = {items : []};
		var body ;
		try {
			const result = await apifetch(apiurlget, 
				{
					headers: { 
						'Content-Type': 'application/json',
						'Tracktry-Api-Key': apiKey
					},
					method: 'GET'
				});
			body = await result.json() ;
			if (body.meta.code != 200) { throw (body,meta) ;}
			var itemList = [] ;
			parcelList.items = body.data.items ;				
			parcelList.items.forEach((item,index) => {
				itemList.push({tracking_number : item.tracking_number, carrier_code : item.carrier_code, index : index, status : item.status });
			});
			res.render('getlist', {plpl : itemList, title: 'MMM-Parcel' }) ;			
		} catch (e) {
			res.render('getlist', {plpl : [], title: 'MMM-Parcel' }) ;					
			console.log('ERROR GETLIST:',Date(), 'ERROR:', e, 'BODY:', body);
		}
	})();
	}
);

module.exports = router;
