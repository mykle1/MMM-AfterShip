/* Magic Mirror
 * Module: MMM-AfterShip
 *
 * By Mykle1
 *
 */
const NodeHelper = require('node_helper');
const request = require('request');



module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node_helper for: " + this.name);
    },
	

    getAfterShip: function(url) {
        request({
            url: "https://api.aftership.com/v4/trackings",
            method: 'GET',
			headers: {
				'aftership-api-key': this.config.apiKey,
				'Content-Type': 'application/json'
			}
			
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body).data.trackings;
			//	console.log(result); // check
                this.sendSocketNotification('AFTERSHIP_RESULT', result);
        
            }
        });
    },

    socketNotificationReceived: function(notification, payload) {
    	 if (notification === "CONFIG") {
            this.config = payload;
			} else if (notification === 'GET_AFTERSHIP') {
            this.getAfterShip(payload);
        }
    }
});
