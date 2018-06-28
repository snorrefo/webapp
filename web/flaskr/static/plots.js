// https://standardjs.com/
// https://eslint.org/docs/rules/no-undef
/* eslint-env browser */
/* eslint-env jquery */
/* global Paho */
/* global MG */
/* global d3 */

// jQuery start
$(document).ready(function () {
  var DEBUG = true

  if (!DEBUG) {
    if (!window.console) window.console = {}
    var methods = ['log', 'debug', 'warn', 'info']
    for (var i = 0; i < methods.length; i++) {
      console[methods[i]] = function () {}
    }
  }

  var dnow = new Date(Date.now())
  var dat = [
    [{'date': dnow, 'value': 0}],
    [{'date': dnow, 'value': 0}]
  ]

  // https://github.com/metricsgraphics/metrics-graphics/wiki/List-of-Options
  var mgMain = {
    title: 'Plot',
    description: 'TBD.',
    data: dat,
    width: 600,
    height: 250,
    full_width: true,
    chart_type: 'line',
    // colors: ['blue'],
    // baselines: [{value: 0, label: 'a baseline'}],
    target: '#plot',
    x_accessor: 'date',
    y_accessor: 'value',
    transition_on_update: false,
    interpolate: d3.curveLinear,
    legend: ['Line 1', 'Line 2'],
    legend_target: '#legend'
  }

  MG.data_graphic(mgMain)

  // jQuery event definitions

  const inpChannels = ['ch101', 'ch102']

  // MQTT
  var mqttPort = 9001

  // Create a client instance
  var client
  client = new Paho.MQTT.Client(location.hostname, Number(mqttPort), 'clientIdBrowserPlots')

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

  var ndata = 0

  // called when a message arrives
  function onMessageArrived (message) {
    // console.log('onMessageArrived topic  : ' + message.destinationName)
    // console.log('onMessageArrived payload: ' + message.payloadString)

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

    // console.log('msgMethod : ' + msgMethod)
    // console.log('msgChID   : ' + msgChID)
    // console.log('msgInpOut : ' + msgInpOut)
    // console.log('msgOrigin : ' + msgOrigin)
    var respObj = JSON.parse(message.payloadString)
    $('#' + msgChID).val(respObj.Value)
    $('#' + msgChID + '_msg').text(message.payloadString)

    var dnow = new Date(Date.now())

    var dopop = false

    ndata = ndata + 1

    if (ndata > 10 * 3) {
      dopop = true
    }

    if (respObj.ID === 101) {
      dat[0].push({'date': dnow, 'value': respObj.Value})
      if (dopop === true) {
        dat[0].shift()
      }
    } else if (respObj.ID === 102) {
      dat[1].push({'date': dnow, 'value': respObj.Value})
      if (dopop === true) {
        dat[1].shift()
      }
    }

    mgMain['data'] = dat
    MG.data_graphic(mgMain)
  }



  $('#plot_btn').click(function () {
    dat[0].push({'date': new Date('2018-11-04'), 'value': 19})
    dat[1].push({'date': new Date('2018-11-04'), 'value': 45})
    console.log(dat)
    MG.data_graphic(mgMain)
  })
})
// jQuery stop
