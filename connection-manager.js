/*
ConnectionManager genera una interfaz para interactuar con la base de datos a nivel muy simple. Provee dos métodos:
- getConnection(): Devuelve una conexión con la base de datos. La conexión debe tener un método query()
- releaseConnection(conn): Libera la conexión utilizada
- query( ? ): Query mediante promesa
	> Debe devolver null si no hay resultados
Con constructores:
constructor(settings) donde settings es un objeto con los siguientes parámetros, que pueden ser soportados o no
- host
- user
- password
- port
- database
- connections
*/

/*
La forma correcta de implementar esto es usar una interfaz, e implementar un MySQLConnectionManager, pero como JS no es tipado; vamos a aprovechar aunque quede más feote.

Para MySQL vamos a usar una ConnectionPool.



*/

class ConnectionManager {
	constructor(settings) {
		this._pool = require('mysql').createPool(settings);
	}

	getConnection() {
		let self = this;
		return new Promise((res, rej) => {
			this._pool.getConnection(function(err, conn) {
				if(err) rej(err);
				else res(self._alterConnection(conn))
			});
		})
	}

	releaseConnection(conn) {
		//console.log(conn, typeof conn.release)
		conn.release();
	}

	_alterConnection(conn) {

		if(conn._query === undefined) {
			Object.defineProperty(conn, "_query", { value: conn.query });
			Object.defineProperties(conn, {
				"query": {
					value: function(...args) {
						return new Promise(((res, rej) => {
							//console.log(this, typeof this._query)
							this._query(...args, function(error, results, fields) {
								if(error) rej(error)
								else if(results instanceof Array && results.length == 0) res(null)
								else res(results)
							})
						}).bind(this))
					},
					enumerable: true
				},
				"queryWithFields": {
					value: function(...args) {
						return new Promise(((res, rej) => {
							this._query(...args, function(error, results, fields) {
								if(error) rej(error)
								else res([results, fields])
							})
						}).bind(this))
					},
					enumerable: true
				}
			})
		}
		return conn;
	}
}

module.exports = ConnectionManager;
