## MMM-Parcel

Track deliveries . Supports 428 couriers worldwide based on aftership.com

## Here's what you get

View parcel tracking status, for display on Magic Mirror.
Inspired by MMM-AfterShip by Mykle1.

## Examples

NOW WORK IN PROGRESS. NO RELEASE YET! EXPECTED DATE FOR V1.0 RELEASE 10 March 2018. 

![](images/1.png) ![](images/2.png)

## Installation

* `git clone https://github.com/martinkooij/MMM-Parcel` into the `~/MagicMirror/modules` directory.

*  Go into the MMM-Parcel directory and do `npm install aftership`

* Get an account on aftership.com (Free account is OK if you track less than 100 parcels per month)

* Get your FREE API Key from https://www.aftership.com/ via settings -> API. 

* You MUST add couriers to your account at aftership.com. 

* Add your own trackings

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'MMM-Parcel',
		position: 'top_right',	// This can be any of the regions. Best results in left or right regions.
		header: 'My Parcels',   // This is optional
		config: {
			apiKey: 'Your API KEY goes here', // Your free API Key from aftership.com
			maxNumber: 10, //maximum number of Parcels to show
			showCourier: true,
			autoHide: false, // not functional yet in this version
			isSorted: true,  // sort on delivery Status (most important ones first)
			isCompact: false, // false = show version with expected delivery time on a separate line. 
			hideExpired: false,
			updateInterval: 600000, // 10 minutes = 10 * 60 * 1000 milliseconds. 
			parcelStatusText: ["Exception", "Failed Attempt","In Delivery","Delivered",  
							"In Transit", "Info Received", "Pending", "Expired"], // This is the default. Enter your own language text
			parcelIconColor: ["red", "red", "blue", "blue", "green", "green", "grey", "grey"], // This is the default. Change for other icon colors
			onlyDaysFormat: 
				{lastDay : '[Yesterday]',
				sameDay : '[Today]',
				nextDay : '[Tomorrow]',
				lastWeek : '[Last] dddd',
				nextWeek : 'dddd',
				sameElse : 'L'}, // moment.js formatting when only days are shown, not times
			expectedDeliveryText: 'Delivery Expected: '	 // This is the default. Change infoline text if you want 
		}
	}
]
````
## Configuration options

The following properties can be configured:


<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>apiKey</code></td>
			<td>REQUIRED: Your AfterShip API access token, you can get it via <a href="https://afstership.com">aftership.com</a>. This is the only required config field<br>
				<br><b>Possible values:</b> <code>string</code>
				<br><b>Default value:</b> <code>none</code>
			</td>
		</tr>
		<tr>
			<td><code>maxNumber</code></td>
			<td>Maximum number of parcels that are shown<br>
				<br><b>Possible values:</b> <code>int</code>
				<br><b>Default value:</b> <code>10</code>
			</td>
		</tr>
		</tr>
		<tr>
			<td><code>showCourier</code></td>
			<td> Determines whether  the shortcode of the courier in the Parcel header is shown<br>
				<br><b>Possible values:</b> <code>true</code>, <code>false</code>
				<br><b>Default value:</b> <code>true</code>
				<br><b>Example:</b> "3DT123456789(In transit, fedex)" is shown when true and "3DT123456789(In transit)" is shown when false
			</td>
		</tr>
		<tr>
			<td><code>autoHide</code></td>
			<td>The module hides itself when there are no parcels found<br>
				<br><b>Possible values:</b> <code>false</code>, <code>true</code> 
				<br><b>Default value:</b> <code>false</code>
				<br><b>Note:</b> Not yet implemented. Option has no effect at this moment
			</td>
		</tr>
				<tr>
			<td><code>isSorted</code></td>
			<td>Parcels are shown in a sorted order depending on status. SortOrder = <code>Exception</code>, <code>AttemptFail</code>,
			    <code>OutForDelivery</code>, <code>Delivered</code>, <code>InTransit</code>, <code>InfoReceived</code>, 
				<code>Pending</code>, <code>Expired</code><br>
				<br><b>Possible values:</b> <code>true</code>, <code>false</code> 
				<br><b>Default value:</b> <code>true</code>
				<br><b>Note:</b> Exceptions first, Expired last.
			</td>
		</tr>
		<tr>
			<td><code>isCompact</code></td>
			<td>Determines whether the expected delivery time (if known for the parcel) is shown on a separate line or on the same line as the parcel header (see picture for example). <br>
				<br><b>Possible values:</b> <code>false</code>, <code>true</code> 
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>hideExpired</code></td>
			<td>Determines whether parcels with status "Expired" should be shown.<br>
				<br><b>Possible values:</b> <code>true</code>, <code>false</code> 
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>updateInterval</code></td>
			<td>Time between requests to the API in milliseconds<br>
				<br><b>Possible values:</b> <code>int</code>
				<br><b>Default value:</b> <code>600000</code>
				<br><b>Note:</b> Internally the module uses 60000 as an absolute lower bound, whatever the config value is. Don't overload the API!
			</td>
		</tr>	
		<tr>
			<td><code>parcelStatusText</code></td>
			<td>Text to show for the statuses of the Parcel<br>
				<br><b>Possible values:</b> <code>[s1,...,s8]</code>. Array of 8 strings. 
				<br><b>Default value:</b> <code>["Exception",...,"Expired"]</code>. English is default. Choose your own language descriptions.
				<br><b>Example:</b> <code> parcelStatusText: ["Fout", "Mislukte bezorging","In bezorging","Afgeleverd",  "Onderweg",
                				"Ingevoerd", "Wachtend", "Te oud"],</code> for Dutch Status texts. If you trust the icons you can leave all 
								(or some) of these texts empty by defining the empty string <code>""</code>. Just take care to specify an array of total 8 strings! 
								Default are the English texts, if you are happy with the English descriptions you may drop this item in your module-config.  
			</td>
		</tr>			
		<tr>
			<td><code>parcelIconColor</code></td>
			<td>Colors of the parcel status icons in the header<br>
				<br><b>Possible values:</b> <code>[s1,...,s8]</code>. Array of 8 strings. 
				<br><b>Default value:</b> <code>["red","red","blue","blue","green","green","grey","grey"]]</code>. 8 colors.
				<br><b>Note:</b> <code> the colors are icon colors of the Parcel Status in the same order as the texts in the option above.
				When you are comfortable with the above mentioned colors you do not need to specify this item in the module-config. 
			</td>
		</tr>	
		<tr>
			<td><code>onlyDayesFormat</code></td>
			<td>Format for delivery time when no hour is yet known for the Parcel. In moment.js calendar format<br>
				<br><b>Possible values:</b> <code>moment.js calendar specification</code>
				<br><b>Default value:</b> 
				<br><code>{lastDay : '[Yesterday]',</code>
				<br> <code>sameDay : '[Today]',</code>
				<br> <code>nextDay : '[Tomorrow]',</code>
				<br> <code>lastWeek : '[Last] dddd',</code>
				<br> <code>nextWeek : 'dddd',</code>
				<br> <code>sameElse : 'L'}</code>
				<br><b>Example:</b> Fill in your language preference. English is default. Only relevant when <code>isCompact=false</code>. 
				 This option does nothing when <code>isCompact=true</code>. 
			</td>
		</tr>
		<tr>
			<td><code>expectedDeliveryText</code></td>
			<td>Text to show before showing the expected delivery date<br>
				<br><b>Possible values:</b> <code>string</code>
				<br><b>Default value:</b> <code>"Delivery expected: "</code>
				<br><b>Example:</b> Use "Bezorging verwacht:" in Dutch for example. Only relevant when <code>isCompact=false</code>. 
				 This option does nothing when <code>isCompact=true</code>. 
			</td>
	</tbody>
</table>

## Dependencies
- [aftership] (installed via `npm install aftership`)

## Known issues
- autoHide does not work yet. 
- Aftership does a good job in collecting  information from the courier but is not perfect. Use the mirror presentation as a hint.

