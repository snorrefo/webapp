import pytest
import flaskr
import json
import sys


@pytest.fixture
def client():
    app = flaskr.create_app()

    app.config['TESTING'] = True
    client = app.test_client()

    yield client


def test_index(client):
    """Start with a blank database."""

    response = client.get('/')
    assert response.status_code == 200


def test_CurrentChannelAPI(client):
    current_channel_output_ids = ['Speed']

    for valid_ch in current_channel_output_ids:
        # Standard API call
        apiurl = '/api/v1.0/control/currentoutputs/' + valid_ch
        testdata = {'output_id': valid_ch, 'set_point': 20.0}
        testdata = json.dumps(testdata)
        # '{"output_id": "Speed", "set_point": 20.0}'
        testheaders = {'content-type': 'application/json'}

        response = client.put(apiurl, data=testdata, headers=testheaders)

        assert response.status_code == 200, \
            print(response.get_json(), file=sys.stderr)

        # Erroneous call: set_point string
        apiurl = '/api/v1.0/control/currentoutputs/' + valid_ch
        testdata = {'output_id': valid_ch, 'set_point': 'a'}
        testdata = json.dumps(testdata)

        response = client.put(apiurl, data=testdata, headers=testheaders)

        assert response.status_code == 400, \
            print(response.get_json(), file=sys.stderr)
        # Bad request flask_restful reqparse

        # Erroneous call: set_point over 100.0
        apiurl = '/api/v1.0/control/currentoutputs/' + valid_ch
        testdata = {'output_id': valid_ch, 'set_point': 102}
        testdata = json.dumps(testdata)

        response = client.put(apiurl, data=testdata, headers=testheaders)
        assert response.status_code == 400, \
            print(response.get_json(), file=sys.stderr)
        # Bad request

        # Erroneous call: set_point below 0.0
        apiurl = '/api/v1.0/control/currentoutputs/' + valid_ch
        testdata = {'output_id': valid_ch, 'set_point': -0.00001}
        testdata = json.dumps(testdata)

        response = client.put(apiurl, data=testdata, headers=testheaders)

        assert response.status_code == 400, \
            print(response.get_json(), file=sys.stderr)
        # Bad request flask_restful reqparse

        # Erroneous call: invalid type output_id in JSON data
        apiurl = '/api/v1.0/control/currentoutputs/' + valid_ch
        testdata = {'output_id': 15, 'set_point': 0.0}
        testdata = json.dumps(testdata)

        response = client.put(apiurl, data=testdata, headers=testheaders)

        assert response.status_code == 400, \
            print(response.get_json(), file=sys.stderr)
        # Bad request flask_restful reqparse

        # Erroneous call: invalid output_id in JSON data
        apiurl = '/api/v1.0/control/currentoutputs/' + valid_ch
        testdata = {'output_id': 'Speedp', 'set_point': 0.0}
        testdata = json.dumps(testdata)

        response = client.put(apiurl, data=testdata, headers=testheaders)

        assert response.status_code == 400, \
            print(response.get_json(), file=sys.stderr)
        # Not found

        # Erroneous call: invalid output_id in url and JSON data
        apiurl = '/api/v1.0/control/currentoutputs/Speedp'
        testdata = {'output_id': 'Speedp', 'set_point': 0.0}
        testdata = json.dumps(testdata)

        response = client.put(apiurl, data=testdata, headers=testheaders)

        assert response.status_code == 404, \
            print(response.get_json(), file=sys.stderr)
        # Not found

        # Erroneous call: invalid output_id in url and JSON data
        apiurl = '/api/v1.0/control/currentoutputs/' + valid_ch
        testdata = {'output_id': 'Speedp', 'set_point': 0.0}
        testdata = json.dumps(testdata)

        response = client.put(apiurl, data=testdata, headers=testheaders)

        assert response.status_code == 400, \
            print(response.get_json(), file=sys.stderr)
        # Not found
