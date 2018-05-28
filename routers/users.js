'use strict';

/*
ENDPOINTS:

/users/ con GET???
/users/:USER con USERNAME o ID, get, post, put, delete
/users/:USER/profile: devuelve el perfil

/users/:USER/profile/posts
/users/:USER/profile/comments
/users/:USER/profile/upvoted
/users/:USER/profile/downvoted

/user/:USER/ban
/user/:USER/unban

/user/:USER/mod
/user/:USER/unmod

Modelos que usamos:
*/
const settings = require('settings');
const newUserModel = ['name', 'email', 'password']; // Nuevo usuario
const publicUserModel = ["id", "name", "description", "avatar", "creationDate"]; // Output 
const privateUserModel = ["id", "name", "email", "description", "avatar", "creationDate"]; // Output personal

const bcrypt = require('bcrypt')
const isInt = require('depicts-whole-number');
const checkModel = require('models');
const validate = require('models').validate;

const router = require('express').Router();
module.exports = router;



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Router uses////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Middlewares
router.use(checkPermissions);
router.use('/:user', checkUserValidity);

router.post('/', checkInsertIntegrity);
router.post('/', checkUsedData);

router.put('/:user', checkFieldsValidity)

router.post('/', encryptPassword);
router.put('/:user', encryptPassword);


// Endpoints
router.get('/', getUserList);

router.get('/:user', getUser);

router.post('/', addUser);

router.put('/:user', editUser)

router.delete('/:user', removeUser)


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Middlewares////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function checkUserValidity(req, res, next) {
	// Asumimos que se escapa la mierda esta no? xd
	if(isInt(req.params.user)) {
		return res.badPetition("Can't use ID as user getter for the time being.", 500);
	} else if(!validate(req.params.user, "username")) {
		return res.badPetition("invalidName");
	}

	let q = await req.db.query("SELECT id FROM `users` WHERE name = ?", req.params.user);
	if(null === q)
		return res.badPetition("noSuchUser");

	next();
}

async function checkPermissions(req, res, next) {
	console.error("users.js -> checkPermissions -> Falta implementar");
	next();
}

function checkInsertIntegrity(req, res, next) {

	let c = checkModel(req.body, 'user', newUserModel);
	
	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors })
	next();
}

// Comprueba si el email o el nombre está en uso
async function checkUsedData(req, res, next) {
	let q = await req.db.query("SELECT name, email FROM `users` WHERE name = ? OR email = ?", [req.body.name, req.body.email]);
	if(null !== q)
		return res.badPetition((q[0].name === req.body.name ? "nameExists" : "emailExists"));
	next();
}

function checkFieldsValidity(req, res, next) {
	if(Object.keys(req.body).length === 0)
		return res.badPetition("malformedRequest");

	let c = checkModel(req.body, 'userEdit', false);

	if(!c.result)
		res.badPetition("malformedRequest", {errors: c.errors })
	next();
}

async function encryptPassword(req, res, next) {
	if(req.body.password !== undefined)
		req.body.password = await bcrypt.hash(req.body.password, settings.pwdSaltRounds);

	next();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function getUserList(req, res) {
	
	let q;
	if(req.options.fromID === undefined) {
		q = await req.db.query("SELECT ?? FROM `users` ORDER BY id DESC LIMIT " + req.options.count, [publicUserModel]);
	} else {
		q = await req.db.query("SELECT ?? FROM `users` WHERE id < ? ORDER BY id DESC LIMIT " + req.options.count, [publicUserModel, req.options.fromID]);
	}
	//console.log(q);
	res.json(q);
}

async function getUser(req, res) {
	
	let q = await req.db.query("SELECT ?? FROM `users` WHERE name = ?", [publicUserModel, req.params.user]);
	//console.log(q);
	res.json(q[0]);
}

async function addUser(req, res) {
	let q = await req.db.query("INSERT INTO `users` SET ?", req.body);
	let get = await req.db.query("SELECT ?? FROM `users` WHERE id = ?", [privateUserModel, q.insertId]);
	res.json(get[0]);
}

async function editUser(req, res) {
	let q = await req.db.query("UPDATE `users` SET ? WHERE name = ?", [req.body, req.params.user]);
	let get = await req.db.query("SELECT ?? FROM `users` WHERE name = ?", [privateUserModel, req.params.user]);
	res.json(get[0]);
}

async function removeUser(req, res) {
	let get = await req.db.query("SELECT ?? FROM `users` WHERE name = ?", [privateUserModel, req.params.user]);
	let q = await req.db.query("DELETE FROM `users` WHERE name = ?", [req.params.user]);
	res.json(get[0]);
}