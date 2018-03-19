/* Magic Mirror
 * Module: MMM-PARCEL
 *
 * By MartinKooij
 *
 */
const NodeHelper = require('node_helper');
const aftershipSDK = require('aftership');
//const GTranslateSDK = require('@google-cloud/translate');
const FREEtranslate = require('google-translate-api') ;
var mmparcelResult = {trackings:[]} ;
var mmparcelUpdateInterval = 30000 ;
var mmparcelTranslationerrcount = 0 ;
var mmparcellastTexts = [] ;
var mmparcellastTrans = [] ;
var mmparcelforceTrans = {} ;
var fs = require('fs');


module.exports = NodeHelper.create({
	
	catch_translations: {},
	
    start: function() {
        console.log("Starting node_helper for: " + this.name);
		fs.readFile('modules/'+this.name+'/force_trans.json', 'utf8', function (err, data) {
			if (!err) {
				mmparcelforceTrans = JSON.parse(data);
			} else {
			console.log('Message ' + this.name + ': no "force_trans.json" translation file found. This is no problem')
			}
		});
    },

	equalsarray: function(a,b) {
		if (a.length != b.length) {return false;};
		for (i=0; i<a.length ; i++) {
			if (a[i] != b[i]) {return false;};
		}
		return true ;
	},
	
	translateMessage: function(orig,lang,mplace,i) {
		FREEtranslate(orig, {to: lang}).then(res => {
				var trans = res.text ;
				console.log("TRANSLATED: ", orig, 'into ', trans);
				if (mmparcelforceTrans[orig]) { trans = mmparcelforceTrans[orig] } ;
				mmparcelResult.trackings[mplace.p].checkpoints[mplace.cp].translated_message = trans;
				mmparcellastTrans[i] = trans
			}).catch(err => {
				console.error(err);
			});
	},
	
	translate: function(data,lang) {
		if (mmparcelTranslationerrcount > 100) {return;};
	    if (mmparcelTranslationerrcount > 97) { 
			console.log(Date(), "Too many translation API call errors, translations will be stopped (soon) ") ;
		};
		
		console.log("CATCHTRANS:", mmparcelforceTrans);
		if (data.trackings.length == undefined) {return} ;
		var mstrings = [] ;
		var mplaces = [] ;
		for (var i = 0 ; i < data.trackings.length; i++) {
			var j = data.trackings[i].checkpoints.length;

			if ( j == undefined) {break} ;	

			mstrings.push(data.trackings[i].checkpoints[j-1].message);
			mplaces.push({p:i,cp: j-1});
		};
		if (this.equalsarray(mmparcellastTexts,mstrings)) {
			console.log("reuse of existing translations") ;
			for (i = 0 ; i < mplaces.length ; i++ ) {
				mmparcelResult.trackings[mplaces[i].p].checkpoints[mplaces[i].cp].translated_message = mmparcellastTrans[i];
			};
			return;
		};
			
		mmparcellastTexts = mstrings.slice();
		mmparcellastTrans = mstrings.slice();
		for (i = 0 ; i < mplaces.length ; i++ ) {
			this.translateMessage(mstrings[i],lang, mplaces[i],i);
		};
		
		console.log("set  translations via Google free API") ;	
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
