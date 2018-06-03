'use strict';

/*

ENDPOINTS:

/sub/:SUB/:postid/comments GET?
/sub/:SUB/:postid/comments/:id GET POST PUT DELETE,
							   -> GET con include_replies y deep?

*/

const checkModel = require('models');
const validate = require('models').validate;
const getModelList = require('models').toString;
const router = require('express').Router();
module.exports = router;

// Middlewares
router.use(checkPermissions);
router.use('/:comment', checkCommentValidity);

//router.get('/', validateCommentListOptions);
//router.get('/:comment', validateSingleCommentOptions);
// CHECKPOSTVALIDITY DEBE ENCARGARSE AGREGAR req.post!!!!

router.post('/', checkCommentInsertIntegrity); // Incluye comprobar replyTo ofc.
router.put('/:comment', checkCommentUpdateIntegrity);
// Endpoints

router.get('/', getCommentList);

router.get('/:comment', getComment);

router.post('/', addComment);

router.put('/:comment', editComment);

router.delete('/:comment', removeComment);



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Middlewares////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function checkPermissions(req, res, next) {
	console.error("comments.js -> checkPermissions -> Falta implementar");
	next();
}

function checkCommentValidity(req, res, next) {
	let q = req.db.query("SELECT id, subID, postID FROM `comments` WHERE id = ?", [req.params.comment]);
	if(null === q)
		return res.badPetition("noSuchComment");

	if(q[0].subID != req.sub.id)
		return res.badPetition("incorrectSubForGivenComment");

	if(q[0].postID != req.post.id)
		return res.badPetition("incorrectPostForGivenComment");

	next();
}

function checkCommentInsertIntegrity(req, res, next) {

	let c = checkModel(req.body, 'comment', ['content']);
	
	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors });

	if(req.body.replyTo !== undefined) {
		let q = req.db.query("SELECT id FROM `comments` WHERE id = ? AND subID = ? AND postID = ? LIMIT 1", [req.body.replyTo, req.sub.id, req.post.id]);
		if(null === q)
			return res.badPetition("invalidReplyTo");
	}
	next();
}

function checkCommentUpdateIntegrity(req, res, next) {
	
	let c = checkModel(req.body, 'comment');

	if(!c.result)
		return res.badPetition("malformedRequest", {errors: c.errors });

	next();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getCommentList(req, res) {

	let q = req.db.query("SELECT * FROM `comments` WHERE postID = ? ORDER BY id DESC LIMIT " + req.options.count, [req.post.id]);
	res.json(q);
}

function getComment(req, res) {
	// include_replies? deep? replies_count?

	let q = req.db.query("SELECT * FROM `comments` WHERE id = ?", [req.params.comment]);
	res.json(q[0]);
}

function addComment(req, res) {

	let ins = req.db.query("INSERT INTO `comments` SET ?", req.body);
	let get = req.db.query("SELECT * FROM `comments` WHERE id = ? ", [ins.insertId]);

	res.json(get[0]);
}

function editComment(req, res) {

	let ins = req.db.query("UPDATE `comments` SET ? WHERE id = ?", [req.body, req.params.comment]);
	let get = req.db.query("SELECT * FROM `comments` WHERE id = ? ", [req.params.comment]);

	res.json(get[0]);
}

function removeComment(req, res) {

	let get = req.db.query("SELECT * FROM `comments` WHERE id = ? ", [req.params.comment]);
	let ins = req.db.query("DELETE FROM `comments` WHERE id = ?", [req.params.comment]);

	res.json(get[0]);
}

/*
deep ASC, id DESC



rAICES por score descendiente, hijos por id ascendiente: como?



(SELECT c.*, SUM(v.value) AS score FROM `comments` c
LEFT JOIN `comment_votes` v ON v.commentID = c.id
WHERE c.replyTo IS NULL
GROUP BY c.id
ORDER BY score DESC LIMIT 100)
UNION
(SELECT c.*, SUM(v.value) AS score FROM `comments` c
LEFT JOIN `comment_votes` v ON v.commentID = c.id
WHERE c.replyTo IS NOT NULL
GROUP BY c.id
ORDER BY score DESC LIMIT 100)
ORDER BY replyTo ASC, score DESC


VIEWS?
CREATE VIEW comm AS (SELECT c.*, SUM(v.value) AS score FROM `comments` c
LEFT JOIN `comment_votes` v ON v.commentID = c.id
WHERE c.replyTo IS NULL
GROUP BY c.id
ORDER BY score DESC LIMIT 100);
SELECT * FROM comm
UNION
(SELECT c.*, SUM(v.value) AS score FROM `comments` c
LEFT JOIN `comment_votes` v ON v.commentID = c.id
WHERE c.replyTo IS NOT NULL AND c.replyTo IN comm
GROUP BY c.id
ORDER BY score DESC LIMIT 100)
ORDER BY replyTo ASC, score DESC
*/