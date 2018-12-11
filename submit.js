var http = require('http');
var fs = require('fs');
var url = require('url');
var formidable = require('formidable');

console.log('listening on 8080')

let players = [];
let decks = [];

//Get list of players from playerDB.txt and push it into
//	players list.
readPlayerDB();
readDeckDB();

http.createServer(function (req, res) {
	var q = url.parse(req.url, true);
	var filename = "." + q.pathname;

	console.log(req.url);

	if(q.search.split('?').length > 1){
		let action = q.search.split('?')[1].split('=')[1];

		if(action == 'addPlayer'){
			addPlayer(q, res, req);
		}else if(action == "loadPlayers"){
			sendPlayers(res);
		}else if(action == "editPlayer"){
			editPlayer(q, res, req);
		}else if(action == "removePlayer"){
			removePlayer(q,res);
		}else if(action == "addDeck"){
			addDeck(q,res,req);
		}else if(action == "loadDecks"){
			sendDecks(q,res,req);
		}else if(action == "removeDeck"){
			removeDeck(q,res,req);
		}
	}else{
		fs.readFile(filename, function(err, data) {
			if (err) {
				res.writeHead(404, {'Content-Type': 'text/html'});
				return res.end("404 Not Found");
			}

			if(filename.split('.')[2] == 'css'){
				res.writeHead(200, {'Content-Type': 'text/css'});
			}else{
				res.writeHead(200, {'Content-Type': 'text/html'});
			}
			res.write(data);
			return res.end();
		});
	}
	

	
}).listen(8080);

//PLAYER FUNCTIONS
function findPlayer(playerEmail){
	console.log('trying to find:', playerEmail);
	let playerFound = false;
	players.forEach(player=>{
		if(player.email == playerEmail){
			console.log('email found', player.name);
			playerFound = player;
		}
	})
	return playerFound;
}

function readPlayerDB(){
	fs.readFile('playerDB.txt', 'utf8', (err,data)=>{
		if(err) throw err;
		players = JSON.parse(data);
		console.log(decks);
	});
}

function writePlayerDB(){
	let str = JSON.stringify(players);
	fs.writeFile('playerDB.txt', str,(err)=>{
		if(err) throw err;
		console.log('playerDB Written');
	})
}

function sendPlayers(res){
	res.writeHead(200, {'Content-Type': 'text/JSON'});
	res.write(JSON.stringify(players));
	return res.end();
}

//TODO FIX EDIT PLAYER. CURRENTLY BUSTED
function editPlayer(q, res,req){
	let form = new formidable.IncomingForm();

	form.parse(req, function (err, fields, files) {
		console.log(fields);

		let oldPlayer = {};
		let newPlayer = {};
		let keys = Object.keys(fields);

		let oldKeys = [];
		let newKeys = [];

		keys.forEach(key =>{
			if(key.startsWith("old")){
				oldKeys.push(key);
			}else{
				newKeys.push(key);
			}
		});

		newKeys.forEach(key=>{
			newPlayer[key] = fields[key];
		});
		if(fields['oldemail'] != fields['email']){
			if(!findPlayer(fields['oldemail'])){
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write('badEmail');
				res.end();
				return;	
			}else if(findPlayer(fields['email'])){
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write('duplicateEmail');
				res.end();
				return;	
			}
		}

		players[players.indexOf(findPlayer(fields['oldemail']) )] = newPlayer;
		console.log(players);
		writePlayerDB();

		res.writeHead(200, {'Content-Type': 'text/html'});
		res.write('success');
		res.end();
		return;		
	});
}

function removePlayer(q,res){
	let index = q.search.split('|')[1].split('=')[1];
	players.splice(index,1);

	writePlayerDB();

	res.writeHead(200, {'Content-Type': 'text/JSON'});
	res.write("player removed");
	return res.end();
}

function addPlayer(q,res,req){
	let form = new formidable.IncomingForm();

	form.parse(req, function (err, fields, files) {
		console.log(fields);

		let player = {};
		let keys = Object.keys(fields);
		keys.forEach(key=>{
			player[key] = fields[key];
		});

		console.log(player);

		if(player.name.length < 3){
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('tooShort');
			res.end();
			return;
		}else if(findPlayer(player.email)){
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('duplicate');
			res.end();
			return;
		}else{
			players.push(player);
			writePlayerDB();

			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('success');
			res.end();
			return;
		}
	});
}

//DECK FUNCTIONS
function writeDeckDB(){
	let str = JSON.stringify(decks);
	fs.writeFile('deckDB.txt', str,(err)=>{
		if(err) throw err;
		console.log('deckDB Written');
	})
}

function readDeckDB(){
	fs.readFile('deckDB.txt', 'utf8', (err,data)=>{
		if(err) throw err;
		decks = JSON.parse(data);
		console.log(decks);
	});
}

function sendDecks(q,res,req){
	res.writeHead(200, {'Content-Type': 'text/JSON'});
	res.write(JSON.stringify(decks));
	return res.end();
}

function findDeckByName(dName){
	let selectedDeck = false;
	decks.forEach(deck=> {
		if(deck.name == dName){
			selectedDeck = deck;
		}
	})
	return selectedDeck;
}

function addDeck(q,res,req){
	let form = new formidable.IncomingForm();
	//console.log(req);

	form.parse(req, function (err, fields, files) {
		let deck = {};
		let keys = Object.keys(fields)
		keys.forEach(key=>{
			deck[key] = fields[key];
		})

		if(deck.name.length < 3){
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('Deck Name Too Short');
			res.end();
			return;
		}else if(deck.faction1 == deck.faction2 || 
				 deck.faction1 == deck.faction3 ||
				 deck.faction2 == deck.faction3){
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write("Can't have duplicate factions");
			res.end();
			return;
		}else if(findDeckByName(deck.name)){
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write("A Deck with that name is already loaded");
			res.end();
			return;
		}
		//TODO (make sure that deck doesn't exist already)

		if(!files.file){
			decks.push(deck);
			writeDeckDB();
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write('Deck added! (without QR Code)');
			res.end();
		}else{
			//file handling
			let oldpath = files.file.path;
			let newpath = 'C:/Users/backup pc/Desktop/keyforge-league/uploads/' + files.file.name;
			fs.rename(oldpath, newpath,(err) =>{
				if(err) throw err;
				deck['filepath'] = newpath;

				
				decks.push(deck);
				writeDeckDB();

				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write('Deck added!')
				res.end();
			})
		}
		
    });
}

function removeDeck(q,res,req){
	let form = new formidable.IncomingForm();
	//console.log(req);

	form.parse(req, function (err, fields, files) {
		let deck = {};
		let keys = Object.keys(fields)
		keys.forEach(key=>{
			deck[key] = fields[key];
		})

		if(deck.name){
			let foundDeck = findDeckByName(deck.name);
			decks.splice(decks.indexOf(foundDeck),1);

			writeDeckDB();

			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write("Deck Removed");
			res.end();
		}else{
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write("Deck Not Found");
			res.end();
		}		
    });
}

//TODO
function editDeck(q,res,req){

}