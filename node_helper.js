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
				'aftership-api-key': '4d671d76-5294-44a2-ba35-7f9350bf94cf',
				'Content-Type': 'application/json'
			}
			
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body).data;
				console.log(response.statusCode + result); // check
                this.sendSocketNotification('AFTERSHIP_RESULT', result);
            }
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'GET_AFTERSHIP') {
            this.getAfterShip(payload);
        }
    }
});
