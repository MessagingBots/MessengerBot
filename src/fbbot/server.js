const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const http = require('http').Server(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// view engine ejs
app.set('view engine', 'ejs')

app.set('port', 3124);

module.exports = () => {
  // START ===================================================
  http.listen(app.get('port'), function () {
    console.log('listening on port ' + app.get('port'))
  })
};
