/* Magic Mirror
 * Module: MMM-PARCEL
 *
 * By MartinKooij
 * adapted to use tracktry.com
 *
 */
const NodeHelper = require('node_helper');
const apirequest = require('request');
const {Translate} = require('@google-cloud/translate').v2;
const fs = require('fs');

//Global variables used by the helper

var parcelResult = {items:[]};
var updateInterval = 30 * 60 * 1000; // if sending the updateInterval fails 30 minutes
var translationErrcount = 0;
var forceTrans = {};
const transMap = new Map();

module.exports = NodeHelper.create({
	
	start: function() {
		console.log("Starting node_helper for: " + this.name);
		transMap.set("","");
		transMap.set(" ", " ");
	},

	
	translate: function(data,lang) {
		
		if ((!data) || (!data.items) || (!data.items.length)) {return;}
		var mstrings = [];
		var detailstrings = [] ;
		
		var destInfo = false ;
		for (var i = 0; i < data.items.length; i++) {
			destInfo = data.items[i].destination_info.trackinfo ;
			if (destInfo) {
				mstrings.push(data.items[i].destination_info.trackinfo[0].StatusDescription.trim());
				detailstrings.push(data.items[i].destination_info.trackinfo[0].Details.trim());				
			} else if (data.items[i].origin_info.trackinfo){
				mstrings.push(data.items[i].origin_info.trackinfo[0].StatusDescription.trim());
				detailstrings.push(data.items[i].origin_info.trackinfo[0].Details.trim());	
			} else {
				mstrings.push("no information");
				detailstrings.push("");
			}				
		}
		
		var leftovermstrings = [] ;
		var leftovermindices = [] ;
		mstrings.forEach((value,index) => {
			if (transMap.get(value)) {
				parcelResult.items[index].translated_message = transMap.get(value);
//				console.log('translated message ', value, ' into ', transMap.get(value) , 'by HashMap') ;
			} else {
				leftovermstrings.push(value) ;
				leftovermindices.push(index) ;
		}});
		
		var leftoverdetailstrings = [] ;
		var leftoverdetailindices = [] ;
		detailstrings.forEach((value,index) => {
			if (transMap.get(value)) {
				parcelResult.items[index].translated_details = transMap.get(value);
//				console.log('translated detail ', value, ' into ', transMap.get(value) , 'by HashMap') ;
			} else {
				leftoverdetailstrings.push(value) ;
				leftoverdetailindices.push(index) ;
		}});
		
//		console.log("[DEBUG LEFTOVERS]", leftovermstrings,leftoverdetailstrings) ;
		
		if (translationErrcount > 100) {return;}
		if (translationErrcount > 90) { 
			console.log('[MMM-Parcelerror]', Date(), "Too many translation API call errors, translations will be stopped (soon) ", 100 - translationErrcount);
		}
		
		if (leftovermstrings.length != 0 && this.config.useGoogleTranslate) {
			const translateAPI = new Translate( {keyFilename : "modules/" + this.name + "/parceltranslate-credentials.json"} ) ;
			translateAPI.translate(leftovermstrings,lang, function(err, translation) {
					if (!err) {
						var translations = Array.isArray(translation)?translation:[translation] ;
//						console.log('GOOGLE TRANSLATIONS DONE M: ', leftovermstrings, translations) ;
						for (i = 0 ; i < leftovermstrings.length ; i++ ) {
							parcelResult.items[leftovermindices[i]].translated_message = translations[i] ;
							transMap.set(leftovermstrings[i],translations[i]);
						};
					} else {
						console.log(err);
						translationErrcount++ ;
					}
				});
		}
		
		if (leftoverdetailstrings.length != 0 && this.config.useGoogleTranslate) {
			const translateAPI2 = new Translate( {keyFilename : "modules/" + this.name + "/parceltranslate-credentials.json"} ) ;
			translateAPI2.translate(leftoverdetailstrings,lang, function(err, translation) {
					if (!err) {
						var translations = Array.isArray(translation)?translation:[translation] ;
//						console.log('GOOGLE TRANSLATIONS DONE D: ', leftoverdetailstrings, translations) ;
						for (i = 0 ; i < leftoverdetailstrings.length ; i++ ) {
							parcelResult.items[leftoverdetailindices[i]].translated_details = translations[i] ;
							transMap.set(leftoverdetailstrings[i],translations[i]);
						};
					} else {
						console.log(err);
						translationErrcount++ ;
					}
				});
		}
	},
					
	
	fetchShipments: function() {
		var self = this;
		var apiurl = 'https://api.tracktry.com/v1' + '/trackings' ;
		var apiurlget = apiurl + '/get?page=1&limit=25';
//		console.log('[DEBUG] Fetch Shipments') ;
		apirequest.get({
			url: apiurlget,
			headers: { 
				'Content-Type': 'application/json',
				'Tracktry-Api-Key': this.config.apiKey
			},
			method: 'GET'
			},
			function (e, r, body) {			
				if (!e) {
					var json = JSON.parse(body) ;
					var dataResult = { items: []} ;
					if (json.meta.code == 4031) {
						parcelResult = dataResult ;
					} else if (json.meta.code == 200) {
						dataResult = { items : json.data.items } ;
						if (self.config.autoTranslate) {
							parcelResult = dataResult ;
							if (self.config.debug) { console.log("RESULT.DATA-T = ", JSON.stringify(parcelResult, undefined, 2));}
							self.sanitize() ;
							self.translate(parcelResult, self.config.autoTranslate);
						} else {
							parcelResult = dataResult ;
							self.sanitize() ;
							if (self.config.debug) { console.log("RESULT.DATA-NoT = ", JSON.stringify(parcelResult, undefined, 2));}
						}
					}
				} else {console.log('[MMM-Parcelerror]',Date(), e, body );}
		});	
//	this.TestRead() ;
	},
	
	sanitize: function() {
		var i;
		if (!parcelResult.items) { parcelResult.items = []; }
		for (i = 0 ; i < parcelResult.items.length ; i++) {
			if (!(parcelResult.items[i].origin_info)) {parcelResult.items[i].origin_info = {trackinfo: null}} ;
			if (!(parcelResult.items[i].destination_info)) {parcelResult.items[i].destination_info = {trackinfo: null}} ;	
		}	
	},		
	
	broadcastShipments: function() {
		this.sendSocketNotification('TRACKTRY_RESULT', parcelResult);
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this ;
		console.log('[DEBUG] Notification received', notification) ;
		if (notification === 'CONFIG') {
			this.config = payload;
		} else if (notification === 'TRACKTRY_FETCHER') {
			if (this.config.autoTranslate) {
				fs.readFile('modules/'+this.name+'/manualtrans/' + this.config.autoTranslate + '.json', 'utf8', function (err, data) {
				if (!err) {
					forceTrans = JSON.parse(data);
					Object.keys(forceTrans).forEach(function(key) {
					transMap.set(key,forceTrans[key]) ;});	
					console.log('Message ' + self.name + ': "manualtrans/' + self.config.autoTranslate + '.json" translation file is active');
				} else {
					console.log('Message ' + self.name + ': no "manualtrans/' + self.config.autoTranslate + '.json" translation file found. This is no problem');
				}})
			}
			this.startUpdateNext();
		} else if (notification === 'INTERVAL_SET') {
			updateInterval = (payload<100000)?100000:payload; // 1.5 minutes minimal
		} else {
			console.log("OOPS. ", notification, payload);
		}
	},
	
	startUpdateNext: function() {
		var self = this;
		this.fetchShipments();
		setTimeout(function(){ self.UpdateNext();}, 5500 ); // give the translation APIs some time to return before returning the result
	},
		
	UpdateNext: function(){
		var self = this;
		this.broadcastShipments();
		setTimeout(function () {
			self.startUpdateNext();
			},updateInterval);
	},
	
	TestRead: function() {
		var self = this;
		fs.readFile('modules/'+this.name+'/testparcels.json', 'utf8', function (err, data) {
			    var dataResult = { items: []} ;
				if (!err) {
					dataResult = { items : (JSON.parse(data)).data.items } ;
					parcelResult = dataResult ;
					self.sanitize() ;
					console.log('[DEBUG TEST]:', JSON.stringify(parcelResult, undefined, 2));
				} else {
					console.log('testread ERROR');
				}})
	}
	
});
