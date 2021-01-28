/* Magic Mirror
 * Module: MMM-Parcel
 *
 * By MartinKooij
 *
 */
Module.register("MMM-Parcel", {
	
	parcelList: [],

	// Module config defaults.		   
	// Make all changes in your config.js file
	defaults: {
		apiKey: '',
		maxWidth: "450px",
		forceNarrow: false,
		forceWide: false,
		animationSpeed: 2500,
		maxNumber: 10,
		showCourier: true,
		autoHide: false, //do not autoHide is the default
		isSorted: true,
		compactness: -1, // 0 = elaborate, 1 = compact, 2 = very compact, -1 = automatic
		hideExpired: true,
		autoTranslate: null,
		useGoogleTranslate: false,
		updateInterval: 600000, // 10 minutes
		parcelStatusText: ["Exception", "Failed Attempt", "In Delivery", "In Transit", "Info Received", "Not Found", "Delivered", "Expired"],
		parcelIconColor: ["red", "red", "green", "green", "cornflowerblue", "cornflowerblue", "grey", "grey"],
		onlyDaysFormat: 
			{lastDay : '[Yesterday]',
			 sameDay : '[Today]',
			 nextDay : '[Tomorrow]',
			 lastWeek : '[Last] dddd',
			 nextWeek : 'dddd',
			 sameElse : 'L'},
		expectedDeliveryText: 'Expected delivery: ', // Not in use with tracktry
		lastUpdateText: 'Last Update: ', // New with tracktry
		noParcelText : 'No Shipment Data',
		debug: false,
		testRead: false
	},

	getStyles: function () {
		return ["MMM-Parcel.css"];
	},
	getScripts: function () {
		return ["moment.js"];
	},
	

	start: function() {
		Log.info("Starting My Magic Module: " + this.name);
		this.parcelList = []; 
		this.loaded = false;
		this.sendSocketNotification('CONFIG', this.config);
		this.sendSocketNotification("INTERVAL_SET", this.config.updateInterval);
		this.sendSocketNotification('API_FETCHER');	 
	},
	
	heyIamHere: null,
	
	suspend : function() {
		this.sendSocketNotification("INTERVAL_SET", Math.max(60 * 60 * 1000,this.config.updateInterval*2));
	},
	
	resume: function() {
		this.sendSocketNotification("INTERVAL_SET", this.config.updateInterval);
	},

	getDom: function() {
		// assumes a normalized and valid parcelList is received from the API_FETCHER socket
		var wrapper = document.createElement("table");
		wrapper.className = "small";
		wrapper.style.maxWidth = this.config.maxWidth;
		const parcelStatus = [ "exception", "undelivered", "pickup", "transit", "pending", "notfound", "delivered", "expired"];
		const parcelIcons = [ "fas fa-exclamation-triangle fa-fw", "fas fa-bolt fa-fw", "fas fa-truck fa-fw", "fas fa-exchange-alt fa-fw",
							  "far fa-file-alt fa-fw", "fas fa-question fa-fw", "far fa-check-square fa-fw", "fas fa-history fa-fw"];
		const parcelStatustext = this.config.parcelStatusText;
		const parcelIconColor = this.config.parcelIconColor;

		var now = new Date();
		if (!this.heyIamHere) {
			this.heyIamHere = now;
		}

		if (this.config.momentLocale) {moment.locale(this.config.momentLocale);}
		
		if (moment(now).format("L") != moment(this.heyIamHere).format("L")) {
			this.heyIamHere.setFullYear(now.getFullYear());
			this.heyIamHere.setMonth(now.getMonth());
			this.heyIamHere.setDate(now.getDate());
			this.heyIamHere.setHours(Math.floor(Math.random() * 17)+6);
			this.heyIamHere.setMinutes(0);
			this.heyIamHere.setSeconds(0);
		}

		var later = new Date(this.heyIamHere.getTime() + 30*60*1000);
		var showAnyway = (now >= this.heyIamHere && now <= later);	
		
		if (!this.loaded) {
			wrapper.innerHTML = "Loading Parcel module...";
			wrapper.classList.add("light", "small");
			return wrapper;
		}
		
		if (this.config.debug) {this.sendSocketNotification("PARCELLIST LENGTH:", this.parcelList.length);}

		//remove expired/delivered deliveries if hideExpired / hideDelivered is true;
		var l = [];
		for (var i = 0; i < this.parcelList.length; i++) {
			if 	(
				!( 
				((this.config.hideDelivered === true) && this.parcelList[i].status == "delivered") ||
				(this.parcelList[i].status == "delivered" && Number.isInteger(this.config.hideDelivered) &&  moment().diff(this.parcelList[i].updated_at,'days') >= this.config.hideDelivered)
				)&& 
				!(this.config.hideExpired && this.parcelList[i].status == "expired")
				) {
				l.push(this.parcelList[i]);
			}
		}

		if (this.config.debug) {this.sendSocketNotification("PARCELLIST NOHIDDEN LENGTH:", l.length);}
						
		if (l.length === 0) {
			wrapper.innerHTML = this.config.noParcelText;
			wrapper.classList.add("light", "small");
			
			if (showAnyway) {
				if (this.hidden) { 
					this.show(0,{lockString: this.name});
				}
				return wrapper;
			}

			if (this.config.autoHide &&	(this.lockStrings.indexOf(this.name) == -1)) {
				this.hide(0,{lockString: this.name});
			}
			
			return wrapper;			
		}
		
		if (this.config.autoHide && this.hidden) {
			this.show(0,{lockString: this.name});
		}
		
		var isCompact = this.config.compactness == 1 || this.config.compactness == 2;
		var isveryCompact = this.config.compactness == 2;
		if (this.config.compactness == -1) {
			isCompact = (Math.min(l.length,this.config.maxNumber) > 3);
			isveryCompact = (Math.min(l.length,this.config.maxNumber) > 6);
		}
		
		var isNarrow = Number(this.config.maxWidth.replace(/[^0-9]/g,"")) < 400;
		isNarrow = this.config.forceNarrow || isNarrow ;
		isNarrow = !(this.config.forceWide) && isNarrow ;
		
		if (this.config.isSorted) {
			l = l.sort(function(a,b){return parcelStatus.indexOf(a.status) - parcelStatus.indexOf(b.status);});
		}
		
		// If there are deliveries left, go through all the data
		var count = 0;
		for (let p of l) {
			if (count++ == this.config.maxNumber) { break; }
			
			// headerline 
			var parcelWrapperheaderline = document.createElement("tr");
			parcelWrapperheaderline.className = "ParcelHeader";
			var extraClockline = document.createElement("tr");
			extraClockline.className = "ParcelInfo";
			var parcelName = (p.title)? ( (p.title != "")?p.title:p.tracking_code ) : p.tracking_code ;
			var thisParcelIcon = this.makeParcelIconWrapper(parcelIcons[parcelStatus.indexOf(p.status)], parcelIconColor[parcelStatus.indexOf(p.status)]);
			var lastLoc = p.last_loc ;
			var headerSlug = "";
			var timeSlug = "";
			var headerStatus = parcelStatustext[parcelStatus.indexOf(p.status)];
			
			if (isNarrow && !isveryCompact && this.config.showCourier) {
				timeSlug = p.courier_code ;
			} else if (this.config.showCourier) {
				headerSlug = p.courier_code ;
			}
				
				// icon 
				parcelWrapperheaderline.appendChild(thisParcelIcon);
				
				// parcelname, and possibly status & courier slug
				var headerwrapper = document.createElement("td");
				headerwrapper.className = "no-wrap";
				headerwrapper.innerHTML = parcelName + 
					((headerStatus || headerSlug)?" (":"") + 
					headerStatus +
					((headerStatus && headerSlug)?",":"") +
					headerSlug + 
					((headerStatus || headerSlug)?")":"");
					

				
				//time formatting
				var timeFormat;
				if (isNarrow && isveryCompact) {
					timeFormat = 0; //minimum forma, only time if today. 
				} else if (isCompact && !isNarrow) {
					timeFormat = 1; //compact format, date or time in numbers
				} else {
					timeFormat = 2; //verbose format
				}
				
				headerwrapper.colSpan = (timeFormat === 2)?"3":"2";
				parcelWrapperheaderline.appendChild(headerwrapper);
				
				var clockTime = null;
				if ( lastLoc && (lastLoc.time) ){
					clockTime = lastLoc.time;
				} else {
					clockTime = p.updated_time ;
				}
				
				var deliverywrapper = document.createElement("td");
				deliverywrapper.innerHTML = "";
				
				if ( clockTime ) {
					var startofDay = moment().startOf("day");
					var delivery = moment(clockTime);
					var today = delivery >= startofDay &&  delivery < (startofDay + 24 * 60 * 60 * 1000);
					var thisweek = delivery >= (startofDay + 24 * 60 * 60 * 1000) && delivery < (startofDay + 7 * 24 * 60 * 60 * 1000);
					if (timeFormat === 2) {
						if (clockTime.includes("T") || clockTime.includes(":")) {
							deliverywrapper.innerHTML = this.config.lastUpdateText + 
							moment(clockTime).calendar();
						} else {
							deliverywrapper.innerHTML = this.config.lastUpdateText + 
							moment(clockTime).calendar(null,this.config.onlyDaysFormat);
						}
					} else if (timeFormat === 1) {
						if (today) {
							deliverywrapper.innerHTML = moment(clockTime).format('LT');
						} else if (thisweek) {
							if (clockTime.includes("T") || clockTime.includes(":")) {
								deliverywrapper.innerHTML = moment(clockTime).format('dd LT');
							} else {
								deliverywrapper.innerHTML = moment(clockTime).format('dddd');
							}
						} else {
							deliverywrapper.innerHTML = moment(clockTime).format('L');
						}
					} else { //timeFormat === 0
						if (today && (clockTime.includes("T") || clockTime.includes(":"))) {
							deliverywrapper.innerHTML = moment(clockTime).format((config.timeFormat==24)?"HH:mm":"ha");
						} else if (thisweek) {
							deliverywrapper.innerHTML = moment(clockTime).format('dd');
						}
					}	
				}
				
			
			//append the calculated clock time text to the header according to Compact/Separate line option. 
			if (timeFormat === 1) {
				deliverywrapper.align = "right";
				deliverywrapper.className = "ParcelTimeCompact";
				deliverywrapper.style.whiteSpace = "nowrap";
				deliverywrapper.style.width = "100px";
				parcelWrapperheaderline.appendChild(deliverywrapper);
				headerwrapper.style.maxWidth = "calc("+ this.config.maxWidth + " - 120px)";
			} else if (timeFormat === 0) {
				deliverywrapper.align = "right";
				deliverywrapper.className = "ParcelTimeCompact";
				deliverywrapper.style.width = "60px";
				deliverywrapper.style.whiteSpace = "nowrap";
				parcelWrapperheaderline.appendChild(deliverywrapper);
				headerwrapper.style.maxWidth = "calc("+ this.config.maxWidth + " - 80px)";
			}

			wrapper.appendChild(parcelWrapperheaderline);
			
			if (clockTime && (timeFormat === 2)) {
				var clockicon;		
				clockicon = this.makeParcelIconWrapper("fa fa-clock-o fa-fw");
				deliverywrapper.colSpan = "2";
				if (isNarrow && timeSlug) {
					deliverywrapper.innerHTML = deliverywrapper.innerHTML + " (" + timeSlug + ")";
				}
				extraClockline.appendChild(this.makeParcelIconWrapper("fa fa-fw"));
				extraClockline.appendChild(clockicon);
				extraClockline.appendChild(deliverywrapper);
			}
			

			// infoline (if relevant)
			if (lastLoc) { 
				var parcelWrapperinfoline = document.createElement("tr");
				parcelWrapperinfoline.className = "ParcelInfo"; 
				// empty icon for indent
				parcelWrapperinfoline.appendChild(this.makeParcelIconWrapper("fa-fw"));
				// location icon 
				parcelWrapperinfoline.appendChild(this.makeParcelIconWrapper("fa fa-location-arrow fa-fw"));
				// last location + location message
				var infotextwrapper = document.createElement("td");
				infotextwrapper.colSpan = "2";

				var extraInfoText = "";
				var message = lastLoc.info
				var sepNeed = false;
				
				if (lastLoc.details && lastLoc.details.trim().length != 0) {
					extraInfoText += lastLoc.details;
					sepNeed = true;
				}

				if (message != null) {
					extraInfoText = message + (sepNeed?", ":"") + extraInfoText;
				}


				infotextwrapper.innerHTML = extraInfoText;
				//change delivered icon color to "OutforDelivery" color if still to be collected
				if ( p.tobe_collected && p.status === "delivered" ) {
					thisParcelIcon.style.color = parcelIconColor[parcelStatus.indexOf("pickup")];
				}
				parcelWrapperinfoline.appendChild(infotextwrapper);
				// add infoline unless very compact style
				if (! (isveryCompact || (isNarrow && isCompact))) { wrapper.appendChild(parcelWrapperinfoline);}					
			}
			
			if ((clockTime && !isCompact) || (clockTime && isNarrow && !isveryCompact)) {
				wrapper.appendChild(extraClockline);
			}
		}
		
		return wrapper; 
		
	}, // <-- closes getDom
	


	socketNotificationReceived: function(notification, payload) {
		if (notification === 'API_RESULT') {
			this.loaded = true;
			this.parcelList = payload;
			this.updateDom(this.config.animationSpeed);
		} else {
			this.sendSocketNotification("WEIRD NOTIFICATION RECEIVED:", notification + ", " + payload);
		}
	},
	
	makeParcelIconWrapper:  function(icon, color) {
		var iconwrapper = document.createElement("td");
		iconwrapper.width = "27px";
		iconwrapper.innerHTML = '<i class="'+ icon + '"></i>';
		if (color != null ) {iconwrapper.style.color = color;}
		return iconwrapper;
	}
	
});
