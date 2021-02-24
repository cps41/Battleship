"use strict";

let error_array = new Array();
let players = new Array();
let cur;
let opp;

/*  Player class to keep track of player's data
    @params:
        name (String): name of the player
        aircraft (String): placement of the aircraft
        battleship (String): placement of the battleship
        submarine (String): placement of the submarine
        score (int): current score
*/
class Player {
    constructor(name, aircraft, battleship, submarine) {
        this.name = name;
        this.aircraft = aircraft;
        this.battleship = battleship;
        this.submarine = submarine;
        this.all = aircraft.concat(battleship).concat(submarine);
        this.score = 24;
        this.s = "aircraft: " + aircraft + ", \nbattleship: " + battleship + ", \nsubmarine: " + submarine;
        this.spaces = createSpaces(this);
        this.sunk = [false, false, false];
    }
    toString() {
        console.log(this.spaces);
        return "aircraft: " + this.aircraft + ", \nbattleship: " + this.battleship + ", \nsubmarine: " + this.submarine+'\nspaces: ';
    }
}

/*  Class to keep track of space's data.
    @params:
        ship(String): string representing what ship, if any, is in the space
        fired_at(boolean): true if the spot has been hit by the opponent
        hit(boolean): true if the player has hit a ship at this spot
        miss(boolean): true if the player has missed a ship at this spot
*/
class Space {
    constructor(ship) {
        this.ship = ship;
        this.fired_at = false;
        this.hit = false;
        this.miss = false;
    }
}

/*  Method to create an array of spaces to generate the player's grid
    @params:
        aircraft(String): range_array of aircraft
        battleship(String): range_array of battleship
        submarine(String): range_array of submarine
    @return
        spaces(Array(Space)): array of Space objects
*/
function createSpaces(player) {
    const spaces = new Array(100);
    for(const spot of player.aircraft) spaces[spot] = new Space("A");
    for(const spot of player.battleship) spaces[spot] = new Space("B");
    for(const spot of player.submarine) spaces[spot] = new Space("S");

    for(let i=0; i<100; i++) {
        if(spaces[i] == null) spaces[i] = new Space("");
    }

    console.log(spaces);
    return spaces;
}

/*  Method to parse the placement input for valid ship placement syntax
    Uses regex to parse for each ship's placement. Requires re-entry if syntax
    is incorrect. Calls verify placement to ensure that once the syntax is correct,
    the placement is also valid. Then sets the corresponding player's placement.    
*/
function getInfo() {
    const name = document.getElementById("name").value;
    let placement = document.getElementById("placement").value;
    console.log("clicked");
    cleanUpErrors();
    let semicolons = placement.split(';');
    if(semicolons.length != 3) createError("ship_placement", "Incorrect number of entries (must place ; only before new entries)", "invalid_num_entries");
    placement = placement.replaceAll(' ', ''); // remove whitespace
    console.log(placement);

    const par = '\\([A-J](10|[1-9](?!0))\\-[A-J](10|[1-9](?=\\)))\\)';
    const colon = '(\\:[A-J]([1-9]|10)\\-[A-J]([1-9](?!0)|10))';

    const reA = new RegExp('A('+par+'|'+colon+')');
    const reB = new RegExp('B('+par+'|'+colon+')');
    const reS = new RegExp('S('+par+'|'+colon+')');
    let valid = false;

    

    let A = placement.match(reA);
    console.log(A);
    let B = placement.match(reB);
    console.log(B);
    let S = placement.match(reS);
    console.log(S);

    if(A != null) {
        A = A[0];
        valid = verifyPlacement(splitPlacement(A), 5);
        if(!valid) createError("ship_placement", "Invalid values for aircraft", "A_invalid_values");
    }
    else createError("ship_placement", "Incorrect syntax for aircraft", "A_invalid_syntax");

    if(B != null) {
        B = B[0];
        valid = verifyPlacement(splitPlacement(B), 4);
        if(!valid) createError("ship_placement", "Invalid values for battleship", "B_invalid_values");
    }
    else createError("ship_placement", "Incorrect syntax for battleship", "B_invalid_syntax");

    if(S != null) {
        S = S[0];
        valid = verifyPlacement(splitPlacement(S), 3);
        if(!valid) createError("ship_placement", "Invalid values for submarine", "S_invalid_values");
    }
    else createError("ship_placement", "Incorrect syntax for submarine", "S_invalid_syntax");

    let A_range = placementRangeArr(splitPlacement(A));
    let B_range = placementRangeArr(splitPlacement(B));
    let S_range = placementRangeArr(splitPlacement(S));
    const no_overlap = verifyNoOverlap(A_range, B_range, S_range);
    if(A!=null && B!=null && S!=null) {
        if(!no_overlap) createError("ship_placement", "Ships cannot overlap", "overlap_error");
    }

    if(error_array.length == 0) nextPlayer(name, A_range, B_range, S_range);
}

/*  Method to parse the placement input for valid ship placement.
    Ships must be placed in contiguous spaces, within the bounds of the grid,
    and within the length limits of the ship.
    @params:
        placement (String): input of the ship
    @returns:
        boolean: whether the placement is valid or not
*/
function verifyPlacement(placement_arr, size) {
    const L1 = placement_arr[0];
    const L2 = placement_arr[1];
    const N1 = placement_arr[2];
    const N2 = placement_arr[3];    

    if(L1 == L2) {
        if((N2-N1)+1 == size) return true;
    }
    if(N1 == N2) {
        if((L2-L1)+1 == size) return true;
    }
    return false;
}

/* Method to split the letters and numbers of a placement string
    @params:
        placement(String): string describing the ship's placement
    @return:
        Array: new array of the letters and numbers corresponding to the ship's placement
*/
function splitPlacement(placement) {
    console.log(placement)
    const reStart = /\D\d+/;
    const reEnd = /(?<=\-)\D\d+/;
    const reLetter = /\D/;
    const reNumber = /[1-9](?!0)|10/;
    
    const start = placement.match(reStart)[0];
    const end = placement.match(reEnd)[0];
    const L1 = start.match(reLetter)[0].charCodeAt(0);
    const L2 = end.match(reLetter)[0].charCodeAt(0);
    const N1 = parseInt(start.match(reNumber)[0]);
    const N2 = parseInt(end.match(reNumber)[0]);

    return new Array(L1, L2, N1, N2);
}

/* Method to split the letters and numbers of a placement string
    @params:
        placement(String): string describing the ship's placement
    @return:
        Array: new array of the indices of the placement on a 10x10 grid
*/
function placementRangeArr(placement_arr) {
    const L1 = placement_arr[0];
    const L2 = placement_arr[1];
    const N1 = placement_arr[2];
    const N2 = placement_arr[3];
    const placement_range_arr = new Array();

    console.log(placement_arr);
    if(L1 == L2) {
        for(let i=N1; i<=N2; i++) {
            let row = i;
            console.log(`row: ${row}`);
            let col = L1%65;
            console.log(`col: ${col}`);
            let index = (row-1)*10+col;
            console.log(`index: ${index}`);
            placement_range_arr.push(index);
        }
    }
    else {
        for(let i=L1; i<=L2; i++){
            let row = N1;
            console.log(`row: ${row}`);
            let col = i%65;
            console.log(`col: ${col}`);
            let index = (row-1)*10+col;
            console.log(`index: ${index}`);
            placement_range_arr.push(index);
        }
    }

    return placement_range_arr;
}

/*  Method to parse the placement input for valid ship placement.
    Ships must be placed in contiguous spaces, within the bounds of the grid,
    and within the length limits of the ship.
    @params:
        A(Array): array of aircraft's placement details
        B(Array): array of battleship's placement details
        S(Array): array of submarine's placement details
    @returns:
        boolean: false if the ships overlap
*/
function verifyNoOverlap(A, B, S) {
    for(let i = 0; i < A.length; i++) {
        for(let j = 0; j < B.length; j++) if(B[j] == A[i]) return false;
        for(let k = 0; k < S.length; k++) if(S[k] == A[i]) return false;
    }
    for(let j = 0; j < B.length; j++) {
        for(let k = 0; k < S.length; k++) if(S[k] == B[j]) return false;
    }
    return true;
}

/* Method to upload player's info and move on to the next step. If a player doesn't exist yet, we
   are grabbing the first player's info then moving to the next. Otherwise, if a second player does not
   exist we create a new one and move onto gameplay.
    @params:
        name(String): name of the new player
        A_range(String): placement of aircraft
        B_range(String): placement of battleship
        S_range(String): placement of submarine
*/
function nextPlayer(name, A_range, B_range, S_range) {
    if(players.length == 0) {
        let player_1 = new Player(name, A_range, B_range, S_range);
        players.push(player_1);
        const new_name = document.getElementById("name");
        new_name.value = "";
        
        const new_placement = document.getElementById("placement");
        new_placement.value = "";

        document.getElementById("header2").textContent = "Enter Player 2";
        return;
    }

    else if(players.length == 1) {
        let player_2 = new Player(name, A_range, B_range, S_range);
        players.push(player_2);
        cur = players[1];
        opp = players[0];
    }


    if(cur == players[0]) {
        cur = players[1];
        opp = players[0];
    }
    else {
        cur = players[0];
        opp = players[1];
    }

    document.body.textContent = "";
    const form = document.createElement("form");
    form.id = "continue";
    const p = document.createElement("p");
    p.textContent = `Click OK to begin ${cur.name}'s turn`;
    form.appendChild(p);
    const new_div = document.createElement("div");
    const submit_button = document.createElement("input");
    submit_button.setAttribute("type", "submit");
    submit_button.setAttribute("class", "form");
    submit_button.id = "submit";
    submit_button.value = "OK";
    submit_button.addEventListener("click", nextTurn);

    new_div.appendChild(document.createElement("br"));
    new_div.appendChild(submit_button);
    form.appendChild(new_div);
    bod.appendChild(form);
}

function checkForSink(ship) {
    let sunk = true;
    switch(ship) {
        case 0:
            for(let s of opp.aircraft) {
                if(!opp.spaces[s].fired_at) {
                    sunk = false;
                    break;
                }
            }
            if(sunk) {
                opp.sunk[0] = true;
                createError("bod", "You successfully sunk your opponent's aircraft!", "aircraft_sunk");
                
            }
            break;
        case 1:
            for(let s of opp.battleship) {
                if(!opp.spaces[s].fired_at) {
                    sunk = false;
                    break;
                }
            }
            if(sunk) {
                opp.sunk[1] = true;
                createError("bod", "You successfully sunk your opponent's battleship!", "battleship_sunk");
                break;
            }
            break;
        case 2:
            for(let s of opp.submarine) {
                if(!opp.spaces[s].fired_at) {
                    sunk = false;
                    break;
                }
            }
            if(sunk) {
                opp.sunk[2] = true;
                createError("bod", "You successfully sunk your opponent's submarine!", "submarine_sunk");
            }
            break;
    }
    
    let winb = true;
    for(let sunk of opp.sunk) if(!sunk) winb = false;
    if(winb) win();
}

function fire(i) {
    opp.spaces[i].fired_at = true;

    if(opp.aircraft.includes(i)) {
        cur.spaces[i].hit = true;
        opp.score = opp.score - 2;
        const grid_spot = document.getElementById(i);
        grid_spot.className = "grid_hit";
        checkForSink(0);
    }
    else if(opp.battleship.includes(i)) {
        cur.spaces[i].hit = true;
        opp.score = opp.score - 2;
        const grid_spot = document.getElementById(i);
        grid_spot.className = "grid_hit";
        checkForSink(1);
    }
    else if(opp.submarine.includes(i)) {
        cur.spaces[i].hit = true;
        opp.score = opp.score - 2;
        const grid_spot = document.getElementById(i);
        grid_spot.className = "grid_hit";
        checkForSink(2);
    }
    else {
        cur.spaces[i].miss = true;
        const grid_spot = document.getElementById(i);
        grid_spot.className = "grid_miss";
    }
    const grid_ol = document.createElement("div");
    grid_ol.setAttribute("class", "board");
    grid_ol.id = "ol";
    for(let j=0; j<100; j++) {
        const spot = document.createElement("div");
        spot.setAttribute("class", "ol_space");
        if(j == i) {
            spot.id = "hit";
            if(cur.spaces[i].hit) spot.textContent = "X";
            else spot.textContent = "O";
        }
        grid_ol.appendChild(spot);
    }
    document.getElementById("grids").appendChild(grid_ol);

    const form = document.createElement("form");
    form.id = "continue";
    const p = document.createElement("p");
    p.textContent = `Click OK to begin ${opp.name}'s turn`;
    form.appendChild(p);
    const new_div = document.createElement("div");
    const submit_button = document.createElement("input");
    submit_button.setAttribute("type", "submit");
    submit_button.setAttribute("class", "form");
    submit_button.id = "submit";
    submit_button.value = "OK";
    submit_button.addEventListener("click", nextPlayer);

    new_div.appendChild(document.createElement("br"));
    new_div.appendChild(submit_button);
    form.appendChild(new_div);
    bod.appendChild(form);
}

/* Method to present errors to the user.
    @params:
        id(String): id of the element to place error in
        text(String): text to place in the error message
        new_id(String): id of the new error element created
*/
function createError(id, text, new_id) {
    const error_message = document.createElement("p");
    error_message.style = "color:#FF0000";
    error_message.textContent = text;
    error_message.id = new_id;
    error_array.push(new_id);
    document.getElementById(id).appendChild(error_message);
}

/* Method to clean up errors upon a new submission*/
function cleanUpErrors() {
    for(const id of error_array) {
        document.getElementById(id).remove();
    }
    error_array = new Array();
}

function setup() {
    document.getElementById("submit").addEventListener("click", getInfo);
}

function nextTurn() {
    document.body.textContent = "";
    console.log(`cur: ${cur.toString()}`);
    console.log(`opp: ${opp.toString()}`);

    const header = document.createElement("h1");
    header.textContent = `${cur.name}'s Turn`;
    const header2 = document.createElement("h2");
    header2.textContent = `Tap a square on the opponent's grid to fire.`;
    const grids = document.createElement("div");
    grids.id = "grids";

    const letters = document.createElement("div");
    letters.id = "l1";
    for(let i=65; i<75; i++) {
        const letter = document.createElement("div");
        letter.textContent = String.fromCharCode(i);
        letters.appendChild(letter);
    }

    const nums = document.createElement("div");
    nums.id = "n1";
    for(let i=1; i<11; i++) {
        const num = document.createElement("div");
        num.textContent = i;
        nums.appendChild(num);
    }

    grids.appendChild(letters);
    grids.appendChild(nums);
    grids.appendChild(generatePlayersGrid(cur));
    
    const letters2 = letters.cloneNode(true);
    letters2.id = "l2";
    const nums2 = nums.cloneNode(true);
    nums2.id = "n2";
    grids.appendChild(letters2);
    grids.appendChild(nums2);
    grids.appendChild(generateOpponentsGrid(cur));
    const pgrid = document.createElement("div");
    pgrid.textContent = "Player's Grid";
    pgrid.id = "pgrid";
    const ogrid = document.createElement("div");
    ogrid.textContent = "Opponent's Grid";
    ogrid.id = "ogrid";
    grids.appendChild(pgrid);
    grids.appendChild(ogrid);

    document.body.appendChild(header);
    document.body.appendChild(header2);
    document.body.appendChild(grids);
}

function generatePlayersGrid() {
    const grid = document.createElement("div");
    grid.setAttribute("class", "board");
    grid.id = "p";
    for(let i=0; i<100; i++) {
        const spot = document.createElement("div");
        spot.textContent = cur.spaces[i].ship;
        if(opp.spaces[i].hit) spot.setAttribute("class", "grid_hit");
        else if(opp.spaces[i].miss) spot.setAttribute("class", "grid_miss");
        else spot.setAttribute("class", "grid_space");
        grid.appendChild(spot);
    }
    return grid;
}

function generateOpponentsGrid() {
    const grid = document.createElement("div");
    grid.setAttribute("class", "board");
    grid.id = 'o';
    for(let i=0; i<100; i++) {
        const spot = document.createElement("div");
        spot.id = i;
        spot.setAttribute("class", "grid_space");
        if(cur.spaces[i].hit) spot.setAttribute("class", "grid_hit");
        else if(cur.spaces[i].miss) spot.setAttribute("class", "grid_miss");
        else spot.addEventListener("click", function() {fire(i);});
        grid.appendChild(spot);
    }
    return grid;
}

function updateScore() {
    let min = 24;
    let minkey = "";
    if(localStorage.length < 10) localStorage.setItem(cur.name, cur.score);
    else {
        for(let i=0; i<10; i++) {
            console.log(`min: ${min}`);
            let stored = localStorage.key(i);
            console.log(`stored: ${stored}`);
            console.log(`stored val: ${localStorage.getItem(stored)}`);
            let val = parseInt(localStorage.getItem(stored));
            if(min > val) {
                console.log('changing min');
                min = val;
                minkey = stored;
            }
        }

        if(min <= cur.score) {
            if(localStorage.getItem(cur.name) != null && localStorage.getItem(cur.name) < cur.score) localStorage.setItem(cur.name, cur.score);
            else if(localStorage.getItem(cur.name) == null) {
                localStorage.removeItem(minkey);
                localStorage.setItem(cur.name, cur.score);
            }
        }
    }
}

function win() {
    updateScore();
    document.body.textContent = "";
    const header = document.createElement("h1");
    header.id = "winner";
    header.textContent = `Congratulations ${cur.name}! You Won!`;
    const header3 = document.createElement("h3");
    header3.textContent = `Refresh browser to play again.`;
    document.body.appendChild(header);
    document.body.appendChild(header3);
}

window.addEventListener("load", setup);