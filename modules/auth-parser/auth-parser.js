'use strict';
/*
Técnicamente no es la implementación correcta de Basic; pero vamos a dejarlo porque vamos a dejarlo eh.

Esta implementación de auth-parser espera que la request tenga un header Authorization con el valor "SMB [base64string]" donde [base64string] es
"userID=TOKENDEACCESO" encodeado en base64

La obtención de los token de acceso van más allá de este módulo; pero no su procesamiento.

En la primera iteración de la seguridad vamos a considerar que los token se generan criptográficamente y se asignan a un usuario, sin caducidad ni medidas de origen.
Posibles mejoras incluyen:
- Caducidad de los tokens
- Regeneración de los tokens
- Asignación de origen
- Prueba de origen (Añadir un hash con la request encriptada por ejemplo)


Params:
(in) req: request provisto por HTTP
(out) result: objeto al que escribir el resultado

returns boolean
*/
module.exports = async function(req, result) {
	let header = req.get('Authorization');
	if(header === undefined) {
		result.msg = "No Authorization header";
		return false;
	}
	
	let parts = header.split(' ');
	if(parts.length != 2 || parts[0] != "SMB") {
		result.msg = "Incorrect Authorization header syntax. Must be \"SMB [base64info]\"";
		return false;
	}

	let data = Buffer.from(parts[1], 'base64').toString().split('=');
	if(data.length != 2 || !require('depicts-whole-number')(data[0])) {
		result.msg = "Incorrect Authorization header syntax. Encoded info must be userID=token\"";
		return false;
	}

	//let q = await req.db.query("SELECT id, name FROM `users` JOIN tokens ON tokens.userID = users.id WHERE users.id = ? AND token = ?", data);
	let q = await req.db.query(
		"SELECT users.id, users.name AS name, GROUP_CONCAT(DISTINCT role_permissions.permissionCode SEPARATOR ',') AS perms, " +
		"roles.name AS role, roles.color AS roleColor, roles.badge AS roleBadge FROM `users` " +
		"JOIN tokens ON tokens.userID = users.id " +
		"LEFT JOIN roles ON users.roleID = roles.id " +
		"LEFT JOIN role_permissions ON roles.id = role_permissions.roleID " +
		"WHERE users.id = ? AND token = ? GROUP BY users.id "
	, data);
	if(q == null) {
		result.msg = "Access denied";
		return false;
	}

	// Todo correcto

	for(var col in q[0]) {
		//console.log(typeof obj, a, result[0][a]);
		result[col] = q[0][col];
	}

	if(result.perms != null)
		result.permissions = result.perms.split(',');
	else
		result.permissions = [];
	delete result.perms

	return true;
}