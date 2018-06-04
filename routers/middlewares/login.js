'use script';

const settings = require('settings');

module.exports = async function(req, res) {
	let d = new Date();
	let c = require('models')(req.body, 'login');
	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors });

	let q = await req.db.query("SELECT id, password FROM `users` WHERE name = ?", [req.body.user]);
	
	if(null == q)
		return res.badPetition("forbiddenNoUser");

	require('bcrypt').compare(req.body.password, q[0].password, function(err, result) {
		if(err)
			return res.badPetition("genericError");
		if(!result)
			return res.badPetition("incorrectPassword");
		
		require('crypto').randomBytes(settings.auth.tokenLength, async (err, buf) => {
			if(err)
				return res.badPetition("genericError");

			let insertObj = {
				userID: q[0].id,
				token: buf.toString('hex', 0, settings.auth.tokenLength/2),
				refreshToken: buf.toString('hex', settings.auth.tokenLength/2),
				expirationDate: new Date(d.getTime() + settings.auth.tokenDuration * 1000)
			}
			await req.db.query("INSERT INTO `tokens` SET ?", insertObj);

			let s = await req.db.query("SELECT GROUP_CONCAT(subs.urlname SEPARATOR ',') AS list FROM `subscriptions` s JOIN `subs` ON s.subID = subs.id WHERE s.userID = ? GROUP BY s.userID", [q[0].id]);

			res.json({
				userID: insertObj.userID,
				name: req.body.user,
				token: insertObj.token,
				refresh: insertObj.refreshToken,
				validUntil: insertObj.expirationDate,
				subscriptions: s[0].list.split(',')
			})
		});

	});
}