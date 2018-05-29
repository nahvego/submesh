const mysql = require('mysql');
const conn = mysql.createConnection(require('settings').dbSettings);

function test(obj) {
	let data = [6, 'tokensito'];
	conn.query(
		"SELECT users.id, users.name AS name, GROUP_CONCAT(DISTINCT role_permissions.permissionCode SEPARATOR ',') AS perms, " +
		"roles.name AS role, roles.color AS roleColor, roles.badge AS roleBadge FROM `users` " +
		"JOIN tokens ON tokens.userID = users.id " +
		"LEFT JOIN roles ON users.roleID = roles.id " +
		"LEFT JOIN role_permissions ON roles.id = role_permissions.roleID " +
		"WHERE users.id = ? AND token = ? GROUP BY users.id "
	, data, function(err, result, fields) {
		if(result == null) {
			obj.msg = "NULL";
			return false;
		}
		//console.log(result);
		for(a in result[0]) {
			//console.log(typeof obj, a, result[0][a]);
			obj[a] = result[0][a];
		}
		if(obj.perms != null)
			obj.permissions = obj.perms.split(',');
		else
			obj.permissions = [];
		delete obj.perms
	});
}

let obj = {};
test(obj);
setTimeout(function() {
	console.log("Obj: " + JSON.stringify(obj))
}, 2000);