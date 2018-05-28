'use strict';

const validator = require('models');

module.exports = function(req, res, next) {
	if(validator(this.obj, this.model, this.required || undefined))
		next();
	else
		req.badPetition(???);
}