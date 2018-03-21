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
        animationSpeed: 2500,
        maxNumber: 10,
        showCourier: true,
        autoHide: false, //do not autoHide is the default
        isSorted: true,
        compactness: -1, // 0 = elaborate, 1 = compact, 2 = very compact, -1 = automatic
        hideExpired: false,
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
        noParcelText : 'No Shipment Data'
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
        
//        this.sendSocketNotification("showanyway :", showAnyway);
        
        if (!this.loaded) {
            wrapper.innerHTML = "Loading Parcel module...";
            wrapper.classList.add("light", "small");
            return wrapper;
        }
        
        var parcelList = this.aftershipResults.trackings;
//        this.sendSocketNotification("PARCELLISTLENGTH:", parcelList.length);

        //remove expired/delivered deliveries if hideExpired / hideDelivered is true;
        var l = [];
        for (var i = 0; i < parcelList.length; i++) {
                if (!(this.config.hideDelivered && parcelList[i].tag == "Delivered") && !(this.config.hideExpired && parcelList[i].tag == "Expired" )) {
                    l.push(parcelList[i]);
                }
            }
            
            
//        this.sendSocketNotification("AUTOHIDE:", this.config.autoHide.toString() + ", " + this.name + ", " + JSON.stringify(this.lockStrings));                
        if (l.length === 0) {
            wrapper.innerHTML = noParcelText;
            wrapper.classList.add("light", "small");
            
            if (showAnyway) {
                if (this.hidden) { 
                    this.show(0,{lockString: this.name});
                }
                return wrapper;
            }

            if (this.config.autoHide &&    (this.lockStrings.indexOf(this.name) == -1)) {
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

        
        if (this.config.isSorted) {
            l = l.sort(function(a,b){return parcelStatus.indexOf(a.tag) - parcelStatus.indexOf(b.tag);});
        }
        
        // If there are deliveries left, go through all the data
        var count = 0;
        for (let p of l) {
            
            if (count++ == this.config.maxNumber) { break; };
            
            // headerline 
            var parcelWrapperheaderline = document.createElement("tr");
            parcelWrapperheaderline.className = "ParcelHeader";
            var extraWrapperHeaderLine = document.createElement("tr");
            extraWrapperHeaderLine.className = "ParcelInfo";
            var parcelName = (("title" in p) && p.title != null)?p.title:p.tracking_number;
            var thisParcelIcon = this.makeParcelIconWrapper(parcelIcons[parcelStatus.indexOf(p.tag)], parcelIconColor[parcelStatus.indexOf(p.tag)])
            var lastLoc = ( (p.checkpoints) && p.checkpoints.length != 0 )?p.checkpoints[p.checkpoints.length-1]:null;
			
                // icon 
                parcelWrapperheaderline.appendChild(thisParcelIcon);
                
                // parcelname, and possibly status & courier slug
                var headerwrapper = document.createElement("td");
                headerwrapper.colSpan = (isCompact)?"2":"3";
                headerwrapper.className = "no-wrap";
                headerwrapper.innerHTML = parcelName + " (" + parcelStatustext[parcelStatus.indexOf(p.tag)] + 
                    ((this.config.showCourier)?(
                        ((parcelStatustext[parcelStatus.indexOf(p.tag)] != "")?", ":"") + p.slug):
                        "") + 
                    ")";
                    
                parcelWrapperheaderline.appendChild(headerwrapper);
                
                // expected delivery time with inconspicuous formatting depending on options. 
                // empty text if date and time not known. Only days if date known and time unknown. 
                var deliverywrapper = document.createElement("td");
                deliverywrapper.innerHTML = "";
				var clockTime = p.expected_delivery;
				if ( !(clockTime) && ( p.tag === "Delivered") && lastLoc ){
                    clockTime = lastLoc.checkpoint_time;
                }
				if ( !(clockTime) && lastLoc && (lastLoc.checkpoint_time) && 
                     (moment().diff(moment(lastLoc.checkpoint_time),'days') > 3 )){
                   clockTime = lastLoc.checkpoint_time;
                }				   
                if ( clockTime ) {
                    if (!isCompact) {
                        if (clockTime.includes("T")) {
                            deliverywrapper.innerHTML = (p.expected_delivery?this.config.expectedDeliveryText:"") + 
                              moment(clockTime).calendar();
                        } else {
                             deliverywrapper.innerHTML = (p.expected_delivery?this.config.expectedDeliveryText:"") + 
                              moment(clockTime).calendar(null,this.config.onlyDaysFormat);
                        }
                    } else {
                        var startofDay = moment().startOf("day");
                        var delivery = moment(clockTime);
                        today = delivery >= startofDay &&  delivery < (startofDay + 24 * 60 * 60 * 1000);
                        thisweek = delivery >= (startofDay + 24 * 60 * 60 * 1000) && delivery < (startofDay + 7 * 24 * 60 * 60 * 1000);
//						this.sendSocketNotification("TODAY", JSON.stringify(today) + " THISWEEK " + JSON.stringify(thisweek));
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
                    }
                }
                
            //place the delivery time text according to Compact/Separate line option. 
            if (isCompact) {
                deliverywrapper.align = "right";
                deliverywrapper.className = "ParcelTimeCompact";
                deliverywrapper.style.whiteSpace = "nowrap";
                parcelWrapperheaderline.appendChild(deliverywrapper);
                wrapper.appendChild(parcelWrapperheaderline);
                headerwrapper.style.maxWidth = "calc("+ this.config.maxWidth + " - 110px)"
            } else {
                wrapper.appendChild(parcelWrapperheaderline);
                if (clockTime) {
                    var clockicon;        
                    clockicon = this.makeParcelIconWrapper("fa fa-clock-o fa-fw");
                    deliverywrapper.colSpan = "2";
                    extraWrapperHeaderLine.appendChild(this.makeParcelIconWrapper("fa fa-fw"));
                    extraWrapperHeaderLine.appendChild(clockicon);
                    extraWrapperHeaderLine.appendChild(deliverywrapper);
                }
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
                    if (sepNeed) { extraInfoText += ","; };
                    extraInfoText += lastLoc.state;
                    sepNeed = true;
                }
                if (lastLoc.country_name != null) {
                    if (sepNeed) { extraInfoText += ","; };
                    extraInfoText += lastLoc.country_name;
                    sepNeed = true;
                }
                if (message != null) {
                    if (sepNeed) { extraInfoText += ": "; };
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
                if (!isveryCompact) { wrapper.appendChild(parcelWrapperinfoline);}                    
            }
			
			if (clockTime && !isCompact) {
				wrapper.appendChild(extraWrapperHeaderLine);
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
