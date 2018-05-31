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
const buildPostQuery = function(req) {
	return "" +
	"SELECT posts.*, users.name AS authorName, IFNULL(votes.score, 0) AS score, " +
	"COUNT(DISTINCTROW comments.id) AS commentCount, IFNULL(COUNT(DISTINCT just_upvotes.id)*100/totalVotes, 0) AS upvotePercentage FROM `posts` " + 
	"LEFT JOIN `users` ON posts.authorID = users.id " +
	"LEFT JOIN `comments` ON posts.id = comments.postID " +
	"LEFT JOIN (SELECT postID, SUM(value) AS score, COUNT(*) AS totalVotes FROM `post_votes` GROUP BY postID) votes ON posts.id = votes.postID " +
	"LEFT JOIN `post_votes` AS just_upvotes ON posts.id = just_upvotes.postID AND just_upvotes.value > 0 " +
	"WHERE posts.subID = ? " + 
	(req.post ? "AND posts.id = ? " : "") + 
	(req.options.fromID ? "AND posts.id < '" + req.options.fromID + "' " : "") + 
	"GROUP BY posts.id ORDER BY posts.id DESC LIMIT " + req.options.count;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Router uses////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Middlewares
router.use(checkPermissions);
router.use('/:post', checkPostValidity);

router.get('/', validatePostListOptions);
router.get('/:post', validateSinglePostOptions);
// CHECKPOSTVALIDITY DEBE ENCARGARSE AGREGAR req.post!!!!

router.post('/', checkPostInsertIntegrity);
router.put('/:post', checkPostUpdateIntegrity);
// Endpoints

router.get('/', getPostList);

router.get('/:post', getPost);

router.post('/', addPost);

router.put('/:post', editPost);

router.delete('/:post', removePost);



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Middlewares////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function validateSinglePostOptions(req, res, next) {
	
	if(req.options.fromID !== undefined) {
		return res.badPetition("incompatibleOptionFromID");
	}
	if(req.query.count !== undefined) { // leemos de query porque en options siempre hay un count falsete
		return res.badPetition("incompatibleOptionCount");
	}

	// Indicamos que es un único post para buildear la query luego, y modificamos variables para ahorrar lógica luego.
	//req.post.isSinglePost = true; // No hace falta, si hay req.post se infiere.
	req.options.count = 1;

	next();
}
function validatePostListOptions(req, res, next) {
	if(req.options.includeComments !== undefined) {
		return res.badPetition("incompatibleOptionComments");
	}

	next();
}

async function checkPostValidity(req, res, next) {

	let q = await req.db.query("SELECT id, subID FROM `posts` WHERE id = ?", [req.params.post]);
	if(null === q)
		return res.badPetition("noSuchPost");

	if(q[0].subID !== req.sub.id)
		return res.badPetition("incorrectSubForGivenPost")

	req.post = q[0];
	next();
}

async function checkPermissions(req, res, next) {
	console.error("posts.js -> checkPermissions -> Falta implementar");
	next();
}

function checkPostInsertIntegrity(req, res, next) {

	let c = checkModel(req.body, 'post', ["title", "content"]);
	
	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors })
	next();
}

function checkPostUpdateIntegrity(req, res, next) {

	if(Object.keys(req.body).length === 0)
		return res.badPetition("malformedRequest");

	let c = checkModel(req.body, 'postEdit', false);
	
	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors })
	next();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// En los get incluir authorName, commentCount, score y upvotePercentage
async function getPostList(req, res) {
	let q = await req.db.query(buildPostQuery(req), [req.sub.id]);

	res.json(q);

}

async function getPost(req, res) {
	// TODO: Get_comments
	let q = await req.db.query(buildPostQuery(req), [req.sub.id, req.params.post]);

	if(false && req.options.includeComments) {
		// No me gusta nada lo de las múltiples queries y tal :/
		let comments = await req.db.query("SELECT * FROM `comments` WHERE postID = ? ORDER BY id DESC LIMIT " + req.options.count, [req.params.post]);
		q[0]['comments'] = comments;
	}

	res.json(q[0]);

	// TODO: INCLUDE POSTS
}

async function addPost(req, res) {
	// Insertamos la id del sub también y la del usuario
	req.body.subID = req.sub.id;
	req.body.authorID = req.user.id;

	let q = await req.db.query("INSERT INTO `posts` SET ?", req.body);
	let get = await req.db.query("SELECT * FROM `posts` WHERE id = ?", [q.insertId]);

	res.json(get[0]);
}

async function editPost(req, res) {
	
	let q = await req.db.query("UPDATE `posts` SET ? WHERE id = ?", [req.body, req.params.post]);
	let get = await req.db.query("SELECT * FROM `posts` WHERE id = ?", [req.params.post]);
	res.json(get[0]);
}

async function removePost(req, res) {
	
	let get = await req.db.query("SELECT * FROM `posts` WHERE id = ?", [req.params.post]);
	await req.db.query("DELETE FROM `posts` WHERE id = ?", [req.params.post]);
	res.json(get[0]);
}