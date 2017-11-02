Module.register("MMM-AfterShip", {

    // Module config defaults.           // Make all changes in your config.js file
    defaults: {
// 		apiKey: "",                      // Your API Key
        useHeader: false,                 // false if you don't want a header      
        header: "",                      // Change in config file. useHeader must be true
        maxWidth: "300px",
        animationSpeed: 3000,            // fade speed
        initialLoadDelay: 3250,
        retryDelay: 2500,
        rotateInterval: 20 * 1000,   // 5 minutes
        updateInterval: 30 * 60 * 1000,  

    },

    getStyles: function() {
        return ["MMM-AfterShip.css"];
    },

    start: function() {
        Log.info("Starting module: " + this.name);

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
		
		
	//	Rotating my data
//		var AfterShip = this.AfterShip;
//		var AfterShipKeys = Object.keys(this.AfterShip);
//        if (AfterShipKeys.length > 0) {
//            if (this.activeItem >= AfterShipKeys.length) {
//                this.activeItem = 0;
//            }
//            var AfterShip = this.AfterShip[AfterShipKeys[this.activeItem]];
		
//		console.log(this.AfterShip); // for checking
	

        var top = document.createElement("div");
        top.classList.add("list-row");
		
		
		// origin
//        var origin = document.createElement("div");
 //       origin.classList.add("xsmall", "bright", "origin");
 //       origin.innerHTML = "Origin: " + this.origin;
 //       wrapper.appendChild(origin);
		
		
//		// destination
//        var destination = document.createElement("div");
 //       destination.classList.add("xsmall", "bright", "destination");
//        destination.innerHTML = "Destination: " + this.destination;
 //       wrapper.appendChild(destination);
		
		
		
		
		
        // ID
        var ID = document.createElement("div");
        ID.classList.add("xsmall", "bright", "ID");
        ID.innerHTML = "ID # : " + this.trackings[0].id;
        wrapper.appendChild(ID);
		
		
		// Last update
        var lastUpdate = document.createElement("div");
        lastUpdate.classList.add("xsmall", "bright", "lastUpdate");
        lastUpdate.innerHTML = "Last update: " + this.trackings[0].last_updated_at;
        wrapper.appendChild(lastUpdate);
		
		
		// tracking number
        var tracking_number = document.createElement("div");
        tracking_number.classList.add("xsmall", "bright", "tracking_number");
        tracking_number.innerHTML = "Tracking #: " + this.trackings[0].tracking_number;
        wrapper.appendChild(tracking_number);
		
		
		// Courier
        var slug = document.createElement("div");
        slug.classList.add("xsmall", "bright", "courier");
        slug.innerHTML = "Courier: " + this.trackings[0].slug;
        wrapper.appendChild(slug);
		
		
		
		// expected_delivery
        var expected_delivery = document.createElement("div");
        expected_delivery.classList.add("xsmall", "bright", "expected_delivery");
        expected_delivery.innerHTML = "Expected delivery on: " + this.trackings[0].expected_delivery;
        wrapper.appendChild(expected_delivery);
		
		
		// shipment_type
        var shipment_type = document.createElement("div");
        shipment_type.classList.add("xsmall", "bright", "shipment_type");
        shipment_type.innerHTML = "Shipping: " + this.trackings[0].shipment_type;
        wrapper.appendChild(shipment_type);
		
		
		// status
        var tag = document.createElement("div");
        tag.classList.add("xsmall", "bright", "status");
        tag.innerHTML = "Status: " + this.trackings[0].tag;
        wrapper.appendChild(tag);
		
		
		// Title
        var Title = document.createElement("div");
        Title.classList.add("xsmall", "bright", "Title");
        Title.innerHTML = "Title: " + this.trackings[0].title;
        wrapper.appendChild(Title);
		
		
		
		
		
		
		
//		}  // closes rotation 
		
        return wrapper;
    },


    processAfterShip: function(data) {
        this.AfterShip = data;
		console.log(this.AfterShip);
        this.loaded = true;
    },

    scheduleCarousel: function() {
        console.log("Carousel of AfterShip fucktion!");
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
