from flask import Flask, jsonify, abort, request, make_response, url_for
from flask import render_template

# flask jsonify adds MIME header to returned json string
# http://flask.pocoo.org/docs/1.0/api/#flask.json.jsonify

from flask_restful import Api, Resource, fields, marshal
# https://blog.miguelgrinberg.com/post/designing-a-restful-api-using-flask-restful

from flask_httpauth import HTTPBasicAuth

import sys

import json
from jsonschema import validate as json_validate
from jsonschema import ValidationError as JSONValidationError

import paho.mqtt.client as mqtt


# MQTT
MQTT_IP = 'mqtt'  # docker container name will route to correct ip
MQTT_PORT = 1883
MQTT_TIMEOUT = 60


def on_connect(client, userdata, flags, rc):
    """
    The callback for when the client receives a
    CONNACK response from the server.
    """

    print("Connected with result code "+str(rc))


def create_app():
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__, static_url_path="/static")
    # No caching of static files during development
    # https://stackoverflow.com/questions/5690269/disabling-chrome-cache-for-website-development

    api = Api(app)

    ###########################################################################
    # MQTT
    ###########################################################################
    client = mqtt.Client()

    client.on_connect = on_connect

    client.connect(MQTT_IP, MQTT_PORT, MQTT_TIMEOUT)

    client.loop_start()

    ###########################################################################
    # API
    ###########################################################################

    current_channel_valid = ['Speed']

    current_channel_fields = {
        'output_id': fields.String,
        'set_point': fields.Float,
        'uri': fields.Url('current_channel')
    }

    def jsonErrorClientSide(err_message):
        out_resp_obj = {
            'error': {
                'type': 'invalid_request',
                'message': err_message
            }
        }
        return out_resp_obj

    def jsonErrorServerSide(err_message):
        out_resp_obj = {
            'error': {
                'type': 'server',
                'message': err_message
            }
        }
        return out_resp_obj

    class CurrentChannelAPI(Resource):

        def get(self, output_id):
            pass

        def post(self, output_id):
            pass

        def delete(self, output_id):
            pass

        def put(self, output_id):

            # Request Validation: MIME type
            # http://flask.pocoo.org/docs/1.0/api/#flask.Request.is_json
            if not request.is_json:
                err_message = 'Request MIME-Type: ' + request.mimetype + \
                    '. API only accepts: application/json'
                out_resp_obj = jsonErrorClientSide(err_message=err_message)
                return make_response(jsonify(out_resp_obj), 400)

            # Request Validation: URI resource
            if output_id not in current_channel_valid:
                err_message = 'URI Resource ' + output_id + \
                    ' not found.'
                out_resp_obj = jsonErrorClientSide(err_message=err_message)
                return make_response(jsonify(out_resp_obj), 404)

            # Request Validation: JSON according to schema
            # http://json-schema.org/latest/json-schema-validation.html
            json_schema = {
                'type': 'object',
                'required': ['output_id', 'set_point'],
                'properties': {
                    'output_id': {
                        'type': 'string',
                        'enum': current_channel_valid
                        },
                    'set_point': {
                        'type': 'number',
                        'minimum': 0.0,
                        'maximum': 100.0
                        }
                }
            }

            try:
                json_validate(request.json, schema=json_schema)
            except JSONValidationError as err:
                err_message = 'JSON validation error: ' + err.message
                out_resp_obj = jsonErrorClientSide(err_message=err_message)
                return make_response(jsonify(out_resp_obj), 400)

            # Request Validation: JSON output_id match URI resource
            if output_id != request.json['output_id']:
                err_message = 'URI Resource ' + output_id + \
                    ' not equal to JSON output_id: ' + \
                    request.json['output_id']
                out_resp_obj = jsonErrorClientSide(err_message=err_message)
                return make_response(jsonify(out_resp_obj), 400)

            # Request Validation OK
            # Send request to MQTT server for processing in paho_control

            out_mqtt_obj = {
                'output_id': output_id,
                'set_point': request.json['set_point']
            }

            out_mqtt_topic = \
                'api/v1.0/control/currentoutputs/' + \
                output_id + \
                '/PUT'
            out_mqtt_payload = json.dumps(out_mqtt_obj)

            client.publish(
                topic=out_mqtt_topic,
                payload=out_mqtt_payload,
                qos=2, retain=True)

            return marshal(out_mqtt_obj, current_channel_fields)

    api.add_resource(CurrentChannelAPI,
                     '/api/v1.0/control/currentoutputs/<string:output_id>',
                     endpoint='current_channel')

    @app.route('/')
    def main():
        return render_template('main.html')

    @app.route('/plots')
    def plots():
        return render_template('plots.html')

    return app
