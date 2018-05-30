'use strict';

/* ENDPOINTS:

El SUB puede referenciarse mediante ID o URLNAM
/subs/ NO
/subs/:sub/ con get, post, put, delete.
/subs/:sub/subscribe
/subs/:sub/unsubscribe
*/

const checkModel = require('models');
const validate = require('models').validate;
const getModelList = require('models').toString;

const router = require('express').Router();
module.exports = router;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Router uses////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Middlewares
router.use(checkPermissions);
router.use('/:sub', checkSubValidity);

router.post('/', checkInsertIntegrity);
router.post('/', checkUsedData);

router.put('/:sub', checkFieldsValidity);
router.put('/:sub', checkUsedData);

// Endpoints

router.get('/:sub', getSub);

router.post('/', addSub);

router.put('/:sub', editSub);

router.delete('/:sub', removeSub);



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Middlewares////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function checkSubValidity(req, res, next) {
	// Asumimos que se escapa la mierda esta no? xd
	if(!validate(req.params.sub, "subName")) {
		return res.badPetition("invalidSubname");
	}

	let q = await req.db.query("SELECT id FROM `subs` WHERE urlname = ?", req.params.sub);
	if(null === q)
		return res.badPetition("noSuchSub");

	next();
}

async function checkPermissions(req, res, next) {
	console.error("subs.js -> checkPermissions -> Falta implementar");
	next();
}

function checkInsertIntegrity(req, res, next) {

	let c = checkModel(req.body, 'sub');
	
	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors })
	next();
}

function checkFieldsValidity(req, res, next) {
	if(Object.keys(req.body).length === 0)
		return res.badPetition("malformedRequest");

	let c = checkModel(req.body, 'subEdit', false);

	if(!c.result)
		res.badPetition("malformedRequest", {errors: c.errors })
	next();
}

// Comprueba si el urlname está en uso
async function checkUsedData(req, res, next) {

	let q = await req.db.query("SELECT id FROM `subs` WHERE urlname = ?", [req.body.urlname]);
	if(null !== q)
		return res.badPetition("subExists");
		
	next();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function getSub(req, res) {
	
	let q = await req.db.query("SELECT * FROM `subs` WHERE urlname = ?", [req.params.sub]);

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
	let q = await req.db.query("UPDATE `subs` SET ? WHERE urlname = ?", [req.body, req.params.sub]);
	let get = await req.db.query("SELECT * FROM `subs` WHERE urlname = ?", [req.params.sub]);
	res.json(get[0]);
}

async function removeSub(req, res) {
	let get = await req.db.query("SELECT * FROM `subs` WHERE urlname = ?", [req.params.sub]);
	let q = await req.db.query("DELETE FROM `subs` WHERE urlname = ?", [req.params.sub]);
	res.json(get[0]);
}