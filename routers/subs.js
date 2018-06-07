/* ENDPOINTS:

El SUB puede referenciarse mediante ID o URLNAM
/subs/ NO
/subs/:sub/ con get, post, put, delete.
/subs/:sub/subscribe
/subs/:sub/unsubscribe
*/

const checkModel = require('models');
const validate = require('models').validate;

const router = require('express').Router();
module.exports = router;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Router uses////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Middlewares
router.use('/:sub', checkSubValidity);

router.use('/:sub', checkMeIsMine);
router.post('/', notAll);
router.put('/:sub', notAll);
router.delete('/:sub', notAll);
router.use('/:sub/subscriptions', notAll);
// CHECKSUBVALIDITY DEBE ENCARGARSE AGREGAR req.sub!!!!
// req.sub debe incluir un req.sub.isSubbed: boolean

router.use('/:sub', expandPermissions);

router.post('/', checkLoggedIn);
router.post('/', checkInsertIntegrity);
router.post('/', checkUsedData);

router.put('/:sub', checkLoggedIn);
router.put('/:sub', checkPermissionsEditSub);
router.put('/:sub', checkFieldsValidity);
router.put('/:sub', checkUsedData);


router.delete('/:sub', checkLoggedIn);
router.delete('/:sub', checkPermissionsDeleteSub);

// Endpoints

router.get('/:sub', getSub);

router.post('/', addSub);

router.put('/:sub', editSub);

router.delete('/:sub', removeSub);

router.post('/:sub/subscriptions', checkLoggedIn);
router.post('/:sub/subscriptions', checkNotSubbed);
router.post('/:sub/subscriptions', subscribe);

router.delete('/:sub/subscriptions', checkLoggedIn);
router.delete('/:sub/subscriptions', checkSubbed);
router.delete('/:sub/subscriptions', unsubscribe)



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Middlewares////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function checkMeIsMine(req, res, next) {
	if(req.params.sub === "me" && req.user === undefined)
		return res.badPetition("mustBeLoggedIn");

	return next();
}

function checkLoggedIn(req, res, next) {
	if(req.user === undefined)
		return res.badPetition("mustBeLoggedIn");

	return next();
}

function checkPermissionsEditSub(req, res, next) {
	if(!req.isAllowedTo('edit-subs'))
		return res.badPetition('forbidden');
	return next();
}

function checkPermissionsDeleteSub(req, res, next) {
	if(!req.isAllowedTo('delete-subs'))
		return res.badPetition('forbidden');
	return next();
}

function checkSubbed(req, res, next) {
	if(!req.sub.isSubbed)
		return res.badPetition("mustBeSubbed");

	return next();
}

function checkNotSubbed(req, res, next) {
	if(req.sub.isSubbed)
		return res.badPetition("cantBeSubbed");

	return next();
}


/*
expandPermissions amplia los permisos del usuario de modo que los permisos específicos de este sub se añadan al array de permisos
*/
async function expandPermissions(req, res, next) {
	if(req.user !== undefined) {
		let q = await req.db.query("SELECT GROUP_CONCAT(p.permissionCode SEPARATOR ',') AS perms FROM `subscriptions` s LEFT JOIN `sub_mod_permissions` p ON p.subscriptionID = s.id WHERE s.subID = ? AND s.userID = ? GROUP BY s.id", [req.sub.id, req.user.id]);
		if(q !== null && q[0].perms !== null) {
			// Array unique: https://stackoverflow.com/a/14438954
			req.user.permissions = req.user.permissions.concat(q[0].perms.split(',')).filter((v, i, a) => a.indexOf(v) === i);
		}
	}

	return next();
}


// FIN AUTH MIDDLES

async function checkSubValidity(req, res, next) {
	// Asumimos que se escapa la mierda esta no? xd
	if(req.params.sub !== "all" && req.params.sub !== "me" && !validate(req.params.sub, "subUrlname")) {
		return res.badPetition("invalidSubname");
	}

	if(req.params.sub === "all" || req.params.sub === "me") {
		req.sub = {
			urlname: req.params.sub,
			isAll: req.params.sub === "all",
			isMe: req.params.sub === "me"
		}
	} else {
		let q;
		if(req.user === undefined) {
			q = await req.db.query("SELECT id, urlname FROM `subs` WHERE urlname = ?", req.params.sub);
		} else {
			q = await req.db.query("SELECT subs.id, subs.urlname, subscriptions.id AS isSubbed FROM `subs` LEFT JOIN `subscriptions` ON subscriptions.subID = subs.id AND subscriptions.userID = ? WHERE subs.urlname = ?", [req.user.id, req.params.sub]);
		}

		if(null === q)
			return res.badPetition("noSuchSub");

		req.sub = q[0];
		req.sub.isSubbed = (req.sub.isSubbed || null) !== null;
		req.sub.isAll = false;
		req.sub.isMe = false;
	}

	return next();
}

function checkInsertIntegrity(req, res, next) {
	let c = checkModel(req.body, 'sub');

	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors })
	return next();
}

function checkFieldsValidity(req, res, next) {
	if(Object.keys(req.body).length === 0)
		return res.badPetition("malformedRequest");

	let c = checkModel(req.body, 'subEdit', false);

	if(!c.result)
		res.badPetition("malformedRequest", {errors: c.errors })
	return next();
}

// Comprueba si el urlname está en uso
async function checkUsedData(req, res, next) {

	let q = await req.db.query("SELECT id FROM `subs` WHERE urlname = ?", [req.body.urlname]);
	if(null !== q)
		return res.badPetition("subExists");

	return next();
}

function notAll(req, res, next) {
	if(req.params.sub === "all" ||req.params.sub === "me")
		return res.badPetition("forbidden");

	return next();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function getSub(req, res) {

	let q = await req.db.query("SELECT subs.*, IFNULL(COUNT(s.id), 0) AS subCount FROM `subs` LEFT JOIN `subscriptions` s ON s.subID = subs.id WHERE urlname = ?", [req.params.sub]);

	res.json(q[0]);

	// TODO: INCLUDE POSTS
}

async function addSub(req, res) {
	let q = await req.db.query("INSERT INTO `subs` SET ?", req.body);
	let get = await req.db.query("SELECT * FROM `subs` WHERE id = ?", [q.insertId]);

	// Añadir suscripción tambien
	await req.db.query("CALL create_admin_subscription(?, ?)", [req.user.id, q.insertId])

	res.json(get[0]);
}

async function editSub(req, res) {
	await req.db.query("UPDATE `subs` SET ? WHERE urlname = ?", [req.body, req.params.sub]);
	let get = await req.db.query("SELECT * FROM `subs` WHERE urlname = ?", [req.params.sub]);
	res.json(get[0]);
}

async function removeSub(req, res) {
	let get = await req.db.query("SELECT * FROM `subs` WHERE urlname = ?", [req.params.sub]);
	await req.db.query("DELETE FROM `subs` WHERE urlname = ?", [req.params.sub]);
	res.json(get[0]);
}

async function subscribe(req, res) {
	let insertObj = {
		userID: req.user.id,
		subID: req.sub.id
	}
	let q = await req.db.query("INSERT INTO `subscriptions` SET ?", insertObj);
	insertObj.id = q.insertId;
	res.json(insertObj);
}

async function unsubscribe(req, res) {
	await req.db.query("DELETE FROM `subscriptions` WHERE subID = ? AND userID = ?", [req.sub.id, req.user.id]);
	//let q = req.db.query("SELECT id FROM `subscriptions` WHERE subID = ? LIMIT 1", [req.sub.id]);

	res.end();
}
