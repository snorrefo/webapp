// https://standardjs.com/
// https://eslint.org/docs/rules/no-undef
/* eslint-env browser */
/* eslint-env jquery */
/* global Paho */
/* global MG */
/* global d3 */

// jQuery start
$(document).ready(function () {

  // jQuery event definitions

  const inpChannels = ['ch101', 'ch102']
  const outChannels = ['Speed']

  const guiIDs = []
  for (const i of inpChannels) {
    guiIDs.push(i)
  }
  for (const i of outChannels) {
    guiIDs.push(i + '_APIstatus')
    guiIDs.push(i + '_controlstatus')
  }
  console.log(guiIDs)
  // ['ch101_read', 'ch102_read', 'Speed_APIstatus', 'Speed_controlstatus']

  // Event GUI: Show/Hide detailed status
  for (const guiID of guiIDs) {
    $('#' + guiID + '_btn').click(function () {
      $('#' + guiID + '_msg').toggle()
    })
  }

  // Event Control: set point button clicked
  for (const chID of outChannels) {
    var baseID = '#' + chID
    $(baseID + '_btn').click(function () {
      var newSetPoint = $(baseID + '_write').val()
      console.log(baseID + '_btn clicked. newSetPoint: ' + newSetPoint)
      var jdata = {output_id: chID, set_point: Number(newSetPoint)}
      console.log(JSON.stringify(jdata))
      $.ajax({
        url: '/api/v1.0/control/currentoutputs/' + chID,
        method: 'PUT',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(jdata),
        success: function (data, textStatus, jqXHR) { // data, String textStatus, jqXHR jqXHR
          $(baseID + '_APIstatus_msg').val(JSON.stringify(data) + textStatus)
          $(baseID + '_APIstatus_btn').removeClass('badge-secondary')
          $(baseID + '_APIstatus_btn').removeClass('badge-danger')
          $(baseID + '_APIstatus_btn').addClass('badge-success')
          var d = new Date()
          var n = d.toTimeString()
          $(baseID + '_APIstatus_btn').text('API Status: Set to ' + Number(newSetPoint) + '%: Success at ' + n)
        },
        error: function (jqXHR, textStatus, errorThrown) { // jqXHR jqXHR, String textStatus, String errorThrown
          $(baseID + '_APIstatus_msg').val(JSON.stringify(jqXHR))
          $(baseID + '_APIstatus_btn').removeClass('badge-secondary')
          $(baseID + '_APIstatus_btn').removeClass('badge-success')
          $(baseID + '_APIstatus_btn').addClass('badge-danger')
          var d = new Date()
          var n = d.toTimeString()
          $(baseID + '_APIstatus_btn').text('API Status: Set to ' + Number(newSetPoint) + '%: Error at ' + n)
        }
      })
    })
  } // end for

  // MQTT
  var mqttPort = 9001

  // Create a client instance
  var client
  client = new Paho.MQTT.Client(location.hostname, Number(mqttPort), 'clientIdBrowserMain')

  // set callback handlers
  client.onConnectionLost = onConnectionLost
  client.onMessageArrived = onMessageArrived

  // connect the client
  client.connect({ onSuccess: onConnect, reconnect: true })

  // called when the client connects
  function onConnect () {
    // Once a connection has been made, make a subscription and send a message.
    console.log('onConnect')
    $('#mqttstatus_btn').removeClass('badge-secondary')
    $('#mqttstatus_btn').removeClass('badge-danger')
    $('#mqttstatus_btn').addClass('badge-success')
    $('#mqttstatus_btn').text('MQTT status: connected')

    for (const i of inpChannels) {
      client.subscribe('api/v1.0/logger/inputs/' + i + '/GET')
      console.log('api/v1.0/logger/inputs/' + i + '/GET')
      // 'api/v1.0/logger/inputs/ch101/GET'
    }

    for (const i of outChannels) {
      client.subscribe('api/v1.0/control/currentoutputs/' + i + '/GET')
      console.log('api/v1.0/control/currentoutputs/' + i + '/GET')
      // 'api/v1.0/control/currentoutputs/Speed/GET'
    }
  }

  // called when the client loses its connection
  function onConnectionLost (responseObject) {
    if (responseObject.errorCode !== 0) {
      console.log('onConnectionLost:' + responseObject.errorMessage)
      $('#mqttstatus_btn').removeClass('badge-secondary')
      $('#mqttstatus_btn').removeClass('badge-success')
      $('#mqttstatus_btn').addClass('badge-danger')
      $('#mqttstatus_btn').text('MQTT status: disconnected: ' + responseObject.errorMessage)
    } else {
      $('#mqttstatus_btn').removeClass('badge-secondary')
      $('#mqttstatus_btn').removeClass('badge-success')
      $('#mqttstatus_btn').addClass('badge-danger')
      $('#mqttstatus_btn').text('MQTT status: disconnected')
    }
  }

  // called when a message arrives
  function onMessageArrived (message) {
    console.log('onMessageArrived topic  : ' + message.destinationName)
    console.log('onMessageArrived payload: ' + message.payloadString)

    var topic, topicspl, msgMethod, msgChID, msgInpOut, msgOrigin
    topic = message.destinationName
    topicspl = topic.split('/')

    // msgMethod:
    // Last element of array topicspl. Should be GET
    msgMethod = topicspl.pop()

    // msgChID:
    // Should be ch101, ch102 etc if msgOrigin logger
    // Should be EGpumpE03, Speed, LINvalveCV01 if msgOrigin control
    msgChID = topicspl.pop()

    // msgInpOut:
    // Should be inputs if msgOrigin logger
    // Should be currentoutputs if msgOrigin control
    msgInpOut = topicspl.pop()

    // msgOrigin:
    // Should be equal to 'logger' or 'control'
    msgOrigin = topicspl.pop()

    console.log('msgMethod : ' + msgMethod)
    console.log('msgChID   : ' + msgChID)
    console.log('msgInpOut : ' + msgInpOut)
    console.log('msgOrigin : ' + msgOrigin)
    var respObj = JSON.parse(message.payloadString)

    var baseID = '#' + msgChID

    switch (msgOrigin) {
      // Event Logger: message arrived. Update data fields
      case 'logger':

        console.log('logger:')

        $(baseID + '_read').val(respObj.Value)
        $(baseID + '_msg').text(message.payloadString)

        break

      // Event Control: feedback message arrived from paho_control.
      // Update status fields
      case 'control':

        console.log('control:')
        var d = new Date()
        var n = d.toTimeString()

        if ('error' in respObj) {
          // Error in paho_control/start_control_nidaqmx_NI9265_4_20mA.py
          console.log('error')
          $(baseID + '_controlstatus_msg').val(message.payloadString)
          $(baseID + '_controlstatus_btn').removeClass('badge-secondary')
          $(baseID + '_controlstatus_btn').removeClass('badge-success')
          $(baseID + '_controlstatus_btn').addClass('badge-danger')

          $(baseID + '_controlstatus_btn').text('Control status: Set to ' + Number(respObj.set_point) + '%: Error at ' + n)
        } else {
          // Successful output current update in
          // paho_control/start_control_nidaqmx_NI9265_4_20mA.py
          console.log('no error')
          $(baseID + '_write').val(Number(respObj.set_point))
          $(baseID + '_controlstatus_msg').val(message.payloadString)
          $(baseID + '_controlstatus_btn').removeClass('badge-secondary')
          $(baseID + '_controlstatus_btn').removeClass('badge-danger')
          $(baseID + '_controlstatus_btn').addClass('badge-success')

          $(baseID + '_controlstatus_btn').text('Control status: Set to ' + Number(respObj.set_point) + '%: Success at ' + n)
        }

        break
    }
  }
})
// jQuery stop
