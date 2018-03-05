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
//		console.log(Date(), "At least we got Here!");
        aftershipAPI.GET('/trackings', function(err, result) {
			if (!err) {
//				console.log(Date(), "API GET call done:", result.data);
//				mmparcelResult = result.data ;
//				console.log(Date(), "API GET call done:", parcelTestAnswer);
				mmparcelResult = parcelTestAnswer ;				
			} else {
				console.log(Date(), err);
			}
		});		
    },
	
    broadcastShipments: function() {
				console.log(Date(), 'Notify ============>', "mmparcelResult sent");
				this.sendSocketNotification('AFTERSHIP_RESULT', mmparcelResult);
    },

    socketNotificationReceived: function(notification, payload) {
    	 if (notification === "CONFIG") {
			console.log("CONFIG PARCEL notification received", payload) ;
            this.config = payload;
			} else if (notification === 'AFTERSHIP_REQUEST') {
			console.log('GET AFTERSHIP REQUEST notification received', payload) ;
            this.startShipmentsFetcher(payload) ;
        } else {
			console.log(notification, payload) ;
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
//		console.log("update Interval = ", mmparcelUpdateInterval);
		setTimeout(function () {
					self.startUpdateNext();
					},mmparcelUpdateInterval);
	},
	
});

/* This is for testing */
const parcelTestAnswer = JSON.parse( '{\
        "page": 1,\
        "limit": 100,\
        "count": 3,\
        "keyword": "",\
        "slug": "",\
        "origin": [],\
        "destination": [],\
        "tag": "",\
        "fields": "",\
        "created_at_min": "2014-03-27T07:36:14+00:00",\
        "created_at_max": "2014-06-25T07:36:14+00:00",\
        "trackings": [\
            {\
                "id": "53aa7b5c415a670000000021",\
                "created_at": "2014-06-25T07:33:48+00:00",\
                "updated_at": "2014-06-25T07:33:55+00:00",\
                "tracking_number": "123456789",\
                "tracking_account_number": null,\
                "tracking_postal_code": null,\
                "tracking_ship_date": null,\
                "slug": "dhl",\
                "active": false,\
                "custom_fields": {\
                    "product_price": "USD19.99",\
                    "product_name": "iPhone Case"\
                },\
                "customer_name": null,\
                "destination_country_iso3": null,\
                "emails": [\
                    "email@yourdomain.com",\
                    "another_email@yourdomain.com"\
                ],\
                "expected_delivery": "2018-02-28T07:33:55+01:00",\
                "note": null,\
                "order_id": "ID 1234",\
                "order_id_path": "http://www.aftership.com/order_id=1234",\
                "origin_country_iso3": null,\
                "shipment_package_count": 0,\
                "shipment_type": null,\
                "signed_by": "raul",\
                "smses": [],\
                "source": "api",\
                "tag": "Delivered",\
                "title": "Pakje met iPhone",\
                "tracked_count": 1,\
                "unique_token": "xy_fej9Llg",\
                "checkpoints": [\
                    {\
                        "slug": "dhl",\
                        "city": null,\
                        "created_at": "2014-06-25T07:33:53+00:00",\
                        "country_name": "VALENCIA - SPAIN",\
                        "message": "Awaiting collection by recipient as requested",\
                        "country_iso3": null,\
                        "tag": "InTransit",\
                        "checkpoint_time": "2014-05-12T12:02:00",\
                        "coordinates": [],\
                        "state": null,\
                        "zip": null\
                    }\
                ]\
            },\
			{\
                "tracking_number": "3DT123456789",\
                "expected_delivery": null,\
                "tag": "InfoReceived",\
				"slug": "fedex",\
                "title": null,\
				"checkpoints": [\
					{\
                        "country_name": "VALENCIA - SPAIN",\
                        "message": "Awaiting collection by recipient as requested"\
					},\
				    {\
                        "city": "Denver",\
                        "country_name": "US",\
                        "message": "Waiting for packet",\
                        "state": "CO",\
                        "zip": null\
                   }\
                ]\
			},\
			{\
                "tracking_number": "3DS12111111",\
                "expected_delivery": "2018-03-06",\
                "tag": "InTransit",\
                "title": null,\
				"slug": "postnl",\
                "checkpoints": [\
					{\
                        "country_name": "VALENCIA - SPAIN",\
                        "message": "Awaiting collection by recipient as requested"\
					},\
				    {\
                        "city": null,\
                        "country_name": "POSTNL - ADAM",\
                        "message": "Onderweg",\
                        "state": null,\
                        "zip": null\
                    }\
                ]\
            },\
			{\
                "tracking_number": "3DS12111111",\
                "expected_delivery": "2018-03-06T14:00:00-06:00",\
                "tag": "Pending",\
				"slug": "fedex",\
                "title": "Electronics spul"\
            },\
			{\
                "tracking_number": "3DT123456789",\
                "expected_delivery": "2018-03-01",\
                "tag": "AttemptFail",\
                "title": null,\
				"slug": "postnl",\
                "checkpoints": [\
					{\
                        "country_name": "VALENCIA - SPAIN",\
                        "message": "Awaiting collection by recipient as requested"\
					},\
				    {\
                        "city": null,\
                        "country_name": "POSTNL - Ldorp",\
                        "message": "Niet thuis, handtekening benodigd",\
                        "state": null,\
                        "zip": null\
                    }\
                ]\
            },\
			{\
                "tracking_number": "3DT123456789",\
                "expected_delivery": "2018-03-01T14:00:00",\
                "tag": "OutForDelivery",\
				"slug": "postnl",\
                "title": null,\
                "checkpoints": [\
					{\
                        "country_name": "VALENCIA - SPAIN",\
                        "message": "Awaiting collection by recipient as requested"\
					},\
				    {\
                        "city": null,\
                        "country_name": "POSTNL - Ldorp",\
                        "message": "Onderweg",\
                        "state": null,\
                        "zip": null\
                    }\
                ]\
            }\
        ]\
    }');