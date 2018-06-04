/*
Añade req.db como conexión con la base de datos para la request actual.
Añade req.isAllowedTo
Añade también res.releaseDB para liberar la conexión, a esta función no habría que llamarla automaticamente

Por comodidad, cambia res.json por una nueva función que cierra automáticamente la conexión.
También añade gestión de errores al objeto.

En res se crea _db como una referencia a la conexión de la request; esto para que se pueda eliminar facilmente. No usar. Es privada.

*/

const badPetition = require('error-handler');

module.exports = async function(req, res, next) {

	let conn;
	try {
		conn = await req.app.get('connManager').getConnection();
	} catch(e) {
		console.log("Could not connect to database on " + new Date());
		conn = null;
	}

	// Errores asignando la conexión
	if(null === conn) {
		return badPetition("dbConnection");
	}

	Object.defineProperties(req, {
		"db": {
			value: conn,
			enumerable: true
		},
		"isAllowedTo": {
			value: require('./isAllowedTo.js'),
			enumerable: true
		}
	})

	// Redefinimos la funcion json como _json. Lo hacemos ANTES porque defineProperties no garantiza el orden al definir las propiedades
	Object.defineProperty(res, "_json", {
		value: res.json
	});

	Object.defineProperties(res, {
		"json": {
			value: function(...args) {
				this.releaseDB();
				this._json(...args);
			}
		},
		"releaseDB": {
			value: function() {
				this.app.get('connManager').releaseConnection(this._db);
			}
		},
		"badPetition": {
			value: badPetition
		},
		"_db": {
			value: conn
		}
	});

	next();
}