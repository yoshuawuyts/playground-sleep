process.title = 'replicate-client'

var net = require('net')
var prettier = require('prettier-bytes')
var speedometer = require('speedometer')
var hypercore = require('hypercore')
var raf = require('random-access-file')

var blocksPerSecond = speedometer()
var bytesPerSecond = speedometer()

var feed = hypercore('3d94d76d57c19115a71122eaf47abab5e6dfa2515bf20be955a4601b77016c3c', function (name) {
  return raf('/tmp/hypercore/' + name)
})

var socket = net.connect(10001, 'hasselhoff.mafintosh.com')
var missing = []
var nodes = 0

var stream = feed.replicate()
var downloaded = 0

socket.pipe(stream).pipe(socket)

feed.ready(function () {
  for (var i = 0; i < feed.blocks; i++) {
    if (feed.has(i)) downloaded++
  }
})

feed.get(0, function () {
  feed.download(function () {
    log()
    console.log('(end)')
    process.exit()
  })
})

feed.on('download', function (index, data, n) {
  downloaded++
  nodes += n.length
  bytesPerSecond(data.length)
  blocksPerSecond(1)
})

function log () {
  console.log('%s/s - %d/%d (%d)', prettier(bytesPerSecond()), downloaded, feed.blocks, nodes)
}

setInterval(log, 1000)