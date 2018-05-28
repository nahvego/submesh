const isInt = require('depicts-whole-number');
const settings = require('settings');

module.exports = { appChecker, authChecker, queryChecker };


function appChecker(req, res, next) {
	next();
}

function authChecker(req, res, next) {
	next();
}

/*
Comprueba las query vars de la petición y las procesa como sea necesario.
Los resultados se guardan en req.options:
- count=[Int] => req.options.count: Número de resultados que deben devolverse, o el máximo
- fromID=[Int] => req.options.fromID: ID máxima que debe utilizarse para obtener los datos, como alternativa a la paginación, se buscarán IDs menores. Si no está definida, o es 0; se ignora.
*- page=[Int] => req.options.page: Página actual -- NO IMPLEMENTADO
*/
function queryChecker(req, res, next) {
	// query.min = int etc.
	let obj = {};

	if(req.query.count !== undefined) {
		console.log(req.query.count, settings.api.max_results, isInt(req.query.count))
		if(!isInt(req.query.count) || req.query.count > settings.api.max_results)
			return res.badPetition("malformedRequest", "count debe ser un entero <= " + settings.api.max_results)
		obj.count = req.query.count;
	} else {
		obj.count = settings.api.max_results;
	}

	if(req.query.fromID !== undefined) {
		if(!isInt(req.query.fromID))
			return res.badPetition("malformedRequest", "fromID debe ser un entero positivo");
		
		if(parseInt(req.query.fromID) > 0) obj.fromID = req.query.fromID
	}

	req.options = obj;

	next();
}