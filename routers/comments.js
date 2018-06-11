/*

ENDPOINTS:

/sub/:SUB/:postid/comments GET?
/sub/:SUB/:postid/comments/:id GET POST PUT DELETE,
							   -> GET con include_replies y deep?


// Vamos a considerar que los comments se remueven (null) con el DELETE y listo.

*/

// TODO: Votos, score, permisos, ownVote, en posts añadir includ_comments?

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function queryCommentList(req) {

	let comm = (negateNull) => "" +
	"(SELECT c.*, IFNULL(SUM(v.value), 0) AS score, u.name AS authorName, " +
	(req.user ? "IFNULL(own_v.value, 0) AS ownVote " : "NULL AS ownVote ") +
	"FROM `comments` c " +
	"LEFT JOIN `comment_votes` v ON v.commentID = c.id " +
	"LEFT JOIN `users` u ON u.id = c.authorID " +
	(req.user ? "LEFT JOIN `comment_votes` own_v ON own_v.commentID = c.id AND own_v.voterID = '" + req.user.id + "' " : "") +
	"WHERE c.postID = ? AND c.replyTo IS " + (negateNull ? "NOT " : "") + "NULL " +
	"GROUP BY c.id " +
	"ORDER BY score DESC LIMIT 100) ";

	let query = "" +
	comm() +
	"UNION " +
	comm(true) +
	"ORDER BY replyTo ASC, score DESC LIMIT " + req.options.count;

	let q = await req.db.query(query, [req.post.id, req.post.id]);
	return q;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const checkModel = require('models');
const router = require('express').Router();
module.exports = router;

// Middlewares
router.use('/:comment', checkCommentValidity);

//router.get('/', validateCommentListOptions);
//router.get('/:comment', validateSingleCommentOptions);
// CHECKPOSTVALIDITY DEBE ENCARGARSE AGREGAR req.post!!!!

router.post('/', checkCommentInsertIntegrity); // Incluye comprobar replyTo ofc.
router.put('/:comment', checkCommentUpdateIntegrity);

router.post('/', checkUserSubbed);
router.delete('/:comment', checkPermissionsRemoveComment);
router.put('/:comment', checkPermissionsEditComment);

router.post('/:comment/votes', checkUserSubbed);
router.delete('/:comment/votes', checkUserSubbed);
// Endpoints

router.get('/', getCommentList);

router.get('/:comment', getComment);

router.post('/', addComment);

router.put('/:comment', editComment);

router.delete('/:comment', removeComment);

router.use('/:post/votes', checkVoteBody)

router.post('/:comment/votes', voteComment);
router.delete('/:comment/votes', unvoteComment);



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

function checkUserSubbed(req, res, next) {
	if(req.user === undefined)
		return res.badPetition("mustBeLoggedIn");

	if(!req.sub.isSubbed)
		return res.badPetition("mustBeSubbed");

	return next();
}

function checkPermissionsRemoveComment(req, res, next) {
	if(!req.isAllowedTo('remove-comments', req.comment.authorID))
		return res.badPetition("forbidden");

	return next();
}

function checkPermissionsEditComment(req, res, next) {
	if(!req.isAllowedTo('edit-comments', req.comment.authorID))
		return res.badPetition("forbidden");

	return next();
}

async function checkCommentValidity(req, res, next) {
	let q = await req.db.query("SELECT id, postID, authorID FROM `comments` WHERE id = ?", [req.params.comment]);
	if(null === q)
		return res.badPetition("noSuchComment");

	if(q[0].postID != req.post.id)
		return res.badPetition("incorrectPostForGivenComment");

	req.comment = q[0];

	return next();
}

async function checkCommentInsertIntegrity(req, res, next) {

	let c = checkModel(req.body, 'comment', ['content']);

	if(!c.result)
		return res.badPetition("malformedRequest", { errors: c.errors });

	if(req.body.replyTo !== undefined) {
		let q = await req.db.query("SELECT id FROM `comments` WHERE id = ? AND postID = ? LIMIT 1", [req.body.replyTo, req.post.id]);
		if(null === q)
			return res.badPetition("invalidReplyTo");
	}
	return next();
}

function checkCommentUpdateIntegrity(req, res, next) {

	let c = checkModel(req.body, 'commentEdit');

	if(!c.result)
		return res.badPetition("malformedRequest", {errors: c.errors });

	return next();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function getCommentList(req, res) {

	let q = await queryCommentList(req);
	/*
	q nos devuelve un array de comentarios. Vamos a organizarlos en árbol */
	// indices: { id_ID: elem }
	let indices = {};
	let root = [];

	for(let i = 0;i < q.length; i++) {
		indices['id_' + q[i].id] = q[i];
		q[i].replies = [];
		if(q[i].replyTo)
			indices['id_' + q[i].replyTo].replies.push(q[i]);
		else
			root.push(q[i])
	}


	res.json(root);
}

async function getComment(req, res) {
	// include_replies? deep? replies_count?

	let q = await req.db.query("SELECT c.*, u.name AS authorName FROM `comments` c LEFT JOIN `users` u ON u.id = c.authorID WHERE c.id = ?", [req.params.comment]);
	res.json(q[0]);
}

async function addComment(req, res) {

	req.body.authorID = req.user.id;
	req.body.postID = req.post.id;

	let ins = await req.db.query("INSERT INTO `comments` SET ?", req.body);
	let get = await req.db.query("SELECT * FROM `comments` WHERE id = ? ", [ins.insertId]);

	res.json(get[0]);
}

async function editComment(req, res) {

	await req.db.query("UPDATE `comments` SET ? WHERE id = ?", [req.body, req.params.comment]);
	let get = await req.db.query("SELECT * FROM `comments` WHERE id = ? ", [req.params.comment]);

	res.json(get[0]);
}


async function removeComment(req, res) {

	let get = await req.db.query("SELECT comments.*, IFNULL(COUNT(replies.id), 0) AS deletedReplies FROM `comments` LEFT JOIN `comments` replies ON replies.replyTo = comments.id WHERE comments.id = ? GROUP BY comments.id", [req.params.comment]);
	await req.db.query("DELETE FROM `comments` WHERE id = ?", [req.params.comment]);

	res.json(get[0]);
}

async function voteComment(req, res) {
	let v = await req.db.query("SELECT id, value FROM `comment_votes` WHERE voterID = ? AND commentID = ?", [req.user.id, req.comment.id]);
	if(null !== v && v[0].value === req.vote)
		return res.badPetition("alreadyVotedComment");

	if(null !== v)
		await req.db.query("DELETE FROM `comment_votes` WHERE id = ?", [v[0].id]);

	let insertObj = {
		voterID: req.user.id,
		commentID: req.comment.id,
		value: req.vote
	};

	await req.db.query("INSERT INTO `comment_votes` SET ?", insertObj);
	let total = await req.db.query("SELECT SUM(value) AS v FROM `comment_votes` WHERE commentID = ? GROUP BY commentID", [req.comment.id]);

	let ret = {
		commentID: req.comment.id,
		change: (null === v ? 1 : 2) * req.vote,
		total: total[0].v
	};

	res.json(ret);
}

async function unvoteComment(req, res) {
	let v = await req.db.query("SELECT id, value FROM `comment_votes` WHERE voterID = ? AND commentID = ?", [req.user.id, req.comment.id]);
	if(null === v)
		return res.badPetition("commentNotVoted");

	if(v[0].value !== req.vote)
		return res.badPetition("malformedRequest", "Unvote amount =/= voted amount")

	await req.db.query("DELETE FROM `comment_votes` WHERE id = ?", [v[0].id]);
	let totalQuery = await req.db.query("SELECT IFNULL(SUM(value), 0) AS v FROM `comment_votes` WHERE commentID = ? GROUP BY commentID", [req.comment.id]);
	let total = (null === totalQuery ? 0 : totalQuery[0].v)
	let ret = {
		commentID: req.comment.id,
		change: -parseInt(v[0].value),
		total
	};

	res.json(ret);
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
