/* Magic Mirror
 * Module: MMM-PARCEL
 *
 * By MartinKooij
 *
 */
const NodeHelper = require('node_helper');
const aftershipSDK = require('aftership');

module.exports = NodeHelper.create({
	
    start: function() {
        console.log("Starting node_helper for: " + this.name);
    },
	

    getShipments: function() {
        var aftershipAPI = new aftershipSDK(this.config.apiKey);
        aftershipAPI.GET('/trackings', function(err, result) {
			if (!err) {
				
//				this.sendSocketNotification('AFTERSHIP_RESULT', result);
				console.log(Date(), result);
				this.sendSocketNotification('AFTERSHIP_RESULT', parcelTestAnswer);				
			
			} else {
				console.log(Date(), err);
			}
		});		
    },

    socketNotificationReceived: function(notification, payload) {
    	 if (notification === "CONFIG") {
            this.config = payload;
			} else if (notification === 'GET_AFTERSHIP') {
            this.getShipments();
        }
    }
});
