const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const url = require('url');
const helper = require('./helpers')
var path = require('path')

const port = 3000

app.use(bodyParser.json());

//app.get('/', (req, res) => res.send('Hello World!'))

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/ui/index.html'));
});

app.get('/index.js', function(req, res) {
  res.sendFile(path.join(__dirname + '/ui/index.js'));
});

app.get('/testsubmit', (req, res) => {
  helper.sendTest()
    .then(resp => res.send(resp))
    .catch(err => res.send(err))
})

app.post('/submit', function(req, res){
  console.log('/submit called', req.body)
  helper.main(
    req.body
  , err => { throw new err }
  , data => res.send(data)
  )
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

