/* Magic Mirror
 * Module: MMM-PARCEL
 *
 * By MartinKooij
 *
 */
const NodeHelper = require('node_helper');
const aftershipSDK = require('aftership');
var mmparcelResult = {trackings:[]} ;
var mmparcelUpdateInterval = 30000 ;

module.exports = NodeHelper.create({
	
    start: function() {
        console.log("Starting node_helper for: " + this.name);
    },
	
	fetchShipments: function() {
        var aftershipAPI = new aftershipSDK(this.config.apiKey);
        aftershipAPI.GET('/trackings', function(err, result) {
			if (!err) {
				mmparcelResult = result.data ;	
			} else {
				console.log(Date(), err);
			}
		});		
    },
	
    broadcastShipments: function() {
				this.sendSocketNotification('AFTERSHIP_RESULT', mmparcelResult);
    },

    socketNotificationReceived: function(notification, payload) {
    	 if (notification === "CONFIG") {
            this.config = payload;
			} else if (notification === 'AFTERSHIP_REQUEST') {
            this.startShipmentsFetcher(payload) ;
        } else {
			console.log("OOPS. ", notification, payload) ;
		}
	},
	
	startShipmentsFetcher: function(interval) {
		mmparcelUpdateInterval = (interval<30000)?30000:interval;
		this.startUpdateNext();
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