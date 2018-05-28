'use strict';

console.log("Server is running on " + (process.env.NODE_ENV !== 'production' ? 'development' : 'production') + " mode")

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const mainRouter = require('./routers/index.js');


const settings = require('settings');
//const { badPetition } = require('./helpers.js');
const ConnectionManager = require('./connection-manager.js');


const app = express();

// TODO: Serve static: js / css, index.

app.use(cors());
app.use(morgan('combined'));
app.use('/api', bodyParser.json());

// Checkeo de posible error de bodyparser.
/* TODO: Rehacer esto
app.use(function(error, req, res, next) {
    if(error) {
        if(error instanceof SyntaxError) {
            badPetition.call(res, "invalidJSON");
        } else {
			badPetition.call(res, "genericServerError");
		}
    } else {
		next();
	}
});
*/

app.set('connManager', new ConnectionManager(settings.dbSettings));

app.use('/api/v1', mainRouter);

app.listen(settings.port);

console.log("Server listening on port " + settings.port);