'use strict';

/*

ENDPOINTS:

/sub/:SUB/:postid/comments GET?
/sub/:SUB/:postid/comments/:id GET POST PUT DELETE
/sub/:SUB/:postid/comments/:id/replies

*/

const router = require('express').Router();
module.exports = router;