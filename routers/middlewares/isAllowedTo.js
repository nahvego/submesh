'use strict';
/*

La función exportada devuelve un valor booleano que indica si el usuario que está haciendo la llamada tiene permisos para realizar ciertas acciones.
Utiliza THIS como contexto, por lo que debe ser bindeada a req
Params:
action: La acción que ha de comprobarse
[ orIsUser]: Si la acción es válida para el usuario (p.ej autor de un post) puede pasarse este argumento con el valor al que debe ser igual.
	Puede ser:
	- string: Nombre del usuario
	- Number: id del usuario
	- Objeto con id o name --

*/

module.exports = function(action, orIsUser) {
	// Si el usuario no está identificado, no va a tener permisos.
	if(this.user === undefined)
		return false;

	if(orIsUser !== undefined) {
		if(this.user.id == orIsUser || this.user.name === orIsUser) {
				return true;
		} else if(orIsUser.id !== undefined) {
			if(this.user.id == orIsUser.id) // Doble igual para que haya type coercion
				return true;
		} else if(orIsUser.name !== undefined) {
			if(this.user.name == orIsUser.name)
				return true;
		} else {
			throw new Error("isAllowedTo: orIsUser is neither a number, a string or a valid object. <" + orIsUser + ">")
		}
	}

	return req.user.permissions.indexOf(action) >= 0;
}