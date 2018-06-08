/*
Endpoints:
/sub/:sub/posts/:PID con get, delete, put, post
/sub/:sub/posts con GET: Lista de posts

*/

const settings = require('settings');
const checkModel = require('models');

const router = require('express').Router();
module.exports = router;

/* QUERIES QUE SE REUTILIZAN */

/*
---
Iteración anterior:
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
*/
const buildPostQuery = function(req) {
	let where = [];
	if(!req.sub.isAll && !req.sub.isMe)
		where.push("posts.subID = ?");
	if(req.sub.isMe)
		where.push("posts.subID IN (SELECT subs.id FROM `subs` LEFT JOIN `subscriptions` s ON s.subID = subs.id WHERE s.userID = '" + req.user.id + "')")
	if(req.post)
		where.push("posts.id = ?");
	if(req.options.fromID)
		where.push("posts.id < '" + req.options.fromID + "'");

	let postSelection;
	if(req.post) {
		postSelection = "posts.*";
	} else {
		postSelection = "posts.id, posts.title, posts.link, posts.avatar, posts.authorID, posts.subID, posts.creationDate";
	}

	return "" +
	"SELECT " + postSelection + ", subs.urlname AS subUrlname, users.name AS authorName, COUNT(DISTINCTROW comments.id) AS commentCount, " +
	(req.user !== undefined ? "IFNULL(self_votes.value, 0) AS ownVote, " : "") +
	"COUNT(DISTINCT votes.id) AS totalVotes, " +
	"IFNULL(SUM(votes.value)*COUNT(DISTINCT votes.id)/COUNT(posts.id), 0) AS score, " +
	"IFNULL(COUNT(DISTINCT just_upvotes.id)*100/COUNT(DISTINCT votes.id), 0) AS upvotePercentage " +
	"FROM `posts` " +
	"JOIN `subs` ON posts.subID = subs.id " +
	"LEFT JOIN `users` ON posts.authorID = users.id " +
	"LEFT JOIN `comments` ON posts.id = comments.postID " +
	"LEFT JOIN `post_votes` AS votes ON posts.id = votes.postID " +
	"LEFT JOIN `post_votes` AS just_upvotes ON posts.id = just_upvotes.postID AND just_upvotes.value > 0 " +
	(req.user !== undefined ? "LEFT JOIN `post_votes` AS self_votes ON posts.id = self_votes.postID AND self_votes.voterID = '" + req.user.id + "' " : "") +
	(where.length > 0 ? "WHERE " + where.join(" AND ") + " " : "") +
	"GROUP BY posts.id ORDER BY posts.id DESC LIMIT " + req.options.count;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Router uses////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Middlewares
router.post('/', notAll);
router.use('/:post', notAll);
// TODO: Al votar cuidado con el notAll

router.use('/:post', checkPostValidity); // incluye req.post y req.isAuthor? Maybe?

router.post('/', checkUserSubbed);
router.put('/:post', checkUserSubbed);
router.delete('/:post', checkUserSubbed);

router.post('/:post/votes', checkUserSubbed);
router.delete('/:post/votes', checkUserSubbed);

router.put('/:post', checkPermissionsEditPost);
router.delete('/:post', checkPermissionsDeletePost);

router.get('/', validatePostListOptions);
router.get('/:post', validateSinglePostOptions);
// CHECKPOSTVALIDITY DEBE ENCARGARSE AGREGAR req.post!!!!

router.post('/', checkPostInsertIntegrity);
router.put('/:post', checkPostUpdateIntegrity);

router.use('/:post/votes', checkVoteBody)

router.post('/', generateImage);
// Endpoints

router.get('/', getPostList);

router.get('/:post', getPost);

router.post('/', addPost);

router.put('/:post', editPost);

router.delete('/:post', removePost);

router.post('/:post/votes', votePost);
router.delete('/:post/votes', unvotePost);



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Middlewares////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function checkVoteBody(req, res, next) {
	req.vote = parseInt(req.body.vote);
	if(req.body.vote === undefined)
		return res.badPetition("malformedRequest", "Field 'vote' missing");

	if(req.vote !== 1 && req.vote !== -1)
		return res.badPetition("malformedRequest", "Invalid vote amount")

	return next();
}

function notAll(req, res, next) {
	if(req.params.sub === "all")
		return res.badPetition("forbidden");

	return next();
}

function checkUserSubbed(req, res, next) {
	if(req.user === undefined)
		return res.badPetition("mustBeLoggedIn");

	if(!req.sub.isSubbed)
		return res.badPetition("mustBeSubbed");

	return next();
}

function checkPermissionsEditPost(req, res, next) {
	if(!req.isAllowedTo('edit-posts', req.post.authorID))
		return res.badPetition("forbidden");

	return next();
}

function checkPermissionsDeletePost(req, res, next) {
	if(!req.isAllowedTo('delete-posts', req.post.authorID))
		return res.badPetition("forbidden");

	return next();
}

//// FIN PERMS ////

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

	return next();
}
function validatePostListOptions(req, res, next) {
	if(req.options.includeComments !== undefined) {
		return res.badPetition("incompatibleOptionComments");
	}

	return next();
}

async function checkPostValidity(req, res, next) {

	let q = await req.db.query("SELECT id, subID FROM `posts` WHERE id = ?", [req.params.post]);
	if(null === q)
		return res.badPetition("noSuchPost");

	if(q[0].subID !== req.sub.id)
		return res.badPetition("incorrectSubForGivenPost")

	req.post = q[0];
	return next();
}

function checkPostInsertIntegrity(req, res, next) {

	let c = checkModel(req.body, 'post', ["title", "content"]);

	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors })
	return next();
}

function checkPostUpdateIntegrity(req, res, next) {

	if(Object.keys(req.body).length === 0)
		return res.badPetition("malformedRequest");

	let c = checkModel(req.body, 'postEdit', false);

	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors })
	return next();
}

function generateImage(req, res, next) {
	//TODO: Buscar imagen en el post
	if(req.body.image === undefined) {
		req.body.image = settings.defaultPostImage;
	}

	return next();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// En los get incluir authorName, commentCount, score y upvotePercentage
async function getPostList(req, res) {
	let q = await req.db.query(buildPostQuery(req), (req.sub.isAll || req.sub.isMe ? null : [req.sub.id]));

	res.json(q || []);

}

async function getPost(req, res) {
	// TODO: Get_comments
	let q = await req.db.query(buildPostQuery(req), [req.sub.id, req.params.post]);

	if((q === null || q !== null) && req.options.includeComments) {
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

	await req.db.query("UPDATE `posts` SET ? WHERE id = ?", [req.body, req.params.post]);
	let get = await req.db.query("SELECT * FROM `posts` WHERE id = ?", [req.params.post]);
	res.json(get[0]);
}

async function removePost(req, res) {

	let get = await req.db.query("SELECT * FROM `posts` WHERE id = ?", [req.params.post]);
	await req.db.query("DELETE FROM `posts` WHERE id = ?", [req.params.post]);
	res.json(get[0]);
}

async function votePost(req, res) {
	let v = await req.db.query("SELECT id, value FROM `post_votes` WHERE voterID = ? AND postID = ?", [req.user.id, req.post.id]);
	if(null !== v && v[0].value === req.vote)
		return res.badPetition("alreadyVotedPost");

	if(null !== v)
		await req.db.query("DELETE FROM `post_votes` WHERE id = ?", [v[0].id]);

	let insertObj = {
		voterID: req.user.id,
		postID: req.post.id,
		value: req.vote
	};

	await req.db.query("INSERT INTO `post_votes` SET ?", insertObj);
	let total = req.db.query("SELECT SUM(value) FROM `post_votes` WHERE postID = ? GROUP BY postID", [req.post.id]);

	let ret = {
		postID: req.post.id,
		change: (null === v ? 1 : 2) * req.vote,
		total
	};

	res.json(ret);
}


async function unvotePost(req, res) {
	let v = await req.db.query("SELECT id, value FROM `post_votes` WHERE voterID = ? AND postID = ?", [req.user.id, req.post.id]);
	if(null === v)
		return res.badPetition("postNotVoted");

	if(v[0].value !== req.vote)
		return res.badPetition("malformedRequest", "Unvote amount =/= voted amount")

	await req.db.query("DELETE FROM `post_votes` WHERE id = ?", [v[0].id]);
	let total = req.db.query("SELECT SUM(value) FROM `post_votes` WHERE postID = ? GROUP BY postID", [req.post.id]);

	let ret = {
		postID: req.post.id,
		change: -parseInt(v[0].value),
		total
	};

	res.json(ret);
}
