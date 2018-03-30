/* Magic Mirror
 * Module: MMM-Parcel
 *
 * By MartinKooij
 *
 */
Module.register("MMM-Parcel", {
	
	aftershipResults: {trackings: []},

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
		updateInterval: 600000, // 10 minutes
		parcelStatusText: ["Exception", "Failed Attempt", "In Delivery", "In Transit", "Info Received", "Pending", "Delivered", "Expired"],
		parcelIconColor: ["red", "red", "green", "green", "cornflowerblue", "cornflowerblue", "grey", "grey"],
		onlyDaysFormat: 
			{lastDay : '[Yesterday]',
			 sameDay : '[Today]',
			 nextDay : '[Tomorrow]',
			 lastWeek : '[Last] dddd',
			 nextWeek : 'dddd',
			 sameElse : 'L'},
		expectedDeliveryText: 'Delivery expected: ',
		noParcelText : 'No Shipment Data',
		debug: false
	},

	getStyles: function () {
		return ["font-awesome.css", "MMM-Parcel.css"];
	},
	getScripts: function () {
		return ["moment.js"];
	},

	start: function() {
		Log.info("Starting module: " + this.name);
		this.aftershipResults = {trackings:[]}; 
		this.loaded = false;
		this.sendSocketNotification('CONFIG', this.config);
		this.sendSocketNotification("INTERVAL_SET", this.config.updateInterval);
		this.sendSocketNotification('AFTERSHIP_FETCHER');	 
	},
	
	heyIamHere: null,
	
	suspend : function() {
		this.sendSocketNotification("INTERVAL_SET", Math.max(900000,this.config.updateInterval*2));
	},
	
	resume: function() {
		this.sendSocketNotification("INTERVAL_SET", this.config.updateInterval);
	},

	getDom: function() {
		var wrapper = document.createElement("table");
		wrapper.className = "small";
		wrapper.style.maxWidth = this.config.maxWidth;
		const parcelStatus = [ "Exception", "AttemptFail", "OutForDelivery", "InTransit", "InfoReceived", "Pending", "Delivered", "Expired"];
		const parcelIcons = [ "fa fa-exclamation-triangle fa-fw", "fa fa-bolt fa-fw", "fa fa-truck fa-fw", "fa fa-exchange fa-fw",
							  "fa fa-file-text-o fa-fw", "fa fa-clock-o fa-fw", "fa fa-check-square-o fa-fw", "fa fa-history fa-fw"];
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
		
		var parcelList = this.aftershipResults.trackings;
		if (this.config.debug) {this.sendSocketNotification("PARCELLISTLENGTH:", parcelList.length);}

		//remove expired/delivered deliveries if hideExpired / hideDelivered is true;
		var l = [];
		for (var i = 0; i < parcelList.length; i++) {
			if 	(
				!( 
				((this.config.hideDelivered === true) && parcelList[i].tag == "Delivered") ||
				(parcelList[i].tag == "Delivered" && Number.isInteger(this.config.hideDelivered) &&  moment().diff(parcelList[i].updated_at,'days') >= this.config.hideDelivered)
				)&& 
				!
				(this.config.hideExpired && parcelList[i].tag == "Expired")
				) {
				l.push(parcelList[i]);
			}
		}
						
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
			l = l.sort(function(a,b){return parcelStatus.indexOf(a.tag) - parcelStatus.indexOf(b.tag);});
		}
		
		// If there are deliveries left, go through all the data
		var count = 0;
		for (let p of l) {
		if (this.config.debug) {this.sendSocketNotification("PACKAGE: ", JSON.stringify(p));}
			if (count++ == this.config.maxNumber) { break; }
			
			// headerline 
			var parcelWrapperheaderline = document.createElement("tr");
			parcelWrapperheaderline.className = "ParcelHeader";
			var extraClockline = document.createElement("tr");
			extraClockline.className = "ParcelInfo";
			var parcelName = p.title || p.tracking_number;
			var thisParcelIcon = this.makeParcelIconWrapper(parcelIcons[parcelStatus.indexOf(p.tag)], parcelIconColor[parcelStatus.indexOf(p.tag)]);
			var lastLoc = ( (p.checkpoints) && p.checkpoints.length != 0 )?p.checkpoints[p.checkpoints.length-1]:null;
			var headerSlug = "";
			var timeSlug = "";
			var headerStatus = parcelStatustext[parcelStatus.indexOf(p.tag)];
			
			if (isNarrow && !isveryCompact && this.config.showCourier) {
				timeSlug = p.slug ;
			} else if (this.config.showCourier) {
				headerSlug = p.slug ;
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
				
				var clockTime = p.expected_delivery;
				if ( !(clockTime) && lastLoc && (lastLoc.checkpoint_time) ){
					clockTime = lastLoc.checkpoint_time;
				}	
				
				var deliverywrapper = document.createElement("td");
				deliverywrapper.innerHTML = "";
				
				if ( clockTime ) {
					var startofDay = moment().startOf("day");
					var delivery = moment(clockTime);
					var today = delivery >= startofDay &&  delivery < (startofDay + 24 * 60 * 60 * 1000);
					var thisweek = delivery >= (startofDay + 24 * 60 * 60 * 1000) && delivery < (startofDay + 7 * 24 * 60 * 60 * 1000);
					if (timeFormat === 2) {
						if (clockTime.includes("T")) {
							deliverywrapper.innerHTML = (p.expected_delivery?this.config.expectedDeliveryText:"") + 
							moment(clockTime).calendar();
						} else {
							deliverywrapper.innerHTML = (p.expected_delivery?this.config.expectedDeliveryText:"") + 
							moment(clockTime).calendar(null,this.config.onlyDaysFormat);
						}
					} else if (timeFormat === 1) {
						if (today) {
							deliverywrapper.innerHTML = moment(clockTime).format('LT');
						} else if (thisweek) {
							if (clockTime.includes("T")) {
								deliverywrapper.innerHTML = moment(clockTime).format('dd LT');
							} else {
								deliverywrapper.innerHTML = moment(clockTime).format('dddd');
							}
						} else {
							deliverywrapper.innerHTML = moment(clockTime).format('L');
						}
					} else { //timeFormat === 0
						if (today && clockTime.includes("T")) {
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
			if (((p.checkpoints) != undefined) && p.checkpoints.length != 0) { 
				var parcelWrapperinfoline = document.createElement("tr");
				parcelWrapperinfoline.className = "ParcelInfo"; 
				lastLoc = p.checkpoints[p.checkpoints.length-1];
				// empty icon for indent
				parcelWrapperinfoline.appendChild(this.makeParcelIconWrapper("fa-fw"));
				// location icon 
				parcelWrapperinfoline.appendChild(this.makeParcelIconWrapper("fa fa-location-arrow fa-fw"));
				// last location + location message
				var infotextwrapper = document.createElement("td");
				infotextwrapper.colSpan = "2";

				var extraInfoText = "";
				var message = (lastLoc.translated_message)?lastLoc.translated_message:lastLoc.message;
				var sepNeed = false;
				if (lastLoc.city != null) {
					extraInfoText += lastLoc.city;
					sepNeed = true;
				}
				if (lastLoc.state != null) {
					if (sepNeed) { extraInfoText += ","; }
					extraInfoText += lastLoc.state;
					sepNeed = true;
				}
				if (lastLoc.country_name != null) {
					if (sepNeed) { extraInfoText += ","; }
					extraInfoText += lastLoc.country_name;
					sepNeed = true;
				}
				if (message != null) {
					if (sepNeed) { extraInfoText += ": "; }
					extraInfoText += message;
					sepNeed = true;
				}

				infotextwrapper.innerHTML = extraInfoText;
				//change delivered icon color to "OutforDelivery" color if still to be collected
				if ( lastLoc && lastLoc.message && lastLoc.message.indexOf("to be collected") != -1 && p.tag === "Delivered" ) {
					thisParcelIcon.style.color = parcelIconColor[parcelStatus.indexOf("OutForDelivery")];
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
		if (notification === 'AFTERSHIP_RESULT') {
			this.loaded = true;
			this.aftershipResults = payload;
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
