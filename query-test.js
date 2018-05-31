const mysql = require('mysql');
const conn = mysql.createConnection(require('settings').dbSettings);

function test(obj) {
	let data = [6, 'tokensito'];
	conn.query(
		"" +
		"SELECT comments.*, users.name AS authorName, IFNULL(votes.score, 0) AS score, " +
		"COUNT(DISTINCTROW comments.id) AS commentCount, IFNULL(COUNT(DISTINCT just_upvotes.id)*100/totalVotes, 0) AS upvotePercentage FROM `posts` " + 
		"LEFT JOIN `users` ON posts.authorID = users.id " +
		"LEFT JOIN `comments` ON posts.id = comments.postID " +
		"LEFT JOIN (SELECT postID, SUM(value) AS score, COUNT(*) AS totalVotes FROM `post_votes` GROUP BY postID) votes ON posts.id = votes.postID " +
		"LEFT JOIN `post_votes` AS just_upvotes ON posts.id = just_upvotes.postID AND just_upvotes.value > 0 " + 
		"GROUP BY posts.id ORDER BY posts.id DESC LIMIT 20"
	, data, function(err, result, fields) {
		if(result == null) {
			obj.msg = "NULL";
			return false;
		}
		//console.log(result);
		for(a in result[0]) {
			//console.log(typeof obj, a, result[0][a]);
			obj[a] = result[0][a];
		}
	});
}

let obj = {};
test(obj);
setTimeout(function() {
	console.log("Obj: " + JSON.stringify(obj))
}, 2000);