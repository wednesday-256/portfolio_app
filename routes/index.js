var express = require('express');
var router = express.Router();



//require controller modules 
var playerController = require('../controllers/playerController')
var checkersController = require('../controllers/checkersController') 
var colorController = require('../controllers/colorController')
var tictactoeController = require('../controllers/tictactoeController')

/* GET home page. */
router.get('/', playerController.player_index_get);

//user routes 
router.get('/profile/logout', playerController.player_logout_get)

router.post('/profile/signin', playerController.player_signin_post)

router.post('/profile/recover', playerController.player_recover_post)

router.post('/profile/create', playerController.player_create_post)

router.get('/profile/:id', playerController.player_detail)

router.get('/profile/:id/update', playerController.player_update_get)

router.post('/profile/:id/update', playerController.player_update_post)

router.get('/profile/:id/delete', playerController.player_delete_get)


//color routes
router.get('/colors', colorController.color_list)

router.get('/color/:id/details', colorController.color_details)

router.get('/color/:id/join', colorController.color_join_get)

router.post('/color/join', colorController.color_join_post)

router.post('/color/create', colorController.color_create_post)

router.get('/color/:id', colorController.color_game)

router.post('/color/api', colorController.color_api)


//tictactoe routes
router.get('/tictactoes', tictactoeController.tictactoe_list)

router.get('/tictactoe/:id/details', tictactoeController.tictactoe_details)

router.get('/tictactoe/:id/join', tictactoeController.tictactoe_join_get)

router.post('/tictactoe/join', tictactoeController.tictactoe_join_post)

router.post('/tictactoe/create', tictactoeController.tictactoe_create_post)

router.get('/tictactoe/:id', tictactoeController.tictactoe_game)

router.post('/tictactoe/api', tictactoeController.tictactoe_api)


//checkers routes
router.get('/checkers-list', checkersController.checkers_list)

router.get('/checkers/:id/details', checkersController.checkers_details)

router.get('/checkers/:id/join', checkersController.checkers_join_get)

router.post('/checkers/join', checkersController.checkers_join_post)

router.post('/checkers/create', checkersController.checkers_create_post)

router.get('/checkers/:id', checkersController.checkers_game)

router.post('/checkers/api', checkersController.checkers_api)


module.exports = router;
