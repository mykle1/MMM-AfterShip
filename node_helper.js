/* Magic Mirror
 * Module: MMM-PARCEL
 *
 * By MartinKooij
 *
 */
const NodeHelper = require('node_helper');
const aftershipSDK = require('aftership');
const FREEtranslate = require('google-translate-api');
const fs = require('fs');

//Global variables used by the helper
var parcelResult = {trackings:[]};
var updateInterval = 30000;
var translationErrcount = 0;
var lastTexts = [];
var lastTrans = [];
var forceTrans = {};



module.exports = NodeHelper.create({
    
    start: function() {
        console.log("Starting node_helper for: " + this.name);
        fs.readFile('modules/'+this.name+'/force_trans.json', 'utf8', function (err, data) {
            if (!err) {
                forceTrans = JSON.parse(data);
            } else {
            console.log('Message ' + this.name + ': no "force_trans.json" translation file found. This is no problem');
            }
        });
    },

    equalsarray: function(a,b) {
        if (a.length != b.length) {return false;}
        for (i=0; i<a.length; i++) {
            if (a[i] != b[i]) {return false;}
        }
        return true;
    },
    
    translateMessage: function(orig,lang,mplace,i) {
        FREEtranslate(orig, {to: lang}).then(res => {
                var trans = forceTrans[orig] || res.text;
//                console.log("TRANSLATED: ", orig, 'into ', trans);
                parcelResult.trackings[mplace.p].checkpoints[mplace.cp].translated_message = trans;
                lastTrans[i] = trans;
                translationErrcount = 0;
            }).catch(err => {
                translationErrcount++
                console.error(err);
            });
    },
    
    translate: function(data,lang) {
        if (translationErrcount > 100) {return;};
        if (translationErrcount > 90) { 
            console.log(Date(), "Too many translation API call errors, translations will be stopped (soon) ", 100 - translationErrcount);
        };
        
        if (data.trackings.length == undefined) {return};
        var mstrings = [];
        var mplaces = [];
        for (var i = 0; i < data.trackings.length; i++) {
            var j = data.trackings[i].checkpoints.length;

            if ( j == undefined) {break};    

            mstrings.push(data.trackings[i].checkpoints[j-1].message);
            mplaces.push({p:i,cp: j-1});
        };
        if (this.equalsarray(lastTexts,mstrings)) {
            for (i = 0; i < mplaces.length; i++ ) {
                parcelResult.trackings[mplaces[i].p].checkpoints[mplaces[i].cp].translated_message = lastTrans[i];
            };
            return;
        };
            
        lastTexts = mstrings.slice();
        lastTrans = mstrings.slice();
        for (i = 0; i < mplaces.length; i++ ) {
            this.translateMessage(mstrings[i],lang, mplaces[i],i);
        };  
    },
            
                
    
    fetchShipments: function() {
        var self = this;
        var aftershipAPI = new aftershipSDK(this.config.apiKey);
        aftershipAPI.GET('/trackings', function(err, result) {
            if (!err) {
                if (self.config.autoTranslate) {
                    parcelResult = result.data;
                    self.translate(parcelResult, self.config.autoTranslate);
                } else {
                    parcelResult = result.data;
                }
            } else {
                console.log(Date(), err);
            }
        });        
    },
    
    broadcastShipments: function() {
        this.sendSocketNotification('AFTERSHIP_RESULT', parcelResult);
    },

    socketNotificationReceived: function(notification, payload) {
         if (notification === 'CONFIG') {
            this.config = payload;
        } else if (notification === 'AFTERSHIP_FETCHER') {
            this.startUpdateNext();
        } else if (notification === 'INTERVAL_SET') {
            updateInterval = (payload<30000)?30000:payload;
        } else {
            console.log("OOPS. ", notification, payload);
        }
    },
    
    startUpdateNext: function() {
        var self = this;
        this.fetchShipments();
        setTimeout(function(){ self.UpdateNext();}, 3000 ); // give the API some time to return
    },
        
    UpdateNext: function(){
        var self = this;
        this.broadcastShipments();
        setTimeout(function () {
                    self.startUpdateNext();
                    },updateInterval);
    },
    
});
