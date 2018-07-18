import paho.mqtt.client as mqtt

from time import sleep
from datetime import datetime

import json
import random


MQTT_IP = '192.168.99.100'
MQTT_PORT = 1883
MQTT_TIMEOUT = 60


class LoggingChannel(object):
    """ 'ch101': {'ID': 101, 'VariableName': 'PT-01', 'DateTime': '0',
                  'Value': -1., 'Unit': 'bar', 'MeasuredValue': -1.,
                  'MeasuredUnit': 'volt'}"""

    def __init__(self, ch_id, d_variable_name, d_unit, d_measured_unit,
                 d_description1, d_description2):
        assert isinstance(ch_id, int)
        self.ch_id = 'ch' + '{:}'.format(ch_id)
        self.data = {'ID': ch_id, 'VariableName': d_variable_name,
                     'DateTime': '0', 'Value': -1., 'Unit': d_unit,
                     'MeasuredValue': -1., 'MeasuredUnit': d_measured_unit,
                     'Description1': d_description1,
                     'Description2': d_description2}


def on_connect(client, userdata, flags, rc):
    """
    The callback for when the client receives a
    CONNACK response from the server.
    """

    print("Connected with result code "+str(rc))


def main():

    ch101 = LoggingChannel(ch_id=101, d_variable_name='PT-01', d_unit='bar',
                           d_measured_unit='volt',
                           d_description1='Absolute pressure',
                           d_description2=''
                           )

    ch102 = LoggingChannel(ch_id=102, d_variable_name='PT-02', d_unit='bar',
                           d_measured_unit='volt',
                           d_description1='Differential pressure',
                           d_description2=''
                           )

    channels = {'ch101': ch101, 'ch102': ch102}

    ###########################################################################
    # MQTT
    ###########################################################################
    client = mqtt.Client()

    client.on_connect = on_connect

    client.connect(MQTT_IP, MQTT_PORT, MQTT_TIMEOUT)

    client.loop_start()

    ###########################################################################
    # Begin while True
    ###########################################################################
    while True:

        # Iterate over all channels and obtain MeasuredValue
        for key, val in channels.items():

            variable_cmd = 'NA'

            # Call instrument and obtain MeasuredValue for current channel
            try:
                variable_resp = [random.randrange(0, 100)/100]

                # Update dict with DateTime and MeasuredValue
                channels[key].data['DateTime'] = \
                    '{:%Y-%m-%dT%H:%M:%SZ}'.format(datetime.now())
                channels[key].data['MeasuredValue'] = variable_resp[0]
                channels[key].data['Value'] = variable_resp[0]

                print(channels[key].data['DateTime'])
                print(channels[key].data['MeasuredValue'])

            except IOError:
                print('Could not query instrument \
                       with command {}'.format(variable_cmd))

        # Iterate over all channels and publish to relevant mqtt topic
        for key, val in channels.items():
            topic = 'api/v1.0/logger/inputs/' + key + '/GET'
            payload = json.dumps(channels[key].data)
            print('topic   = {}'.format(topic))
            print('payload = {}'.format(payload))

            client.publish(topic=topic, payload=payload, qos=0, retain=False)

        sleep(2.0)


if __name__ == '__main__':
    main()
