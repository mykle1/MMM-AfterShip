/*******************************/
/* Normalizer to prepare for various interfaces
/* MMM-Parcel
/* Martin Kooij 
/* 2021
/*******************************/
var moment = require('moment');

function normalize(rawList) {  // normalize for Tracktry Interface
		const statMap = new Map();
		var list = [];
		if ( !Array.isArray(rawList)) { return (list)}
		setMap(statMap) ;
		for (const rawItem of rawList) {
			var item = {
				courier_name : "",
				courier_code : "no_courier",
				status : "exception",
				tobe_collected: false,
				substatus : null,
				tracking_code : "No track",			
				title : "" ,
				updated_time : "2000-01-01",
				expected_deliverytime : "2000-01-01",
				last_loc: null
				} ;
			try {
				var lastLoc = {} ;
				item.courier_name = null ;
				item.courier_code = rawItem.carrier_code ;
				item.tobe_collected = false ;
				item.status = statMap.get(rawItem.status)?statMap.get(rawItem.status):"pending" ; // only known statuses are passed all others are mapped to "pending"
				item.tracking_code = rawItem.tracking_number ;			
				item.title = rawItem.title ;
				item.updated_time = rawItem.updated_at ;
				item.expected_deliverytime = null ;
				item.substatus = null ;
				const rawLoc_o = (rawItem.origin_info && rawItem.origin_info.trackinfo && rawItem.origin_info.trackinfo[0]) ;
				const rawLoc_d = (rawItem.destination_info && rawItem.destination_info.trackinfo && rawItem.destination_info.trackinfo[0]) ;
				const rawLoc = newest(rawLoc_o,rawLoc_d);
				if (rawLoc) {
					lastLoc.time = rawLoc.Date ;
					lastLoc.info = rawLoc.StatusDescription.trim() ;
					lastLoc.details = rawLoc.Details.trim() ;
					item.substatus = rawLoc.substatus ;  // note that this is moved to toplayer
					if (lastLoc.info.indexOf("collected") != -1) { item.tobe_collected = true ;}
				}
				item.last_loc = (Object.keys(lastLoc).length > 0)?lastLoc:null; ;
			} catch(e) { console.log ('[ERROR NORMALIZING Parcel in MMM-Parcel]', e, rawItem);} ;
			
			list.push(item) ;
		}
		return list ;
}

function setMap(map) {
	//defaults
	statusList = ["exception","undelivered", "pickup", "transit", "pending", "notfound", "delivered", "expired"] ;
	statusList.forEach( (v) => map.set(v,v) ) ;
	//extra mappings
	map.set("InfoReceived","pending") ;	// UPS
}

function printMap(map) {
	map.forEach( (v,k) => console.log('<',k,',',v,'>' )) ;
}

function adaptTime(item,t) {
	if (item.courier_code === "postnl-3s") {
		if (t && !t.includes("-", 11) && !t.includes("+", 11) ) {t += " +0700"}; // adjust time at postnl-3s if no TZ given
	}
	return t // no adjustments known for other couriers
}

function newest(loc1,loc2) {
	if (!loc1 && !loc2){ return null ;}
	if (!loc1 && loc2) { return loc2 ;}
	if (!loc2 && loc1) { return loc1 ;}
	if (moment(loc1.Date) < moment(loc2.Date)) {return loc2;}
	return loc1 ;
}
	

module.exports = normalize ;

/******************** DEFINITION of normalized RESULT ****************
/* 	[
/*  	{
/* 		courier_name : full text name of courier if available (not used in MMM-Parcel),
/* 		courier : short code of courier,
/*		status : one of "exception","undelivered", "pickup", "transit", "pending", "notfound", "delivered", "expired",
/*		substatus : substatus (see internet, not (yet) used in MMM-Parcel)
/*		tracking_code : tracking identifier ;			
/*		title : text title ,
/*		updated_time :last updated time ( parsable time string),
/*		expected_deliverytime : expected delivery time if available (parsable time string, not used in MMM-Parcel),
/*		last_loc : 
/*		  {
/*			time : time at this location event,
/*			info : textual description of status at location,
/*			details : extra details (city, state, country, etc. depending on availbility in API)
/*		  }
/*		} ,
/*		...
/*	]
/****************************************************************************/		
