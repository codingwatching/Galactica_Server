const http = require('http').createServer() 
const fetch = require('node-fetch')

const fs = require('./src/fs')

var version = '0.1.1'
var protocol = 1

const console = require('./src/console')

console.log('^yStarting Galatic server version ^:' + version + ' ^y[Protocol: ^:' + protocol + '^y]')

try {
	var cfg = require('./config.json')
	console.log('^gLoaded configuration file!')
} catch(e) {
	console.error('Can\'t load config file! \n^R', e.toString())
	console.log('Stopping server')
	return
}

require('./src/blocks').init()
require('./src/items').init()

if (!fs.existsSync('./plugins') ) fs.mkdirSync('./plugins')
if (!fs.existsSync('./players') ) fs.mkdirSync('./players')
if (!fs.existsSync('./worlds') ) fs.mkdirSync('./worlds')
	
if (!fs.existsSync('./mobs/jsonmobs.json') ) fs.writeFile('./mobs/jsonmobs.json', '{}', function (err) {
  if (err) throw err;
  console.log('Saved!');
});

const plugins = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'))

for (const file of plugins) {
	require('./plugins/' + file)
}


const initProtocol = require('./src/protocol').init

const io = require('socket.io')(http, {
	path: '/',
	serveClient: false,
	// below are engine.IO options
	pingInterval: 10000,
	pingTimeout: 5000,
	cookie: false
})




const worldManager = require('./src/worlds')

if (worldManager.exist('default') == false) worldManager.create('default', cfg.world.seed, cfg.world.generator)
//	if (worldManager.exist('hell') == false) worldManager.create('hell', cfg.world.seed, cfg.world.generator)
//else worldManager.load('default')

else worldManager.load('default')

initProtocol(io)
require('./src/player').setIO(io)
require('./src/entity').setIO(io)



if (cfg.public) {
	fetch('http://localhost:9000/update?ip=' + cfg.address + '&motd=' + cfg.motd + '&name=' + cfg.name)
    setInterval(function() {
        fetch('http://localhost:9000/update?ip=' + cfg.address + '&motd=' + cfg.motd + '&name=' + cfg.name)
    }, 30000)
}	
console.log('^yServer started on port: ^:' + cfg.port)

require('./src/commands').register('/stop', (id, args) => {
	if(id != '#console') return

	console.log('^rStopping server...')

	Object.values( require('./src/player').getAll() ).forEach( player => { player.remove() })

	Object.values( worldManager.getAll() ).forEach(world => {
		world.unload()
	})

	setTimeout( () => { process.exit() }, 1000 )

}, 'Stops the server (console only)')

require('./src/console-exec')


http.once('error', function(err) {
  if (err.code === 'EADDRINUSE') {
    // port is currently in use
	console.log('lukasss')
process.exit()
  }
});
http.listen(cfg.port)




