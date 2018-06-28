# webapp

[![Build Status](https://travis-ci.org/snorrefo/webapp.svg?branch=master)](https://travis-ci.org/snorrefo/webapp)

Simple SPA for displaying logging data from a MQTT server and making control calls to a http API. Built with a docker service ```web``` for a Flask http server, and a service ```mqtt-mosquitto``` for a [Mosquitto](https://mosquitto.org/) MQTT broker.

For local use and development only.

Requires docker and docker-compose

Build with ```docker-compose build```

Run ```docker-compose up```

Open a browser and go to 

main view ```http://localhost:5000```

plot view with [MetricsGraphics.js](http://metricsgraphicsjs.org) ```http://localhost:5000/plots```

For testing the logging, you can connect to the MQTT server via the [Eclipse Paho JavaScript Client](http://www.eclipse.org/paho/clients/js/) over Websockets:

Go to the http (not SSL) version of
[http://www.eclipse.org/paho/clients/js/utility/](http://www.eclipse.org/paho/clients/js/utility/) 
to connect to the 
and enter ```host: localhost```, ```port: 9001``` and uncheck ```TLS```

Click connect.

Publish the following JSON message:

```{"ID": 101, "VariableName": "TC-01", "DateTime": "2018-06-28T11:33:24Z", "Value": 21.0625, "Unit": "degC", "MeasuredValue": 4.37, "MeasuredUnit": "volt"}```

to the topic:

```api/v1.0/logger/inputs/ch101/GET```

The published ```Value``` will be shown in ```ch101``` field in the main view.
