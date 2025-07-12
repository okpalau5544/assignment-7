import server from './server'

server(3000).then(() => { console.log('Exiting Application') }).catch((err) => { console.error(err) })
