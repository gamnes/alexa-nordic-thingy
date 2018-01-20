/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var config = {};
config.IOT_SENSOR_BROKER_ENDPOINT      = process.env.REST_API_ENDPOINT; 
config.IOT_SENSOR_BROKER_REGION        = process.env.REGION;
config.IOT_SENSOR_THING_NAME =           process.env.THING_NAME;

var SpeechOutputStrings = {
    WELCOME:        'Welcome.',
    HELP_MESSAGE:   'You can ask me for different sensor readings, such as temperature and color, or, you can say exit... What can i help you with?',
    STOP_MESSAGE:   'Goodbye!',
}

var speechQueue = [];

function logandprompt(logtxt) {
    console.log(logtxt);
    speechQueue.push(logtxt);
}

const handlers = {
    'LaunchRequest': function () {
        speechQueue.length = 0;
        this.emit(SpeechOutputStrings.WELCOME);
    },
    
    'WhatsMyMetricIntent': function () {
        logandprompt(SpeechOutputStrings.WELCOME);
        
        var requestedMetric = this.event.request.intent.slots.metric.value;
        
        if (requestedMetric == null) {
            logandprompt('You did not provide any metric for me to retrieve.');
            logandprompt(SpeechOutputStrings.HELP_MESSAGE);
            
            // We exit here since we did not receive any metrics
            this.emit('Speak');
        } else {
            logandprompt('You have asked for the information of ' + requestedMetric + '.');
        }
        
        // Debug prints
        console.log('Calling get sensor shadow. ');
        var sensorData;
        getSensorShadow(result => {
            console.log('getSensorShadow returned. ');
            
            sensorData = result;
            console.log('These are the latest values retrieved by the Thingy ' + sensorData);
            
            if (sensorData == null) {
                logandprompt('No sensor data returned. ');
            } else {
                switch (requestedMetric) {
                    case 'temperature':
                        logandprompt('Temperature is ' + sensorData.temperature + 'degrees. ');
                        break;
                    
                    default:
                        logandprompt('Requested metric ' + requestedMetric + 'is not currently handled. ');
                        break;
                }
            }
            
            // We exit here and return our response
            this.emit('Speak'); 
        });
    },
    
    'Speak': function () {
        var msg = speechQueue.join(" ");
        speechQueue.length = 0;
        this.emit(':ask', msg);
    },
    
    'Unhandled': function () {
        this.emit(':ask', SpeechOutputStrings.HELP_MESSAGE, SpeechOutputStrings.HELP_MESSAGE);
    },
    
    'AMAZON.HelpIntent': function () {
        const speechOutput = SpeechOutputStrings.HELP_MESSAGE;
        const reprompt = SpeechOutputStrings.HELP_MESSAGE;
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

function getSensorShadow(callback) {
    console.log('Inside getSensorShadow function.');
    
    var AWS = require('aws-sdk');
    AWS.config.region = config.IOT_SENSOR_BROKER_REGION;

    // Prepare the parameters of the update call
    var credentials = {
        accessKeyId : process.env.ACCESS_KEY_ID,
        secretAccessKey : process.env.SECRET_ACCESS_KEY
    };
    var iotData = new AWS.IotData({
        endpoint: config.IOT_SENSOR_BROKER_ENDPOINT,
        credentials : credentials
    });
    var paramsGet = {
        thingName: config.IOT_SENSOR_THING_NAME /* required */
    };

    console.log('Calling getThingShadow.');
    iotData.getThingShadow(paramsGet, function(err, data)  {
        if (err){
            console.log(err);

            console.log('Call to getThingShadow failed. ');
            callback("not ok");
        }
        else {
            console.log('Retrieved information from sensor thing shadow successfully. ');

            var sensorObject = JSON.parse(data.payload).state.reported;
            console.log(sensorObject);
            callback(sensorObject);
        }
    });
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
