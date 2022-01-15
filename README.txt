 ################
 ## HOW TO RUN ##
 ################

Note: Ensure node and npm is installed and in path, also ensure that mongodb is installed and listening for connections on default port "27017" or change the configuration in app.js to desired port

- Navigate to the project folder (folder containing this file or the package.json file) 
- Run  the following commands accordingly
	" npm install " 				<--- to install dependecies for the project
	" npm run devstart " 		<-- to run in developer mode
	" npm run start " 			<--- to run in normal/production mode
	" npm run test-init " 	<--- to initialize tests
	" npm run test " 				<--- to run tests

NOTE: To use a different port for the webserver export the port number as the "PORT" environment variable e.g on linux " export PORT=8000 "

	########################################
  ### DOCUMENTATION ON MAJOR FUNCTIONS ###
	########################################

COLOR GAME:
  Within the color.js file (the frontend js file) we several functions providing various functionality to the color game througout its life cycle, below are a few:
 
  myWorker.onmessage >> Provides a handler for message responses from the worker script like when its a users turn and when a player joins a game.

  turn_handler >>  Provides a handler for the current state of the game, updates the game accordingly and signals the user if the game is over or if it's the user's turn

  toggle_help >> an event handler for the help button to show help information about the game when pressed

  get_color >> fucntion to get the game state from the server and update elements accordingly.

  turn_toggle >> handler for player turns during game play.

  box_click >> to handle player options, sends response to the server and update elements on the page accordingly

  add_box_events >> adds events to the box on initialization of the color game.


TICTACTOE :
  show_error: shows error to the user

  Game class >>a class that holds various utilities for the game that can be extended by the present game class.

  message_handler >> a handler for message responses from the worker script .

  TGame class >> a class that holds functionality and state of the present game .

  TEngine >> a class to help evaluate the next best move.


CHECKERS:
  CGame class >> a class that holds functionality and state of the present game .

  CEngine >> a class to help evaluate the next best move.

  message_handler >> a handler for message responses from the worker script .


  
