'use script';

const settings = require('settings');

module.exports = async function(req, res) {
	let c = require('models')(req.body, 'login');
	if(!c.result) {
		return usingRefreshToken(req, res);
	}

	let q = await req.db.query("SELECT id, password FROM `users` WHERE name = ?", [req.body.user]);

	if(null === q)
		return res.badPetition("forbiddenNoUser");

	require('bcrypt').compare(req.body.password, q[0].password, function(err, result) {
		if(err)
			return res.badPetition("genericError");
		if(!result)
			return res.badPetition("incorrectPassword");

		generatePayload(req, res, {
			id: q[0].id,
			name: req.body.user
		})

	});
}

async function usingRefreshToken(req, res) {
	if(req.body.refresh === undefined || Object.keys(req.body).length > 1) // eslint no-magic-numbers: 0
		return res.badPetition("malformedRequest");

	let q = await req.db.query("SELECT users.id, users.name, tokens.creationDate, tokens.expirationDate FROM `tokens` JOIN `users` ON users.id = tokens.userID WHERE tokens.refreshToken = ? AND tokens.refreshUsed = '0'", [req.body.refresh]);
	if(null === q)
		return res.badPetition("incorrectRefreshToken");

	// TODO: Debería de poder usarse un refresh con un token que existe?
	// Es posible que dos componentes de Vue hagan el refresco muy cerca uno del otro. Del rollo que cogen el siguiente token sabes

	if(new Date() < q[0].expirationDate) {
		return res.badPetition("refreshTooEarly");
	}

	await req.db.query("UPDATE `tokens` SET refreshUsed = TRUE WHERE refreshToken = ?", [req.body.refresh])

	generatePayload(req, res, {
		id: q[0].id,
		name: q[0].name
	})
}

/*
data = {
	id,
	name
}
*/
function generatePayload(req, res, data) {
	require('crypto').randomBytes(settings.auth.tokenLength, async (err, buf) => {
		if(err)
			return res.badPetition("genericError");

		let insertObj = {
			userID: data.id,
			token: buf.toString('hex', 0, settings.auth.tokenLength/2),
			refreshToken: buf.toString('hex', settings.auth.tokenLength/2),
			expirationDate: new Date((new Date()).getTime() + (settings.auth.tokenDuration * 1000))
		}
		await req.db.query("INSERT INTO `tokens` SET ?", insertObj);

		let s = await req.db.query("SELECT GROUP_CONCAT(subs.urlname SEPARATOR ',') AS list FROM `subscriptions` s JOIN `subs` ON s.subID = subs.id WHERE s.userID = ? GROUP BY s.userID", [data.id]);
		let p = await req.db.query("SELECT GROUP_CONCAT(permissionCode SEPARATOR ',') AS perms FROM `users` u LEFT JOIN `role_permissions` p ON p.roleID = u.roleID WHERE u.id = ?", [data.id]);
		let subp = await req.db.query("" +
		"SELECT subs.urlname, GROUP_CONCAT(p.permissionCode SEPARATOR ',') AS perms FROM `users` u " +
		"LEFT JOIN `subscriptions` s ON s.userID = u.id " +
		"LEFT JOIN `sub_mod_permissions` p ON p.subscriptionID = s.id " +
		"LEFT JOIN `subs` ON subs.id = s.subID " +
		"WHERE u.id = ? " +
		"GROUP BY s.id", [data.id]);

		let subPerms = {};
		if(null === subp)
			subp = [];
		subp.filter(o => o.perms !== null).forEach(o => { subPerms[o.urlname] = o.perms.split(','); });

		let retObj = {
			userID: insertObj.userID,
			name: data.name,
			token: insertObj.token,
			refresh: insertObj.refreshToken,
			validUntil: insertObj.expirationDate,
			subscriptions: (s !== null && s[0].list.split(',')) || [],
			permissions: (p !== null && p[0].perms !== null && p[0].perms.split(',')) || [],
			subPermissions: subPerms
		};
		res.json(retObj)
	});
}
