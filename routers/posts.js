'use strict';
/*
Endpoints:
/sub/:sub/posts/:PID con get, delete, put, post
/sub/:sub/posts con GET: Lista de posts

*/

const checkModel = require('models');
const validate = require('models').validate;
const getModelList = require('models').toString;

const router = require('express').Router();
module.exports = router;

/* QUERIES QUE SE REUTILIZAN */
/*
---
*/
const postQuery = function(isSinglePost) {
	return "" +
	"SELECT posts.*, users.name AS authorName, IFNULL(votes.score, 0) AS score, " +
	"COUNT(DISTINCTROW comments.id) AS commentCount, IFNULL(COUNT(DISTINCT just_upvotes.id)*100/totalVotes, 0) AS upvotePercentage FROM `posts` " + 
	"JOIN `users` ON posts.authorID = users.id " +
	"LEFT JOIN `comments` ON posts.id = comments.postID " +
	"LEFT JOIN (SELECT postID, SUM(value) AS score, COUNT(*) AS totalVotes FROM `post_votes` GROUP BY postID) votes ON posts.id = votes.postID " +
	"LEFT JOIN `post_votes` AS just_upvotes ON posts.id = just_upvotes.postID AND just_upvotes.value > 0 " +
	(isSinglePost ? "WHERE posts.id = ? " : "") + 
	"GROUP BY posts.id";
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Router uses////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Middlewares
router.use(checkPermissions);
router.use('/:post', checkPostValidity);
// CHECKPOSTVALIDITY DEBE ENCARGARSE AGREGAR req.post!!!!

router.post('/', checkPostIntegrity);
router.put('/:post', checkPostIntegrity);
// Endpoints

router.get('/', getPostList);

router.get('/:post', getPost);

router.post('/', addPost);

router.put('/:post', editPost);

router.delete('/:sub', removePost);



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Middlewares////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function checkPostValidity(req, res, next) {

	let q = await req.db.query("SELECT id, subID FROM `posts` WHERE id = ?", [req.params.post]);
	if(null === q)
		return res.badPetition("noSuchPost");

	if(q[0].subID !== req.sub.id)
		return res.badPetition("incorrectSubForGivenPost")

	console.log("checkPostValidity", q, req.sub)
	req.post = q[0];
	next();
}

async function checkPermissions(req, res, next) {
	console.error("posts.js -> checkPermissions -> Falta implementar");
	next();
}

function checkPostIntegrity(req, res, next) {

	let c = checkModel(req.body, 'post');
	
	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors })
	next();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// En los get incluir authorName, commentCount, score y upvotePercentage
async function getPostList(req, res) {
	
	let q = await req.db.query(postQuery());

	res.json(q);

}

async function getPost(req, res) {
	// TODO: Get_comments
	let q = await req.db.query(postQuery(true), [req.params.post]);

	res.json(q[0]);

	// TODO: INCLUDE POSTS
}

async function addPost(req, res) {
	return res.badPetition("No implementado (addPost)", 500);
	let q = await req.db.query("INSERT INTO `posts` SET ?", req.body);
	let get = await req.db.query("SELECT * FROM `posts` WHERE id = ?", [q.insertId]);
	
	// Añadir suscripción tambien
	await req.db.query("CALL create_admin_subscription(?, ?)", [req.user.id, q.insertId])

	res.json(get[0]);
}

async function editPost(req, res) {
	return res.badPetition("No implementado (editPost)", 500);
	let q = await req.db.query("UPDATE `subs` SET ? WHERE urlname = ?", [req.body, req.params.sub]);
	let get = await req.db.query("SELECT * FROM `subs` WHERE urlname = ?", [req.params.sub]);
	res.json(get[0]);
}

async function removePost(req, res) {
	return res.badPetition("No implementado (removePost)", 500);
	let get = await req.db.query("SELECT * FROM `subs` WHERE urlname = ?", [req.params.sub]);
	let q = await req.db.query("DELETE FROM `subs` WHERE urlname = ?", [req.params.sub]);
	res.json(get[0]);
}