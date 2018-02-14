## MMM-Parcel

Track deliveries . Supports 428 couriers worldwide based on aftership.com

## Here's what you get

An compact view on parcel status, for display on Magic Mirror.
Thanks to Mykle1 for the original code, Look and feel updated. 

## Examples

IT IS NOW WORK IN PROGRESS. EXPECTED DATE FOR RELEASE 10 March 2018. 


## Installation

* `git clone https://github.com/mykle1/MMM-Parcel` into the `~/MagicMirror/modules` directory.

* Get an account on aftership (Free is OK)

* Get your FREE API Key from https://www.aftership.com/ via settings -> API. 

* You MUST add couriers to your account at aftership.com. It's easy and FREE!

## Config.js entry and options

    {
    /*   THIS IS NOT VALID YET UNITL RELEASE ON MARCH 10, 2018 */
        disabled: false,
        module: "MMM-AfterShip",
        position: "top_left",
        config: {
            apiKey: "Your API Key GOES HERE",  // Your free API Key from aftership.com
            apiLanguage: "en",
            useHeader: true,                   // False if you don't want a header      
            header: "Aftership Tracking",      // Change in config file. useHeader must be true
            maxWidth: "300px",
            animationSpeed: 3000,              // fade speed
            rotateInterval: 30 * 1000,         // seconds between shipments
            dateTimeFormat: "ddd, MMM DD, YYYY, h:mm a",
            dateFormat: "ddd, MMM DD, YYYY"
        }
    },


