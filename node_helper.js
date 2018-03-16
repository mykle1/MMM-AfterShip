/* Magic Mirror
 * Module: MMM-PARCEL
 *
 * By MartinKooij
 *
 */
const NodeHelper = require('node_helper');
const aftershipSDK = require('aftership');
const GTranslateSDK = require('@google-cloud/translate');
var mmparcelResult = {trackings:[]} ;
var mmparcelUpdateInterval = 30000 ;
var mmparcelTranslationerrcount = 0 ;
var mmparcellastTexts = [] ;
var mmparcellastTrans = [] ;

module.exports = NodeHelper.create({
	
    start: function() {
        console.log("Starting node_helper for: " + this.name);
    },

	equalsarray: function(a,b) {
		if (a.length != b.length) {return false;};
		for (i=0; i<a.length ; i++) {
			if (a[i] != b[i]) {return false;};
		}
		return true ;
	},
	
	translate: function(data,lang) {
		if (mmparcelTranslationerrcount > 100) {return;};
	    if (mmparcelTranslationerrcount > 97) { 
			console.log(Date(), "Too many translation API call errors, translations will be stopped (soon) ") ;
		};
		if (data.trackings.length == undefined) {return} ;
		mstrings = [] ;
		mplaces = [] ;
		for (var i = 0 ; i < data.trackings.length; i++) {
			var j = data.trackings[i].checkpoints.length;

			if ( j == undefined) {break} ;	

			mstrings.push(data.trackings[i].checkpoints[j-1].message);
			mplaces.push({p:i,cp: j-1});
		};
		
		if (this.equalsarray(mmparcellastTexts,mstrings)) {
			console.log("reuse of existing translations") ;
			for (i = 0 ; i < mplaces.length ; i++ ) {
				mmparcelResult.trackings[mplaces[i].p].checkpoints[mplaces[i].cp].message = mmparcellastTrans[i];
			};
			return;
		};
			
		var translateAPI = GTranslateSDK( {keyFilename : "modules/" + this.name + "/parceltranslate-credentials.json"} ) ;
		translateAPI.translate(mstrings,lang, function(err, translation) {
				if (!err) {
					mmparcellastTexts = mstrings;
					mmparcellastTrans = translation;
					console.log("set  translations via Google API") ;
					for (i = 0 ; i < mplaces.length ; i++ ) {
						mmparcelResult.trackings[mplaces[i].p].checkpoints[mplaces[i].cp].message = translation[i];
					};
				} else {
					console.log(err);
				}
		});
	},
			
				
	
	fetchShipments: function() {
		var self = this ;
        var aftershipAPI = new aftershipSDK(this.config.apiKey);
        aftershipAPI.GET('/trackings', function(err, result) {
			if (!err) {
				if (self.config.autoTranslate) {
					mmparcelResult = result.data ;
					self.translate(mmparcelResult, self.config.autoTranslate) ;
				} else {
					mmparcelResult = result.data;
				}
			} else {
				console.log(Date(), err);
			}
		});		
    },
	
    broadcastShipments: function() {
		this.sendSocketNotification('AFTERSHIP_RESULT', mmparcelResult);
    },

    socketNotificationReceived: function(notification, payload) {
    	 if (notification === 'CONFIG') {
            this.config = payload;
		} else if (notification === 'AFTERSHIP_FETCHER') {
            this.startUpdateNext() ;
		} else if (notification === 'INTERVAL_SET') {
			mmparcelUpdateInterval = (payload<30000)?30000:payload;
        } else {
			console.log("OOPS. ", notification, payload) ;
		}
	},
	
	startUpdateNext: function() {
		var self = this ;
		this.fetchShipments();
		setTimeout(function(){ self.UpdateNext();}, 3000 ) ; // give the API some time to return
	},
		
	UpdateNext: function(){
		var self = this ;
		this.broadcastShipments();
		setTimeout(function () {
					self.startUpdateNext();
					},mmparcelUpdateInterval);
	},
	
});
