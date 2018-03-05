/* Magic Mirror
 * Module: MMM-Parcel
 *
 * By MartinKooij
 *
 */
Module.register("MMM-Parcel", {
	
	aftershipResults: {trackings: []},

    // Module config defaults.           // Make all changes in your config.js file
    defaults: {
        apiKey: '', // Your free API Key from aftership.com
        maxWidth: "350px",
        animationSpeed: 3000,// fade speed
		maxNumber: 10,
		showCourier: true,
		autoHide: false, // not functional yet.
		isSorted: true,
		isCompact: true,
		hideExpired: false,
        updateInterval: 600000, // 10 minutes
        parcelStatusText: ["Fout", "Mislukte bezorging","In bezorging","Afgeleverd",  "Onderweg", "Ingevoerd", "Wachtend", "Te oud"],
		parcelIconColor: ["red", "red", "blue", "blue", "green", "green", "grey", "grey"],
		onlyDaysFormat: 
			{lastDay : '[gisteren]',
			 sameDay : '[vandaag]',
			 nextDay : '[morgen]',
			 lastWeek : '[afgelopen] dddd',
			 nextWeek : 'dddd',
			 sameElse : 'L'},
		expectedDeliveryText: 'Bezorging verwacht: '
    },

    getStyles: function () {
		return ["font-awesome.css", "MMM-Parcel.css"];
	},
	getScripts: function () {
		return ["moment.js"];
	},

    start: function() {
        Log.info("Starting module: " + this.name);
//		Log.log("Starting module: "+ this.name) ;
        this.sendSocketNotification('CONFIG', this.config);
		this.aftershipResults = {}; 
		this.loaded = false ;
		this.sendSocketNotification('AFTERSHIP_REQUEST', this.config.updateInterval); 	
    },
	

    getDom: function() {
		this.sendSocketNotification('JUST_SAYING',"GETDOM started, " + this.loaded);
        var wrapper = document.createElement("table");
        wrapper.className = "small";
        wrapper.style.maxWidth = this.config.maxWidth;
		const parcelStatus = [ "Exception",  "AttemptFail","OutForDelivery", "Delivered",   "InTransit","InfoReceived","Pending", "Expired"];
		const parcelIcons = [ "fa fa-exclamation-triangle fa-fw", "fa fa-bolt fa-fw", "fa fa-truck fa-fw", "fa fa-check-square-o fa-fw", 
		                     "fa fa-exchange fa-fw", "fa fa-file-text-o fa-fw", "fa fa-clock-o fa-fw", "fa fa-history fa-fw"];
		const parcelStatustext = this.config.parcelStatusText ;
		const parcelIconColor = this.config.parcelIconColor;
		const isCompact = this.config.isCompact;


        if (!this.loaded) {
            wrapper.innerHTML = "Loading Parcel module...";
            wrapper.classList.add("light", "small");
            return wrapper;
        }
		
		var parcelList = this.aftershipResults.trackings;
		this.sendSocketNotification("PARCELLISTLENGTH:", parcelList.length) ;
//		this.sendSocketNotification("PARCELLIST:", JSON.stringify(parcelList)) ;
		
		
		//remove expired deliveries if hideExpired is true;
		var l = [];
		for (var i = 0; i < parcelList.length; i++) {
				if (!(parcelList[i].tag == "Expired" && hideExpired)) {
					l.push(parcelList[i]);
				}
			};

//		Log.log(JSON.stringify(l)) ;
		
		if (l.length == 0) {
			wrapper.innerHTML = "No Data" ;
            wrapper.classList.add("light", "small");
            return wrapper;			
		};
		
		
		if (this.config.isSorted) {
			l = l.sort(function(a,b){return parcelStatus.indexOf(a.tag) - parcelStatus.indexOf(b.tag);});
		};
		
		// If there are deliveries left, go through all the data
		var count = 0 ;
		var p ;
		for (p of l) {
//			this.sendSocketNotification("PARCEL No", count+1 + ": " + JSON.stringify(p)) ;
			
			if (count++ == this.config.maxNumber) { break; };
			
			// headerline 
			var parcelWrapperheaderline = document.createElement("tr");
			parcelWrapperheaderline.className = "ParcelHeader";
			var extraWrapperHeaderLine = document.createElement("tr");
			extraWrapperHeaderLine.className = "ParcelInfo";
			var parcelName = (("title" in p) && p.title != null)?p.title:p.tracking_number;
			
				// icon 
//				this.sendSocketNotification("ICON:", (JSON.stringify(parcelIcons[parcelStatus.indexOf(p.tag)]))) ;
				parcelWrapperheaderline.appendChild(this.makeParcelIconWrapper(parcelIcons[parcelStatus.indexOf(p.tag)], parcelIconColor[parcelStatus.indexOf(p.tag)]));
				
				// parcelname and status (in text) 
				var headerwrapper = document.createElement("td");
				headerwrapper.colSpan = (isCompact)?"2":"3";
				headerwrapper.style.whiteSpace = "nowrap";
				headerwrapper.innerHTML = parcelName + " (" + parcelStatustext[parcelStatus.indexOf(p.tag)] + 
					((this.config.showCourier)?(
						((parcelStatustext[parcelStatus.indexOf(p.tag)] != "")?", ":"") + p.slug):
						"") + 
					")" ;
				parcelWrapperheaderline.appendChild(headerwrapper);
				
				// if present: time in locale + clock icon
//				this.sendSocketNotification("COMPLETED: ", "the parcelinfo part of the header") ;

				var deliverywrapper = document.createElement("td");
				deliverywrapper.innerHTML = "";
				if ( (p.expected_delivery != null) && p.expected_delivery != "") {
					if (!isCompact) {
						if (p.expected_delivery.includes("T")) {
							deliverywrapper.innerHTML = this.config.expectedDeliveryText + moment(p.expected_delivery).calendar();
						} else {
							deliverywrapper.innerHTML = this.config.expectedDeliveryText + moment(p.expected_delivery).calendar(null,this.config.onlyDaysFormat);
						}
					} else {
						var startofDay = moment().startOf("day") ;
						var delivery = moment(p.expected_delivery)
						today = delivery >= startofDay &&  delivery < (startofDay + 24 * 60 * 60 * 1000);
						thisweek = delivery >= (startofDay + 24 * 60 * 60 * 1000) && delivery < (startofDay + 7 * 24 * 60 * 60 * 1000);
						console.log ("PARCEL:", count+1,", TODAY = ", today) ;
						if (today) {
							deliverywrapper.innerHTML = moment(p.expected_delivery).format('LT');
						} else if (thisweek) {
							if (p.expected_delivery.includes("T")) {
								deliverywrapper.innerHTML = moment(p.expected_delivery).format('dd LT');
							} else {
								deliverywrapper.innerHTML = moment(p.expected_delivery).format('dddd');
							}
						} else {
							deliverywrapper.innerHTML = moment(p.expected_delivery).format('L');
						}
					}
				}
				

			if (isCompact) {
				deliverywrapper.align = "right" ;
				deliverywrapper.className = "ParcelTimeCompact" ;
				parcelWrapperheaderline.appendChild(deliverywrapper);
				wrapper.appendChild(parcelWrapperheaderline);
				headerwrapper.innerHTML = (headerwrapper.innerHTML.length > 40)?(headerwrapper.innerHTML.slice(0,36)+ "... "):headerwrapper.innerHTML;
			} else {
				wrapper.appendChild(parcelWrapperheaderline);
				if ((p.expected_delivery != null) && p.expected_delivery != "") {
					var clockicon;		
					clockicon = this.makeParcelIconWrapper("fa fa-clock-o fa-fw");
					deliverywrapper.colSpan = "2";
					extraWrapperHeaderLine.appendChild(this.makeParcelIconWrapper("fa fa-fw"));
					extraWrapperHeaderLine.appendChild(clockicon);
					extraWrapperHeaderLine.appendChild(deliverywrapper);
					wrapper.appendChild(extraWrapperHeaderLine);
				}
			}
				

//			this.sendSocketNotification("COMPLETED: ", "the wrapperheaderline(s)") ;
			
			// infoline (if relevant)
			if ((p.checkpoints != undefined) && p.checkpoints.length != 0) { 
				var parcelWrapperinfoline = document.createElement("tr") ;
				parcelWrapperinfoline.className = "ParcelInfo"; 
//				parcelWrapperinfoline.style.color = "grey";
				var lastLoc = p.checkpoints[p.checkpoints.length-1];
				
				// empty icon for indent
				parcelWrapperinfoline.appendChild(this.makeParcelIconWrapper("fa-fw"));
				// location icon 
				parcelWrapperinfoline.appendChild(this.makeParcelIconWrapper("fa fa-location-arrow fa-fw"));
				// last location + location message
				
//				Log.log(JSON.stringify(lastLoc));
//				Log.log(lastLoc.city);
//				Log.log(lastLoc.state);
//				Log.log(lastLoc.country_name);
//				Log.log(lastLoc.message);
				
				var infotextwrapper = document.createElement("td");
				infotextwrapper.colSpan = "2";
				var extraInfoText = ((lastLoc.city != null)?(lastLoc.city + ", "):"") + 
					((lastLoc.state != null)?(lastLoc.state + ", "):"") + 
					lastLoc.country_name + 
					((lastLoc.message != null)?": ":"") +
					lastLoc.message ;
//				this.sendSocketNotification("EXTRA LINEINFO:",extraInfoText) ;
//				infotextwrapper.style.whiteSpace = "nowrap";
				infotextwrapper.innerHTML = extraInfoText ;
				parcelWrapperinfoline.appendChild(infotextwrapper);
				// add infoline
				wrapper.appendChild(parcelWrapperinfoline);					
			}
		}
        return wrapper; 
		
    }, // <-- closes getDom
	


    socketNotificationReceived: function(notification, payload) {
        if (notification === 'AFTERSHIP_RESULT') {
//			Log.log('AFTERSHIP RESULT Notification received back') ;
			this.loaded = true ;
			this.aftershipResults = payload ;
			this.updateDom(this.config.animationSpeed);
		} else {
			this.sendSocketNotification("WEIRD NOTIFICATION RECEIVED:", notification + ", " + payload) ;
		}
    },
	
	makeParcelIconWrapper:  function(icon, color) {
		var iconwrapper = document.createElement("td");
		iconwrapper.width = "27px" ;
		iconwrapper.innerHTML = '<i class="'+ icon + '"></i>';
		if (color != null ) {iconwrapper.style.color = color ;};
		return iconwrapper;
	}
	
});
