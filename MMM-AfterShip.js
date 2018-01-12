/* Magic Mirror
 * Module: MMM-AfterShip
 *
 * By Mykle1
 *
 */
Module.register("MMM-AfterShip", {

    // Module config defaults.           // Make all changes in your config.js file
    defaults: {
        apiKey: '', // Your free API Key from aftership.com
        useHeader: false, // false if you don't want a header      
        header: "", // Change in config file. useHeader must be true
        maxWidth: "300px",
        animationSpeed: 3000, // fade speed
        initialLoadDelay: 3250,
        retryDelay: 2500,
        rotateInterval: 30 * 1000, // 30 second rotation of items
        updateInterval: 10 * 60 * 1000, // 10 minutes

    },

    getStyles: function() {
        return ["MMM-AfterShip.css"];
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification('CONFIG', this.config);

        requiresVersion: "2.1.0",

        //  Set locale.
        this.url = "";
        this.AfterShip = {};
        this.activeItem = 0;
        this.rotateInterval = null;
        this.scheduleUpdate();
    },

    getDom: function() {

        var wrapper = document.createElement("div");
        wrapper.className = "wrapper";
        wrapper.style.maxWidth = this.config.maxWidth;

        if (!this.loaded) {
            wrapper.innerHTML = "Where's my shit?";
            wrapper.classList.add("bright", "light", "small");
            return wrapper;
        }

        if (this.config.useHeader != false) {
            var header = document.createElement("header");
            header.classList.add("xsmall", "bright", "header");
            header.innerHTML = this.config.header;
            wrapper.appendChild(header);
        }
		
		// If there are deliveries pending, go through all the data
		if (this.AfterShip.length != 0){


        //	Rotating my data
        var AfterShip = this.AfterShip;
        var AfterShipKeys = Object.keys(this.AfterShip);
        if (AfterShipKeys.length > 0) {
            if (this.activeItem >= AfterShipKeys.length) {
                this.activeItem = 0;
            }
            var AfterShip = this.AfterShip[AfterShipKeys[this.activeItem]];
            var checkpoints = AfterShip['checkpoints']; // another array inside the first array
            //	console.log(checkpoints); // for checking
            //	console.log(this.AfterShip); // for checking


            // My data begins here

            var top = document.createElement("div");
            top.classList.add("list-row");

            // ID of shipment
            var ID = document.createElement("div");
            ID.classList.add("xsmall", "bright", "ID");
            ID.innerHTML = "ID # : " + AfterShip.id;
            wrapper.appendChild(ID);


            // Last update on shipment
            var lastUpdate = document.createElement("div");
            lastUpdate.classList.add("xsmall", "bright", "lastUpdate");
            lastUpdate.innerHTML = "Last update: " + moment(AfterShip.last_updated_at).local().format("ddd, MMM DD, YYYY, h:mm a");
            wrapper.appendChild(lastUpdate);


            // tracking number of shipment
            var tracking_number = document.createElement("div");
            tracking_number.classList.add("xsmall", "bright", "tracking_number");
            tracking_number.innerHTML = "Tracking #: " + AfterShip.tracking_number;
            wrapper.appendChild(tracking_number);


            // Courier name
            var slug = document.createElement("div");
            slug.classList.add("xsmall", "bright", "courier");
            slug.innerHTML = "Courier: " + (AfterShip.slug.toUpperCase());
            wrapper.appendChild(slug);


            // expected_delivery date
            var expected_delivery = document.createElement("div");
            expected_delivery.classList.add("xsmall", "bright", "expected_delivery");
            if (AfterShip.expected_delivery != null) {
                expected_delivery.innerHTML = "Expected delivery on: " + moment(AfterShip.expected_delivery).local().format("ddd, MMM DD, YYYY");
                wrapper.appendChild(expected_delivery);
            } else {
                expected_delivery.innerHTML = "No expected delivery date!";
                wrapper.appendChild(expected_delivery);
            }

            // shipment_type
            var shipment_type = document.createElement("div");
            shipment_type.classList.add("xsmall", "bright", "shipment_type");
            if (AfterShip.shipment_type != null) {
                shipment_type.innerHTML = "Shipping: " + AfterShip.shipment_type;
                wrapper.appendChild(shipment_type);
            } else {
                shipment_type.innerHTML = "Shipping: If you're lucky!";
                wrapper.appendChild(shipment_type);
            }

            // status oh shipment
            var tag = document.createElement("div");
            tag.classList.add("xsmall", "bright", "status");
            tag.innerHTML = "Status: " + AfterShip.tag;
            wrapper.appendChild(tag);


            // Title of shipment (if any)
            var Title = document.createElement("div");
            Title.classList.add("xsmall", "bright", "Title");
            Title.innerHTML = "Title: " + AfterShip.title;
            wrapper.appendChild(Title);

            // objects that are inside an array that is inside an object
            // checkpoint location // only the last object in the array = checkpoints[checkpoints.length -1] @Cowboysdude //
            var location = document.createElement("div");
            location.classList.add("xsmall", "bright", "location");
            if (AfterShip.checkpoints.length != 0) {
                location.innerHTML = "Location: " + AfterShip.checkpoints[checkpoints.length - 1].location; // only the last object in the array = checkpoints[checkpoints.length -1] //
                wrapper.appendChild(location);
            } else {
                location.innerHTML = "Location: Who the fuck knows!";
                wrapper.appendChild(location);
            }


            // objects that are inside an array that is inside an object
            // checkpoint_time // only the last object in the array //
            var checkpoint_time = document.createElement("div");
            checkpoint_time.classList.add("xsmall", "bright", "checkpoint_time");
            if (AfterShip.checkpoints.length != 0) {
                checkpoint_time.innerHTML = "When: " + moment(AfterShip.checkpoints[checkpoints.length - 1].checkpoint_time).local().format("ddd, MMM DD, YYYY, h:mm a");
                wrapper.appendChild(checkpoint_time);
            } else {
                checkpoint_time.innerHTML = "When: Who the fuck cares!";
                wrapper.appendChild(checkpoint_time);
            }


            // objects that are inside an array that is inside an object
            // message from checkpoint // only the last object in the array //
            var message = document.createElement("div");
            message.classList.add("xsmall", "bright", "message");
            if (AfterShip.checkpoints.length != 0) {
                message.innerHTML = "Message: " + AfterShip.checkpoints[checkpoints.length - 1].message;
                wrapper.appendChild(message);
            } else {
                message.innerHTML = "Message: No data from courier!";
                wrapper.appendChild(message);
            }


        } // <-- closes rotation 

        return wrapper;

		} else { // From deliveries pending if statement above
			
			// When there are no pending deliveries, do the following
			var top = document.createElement("div");
            top.classList.add("list-row");

            // When no deliveries are pending
            var nothing = document.createElement("div");
            nothing.classList.add("small", "bright", "nothing");
            nothing.innerHTML = "No deliveries pending!";
            wrapper.appendChild(nothing);
			
			// Current date and time (wherever you are)
            var date = document.createElement("div");
            date.classList.add("small", "bright", "date");
            date.innerHTML = moment().local().format("ddd, MMM DD, YYYY, h:mm a");
            wrapper.appendChild(date);
		
		} // Closes else statement from deliveries pending if statement above

		
		return wrapper;	
		
    }, // <-- closes getDom
	
	
    /////  Add this function to the modules you want to control with voice //////

    notificationReceived: function(notification, payload) {
        if (notification === 'HIDE_SHIPPING') {
            this.hide(1000);
        //    this.updateDom(300);
        }  else if (notification === 'SHOW_SHIPPING') {
            this.show(1000);
        //   this.updateDom(300);
        }
            
    },


    processAfterShip: function(data) {
        this.AfterShip = data;
    //    console.log(this.AfterShip); // for checking //
        this.loaded = true;
    },

    scheduleCarousel: function() {
        //  console.log("Carousel of AfterShip fucktion!"); // for cheking //
        this.rotateInterval = setInterval(() => {
            this.activeItem++;
            this.updateDom(this.config.animationSpeed);
        }, this.config.rotateInterval);
    },

    scheduleUpdate: function() {
        setInterval(() => {
            this.getAfterShip();
        }, this.config.updateInterval);
        this.getAfterShip(this.config.initialLoadDelay);
    },

    getAfterShip: function() {
        this.sendSocketNotification('GET_AFTERSHIP', this.url);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "AFTERSHIP_RESULT") {
            this.processAfterShip(payload);
            if (this.rotateInterval == null) {
                this.scheduleCarousel();
            }
            this.updateDom(this.config.animationSpeed);
        }
        this.updateDom(this.config.initialLoadDelay);
    },
});
