"use strict";

let error_array = new Array();
let players = new Array();
let cur;

/*  Player class to keep track of player's data
    @params:
        name (String): name of the player
        aircraft (String): placement of the aircraft
        battleship (String): placement of the battleship
        submarine (String): placement of the submarine
        score (int): current score
*/
function Player(name, aircraft, battleship, submarine) {
    this.name = name;
    this.aircraft = aircraft;
    this.battleship = battleship;
    this.submarine = submarine;
    this.score = 0;
    this.hits = new Array();
}

/*  Method to parse the placement input for valid ship placement syntax
    Uses regex to parse for each ship's placement. Requires re-entry if syntax
    is incorrect. Calls verify placement to ensure that once the syntax is correct,
    the placement is also valid. Then sets the corresponding player's placement.    
*/
function getInfo(name, placement) {
    console.log("clicked");
    cleanUpErrors();
    let semicolons = placement.split(';');
    if(semicolons.length != 3) createError("ship_placement", "Incorrect number of entries (must place ; only before new entries)", "invalid_num_entries");
    placement = placement.replaceAll(' ', ''); // remove whitespace
    console.log(placement);

    const reA = /A((\([A-J]([1-9]|10)\-[A-J]([1-9]|10)\))|(\:[A-J]([1-9]|10)\-[A-J]([1-9]|10)))/;
    const reB = /B((\([A-J]([1-9]|10)\-[A-J]([1-9]|10)\))|(\:[A-J]([1-9]|10)\-[A-J]([1-9]|10)))/;
    const reS = /S((\([A-J]([1-9]|10)\-[A-J]([1-9]|10)\))|(\:[A-J]([1-9]|10)\-[A-J]([1-9]|10)))/;
    let valid = false;

    let A = placement.match(reA);
    let B = placement.match(reB);
    let S = placement.match(reS);

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

    console.log(error_array);
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
    const reStart = /\D\d/;
    const reEnd = /(?<=(\-\s*))\D\d/;
    const reLetter = /\D/;
    const reNumber = /[1-9]|10/;
    
    const start = placement.match(reStart)[0];
    const end = placement.match(reEnd)[0];
    const L1 = start.match(reLetter)[0].charCodeAt(0);
    const L2 = end.match(reLetter)[0].charCodeAt(0);
    const N1 = parseInt(start.match(reNumber)[0]);
    const N2 = parseInt(end.match(reNumber)[0]);
    
    console.log(`L1: ${L1}, L2: ${L2}, N1: ${N1}, N2: ${N2}`);

    return new Array(L1, L2, N1, N2);
}

/* Method to split the letters and numbers of a placement string
    @params:
        placement(String): string describing the ship's placement
    @return:
        Array: new array of the letters and numbers corresponding to the ship's placement
*/
function placementRangeArr(placement_arr) {
    const L1 = placement_arr[0];
    const L2 = placement_arr[1];
    const N1 = placement_arr[2];
    const N2 = placement_arr[3];
    const placement_range_arr = new Array();

    if(L1 == L2) {
        for(var i=N1; i<=N2; i++) {
            let input = String.fromCharCode(L1)+i;
            console.log(`input: ${input}`);
            placement_range_arr.push(input);
        }
    }
    else {
        for(var i=L1; i<=L2; i++) placement_range_arr.push(String.fromCharCode(i)+N1);
    }

    console.log(placement_range_arr);

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
    for(var i = 0; i < A.length; i++) {
        for(var j = 0; j < B.length; j++) if(B[j] == A[i]) return false;
        for(var k = 0; k < S.length; k++) if(S[k] == A[i]) return false;
    }
    for(var j = 0; j < B.length; j++) {
        for(var k = 0; k < S.length; k++) if(S[k] == B[j]) return false;
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
        const new_name = document.getElementById("name1");
        new_name.id = "name2";
        new_name.value = "";
        
        const new_placement = document.getElementById("placement1");
        new_placement.id = "placement2";
        new_placement.value = "";

        document.getElementById("header2").textContent = "Enter Player 2";
        document.getElementById("submit").removeEventListener("click", getInfo1);
        document.getElementById("submit").addEventListener("click", getInfo2);
        return;
    }

    else if(players.length == 1) {
        let player_2 = new Player(name, A_range, B_range, S_range);
        players.push(player_2);
        cur = player[0];
    }

    const bod = document.createElement("body");
    document.body = bod;
    const new_form = document.createElement("form");
    new_form.id = "continue";
    new_form.textContent = `Click OK to begin ${cur.name}'s turn`;
    const new_div = document.createElement("div");
    const new_sub = document.createElement("input");
    new_sub.type = "submit";
    new_sub.id = "submit";
    new_sub.value = "OK";
    new_sub.addEventListener("click", nextTurn);

    new_div.appendChild(document.createElement("br"));
    new_div.appendChild(new_sub);
    new_form.appendChild(new_div);
    bod.appendChild(new_form);
    if(cur == player[0]) cur = player[1];
    else cur = player[0];
}

function nextTurn() {
    const bod = document.createElement("body");
    document.body = bod;

    const header = document.createElement("h1");
    header.textContent = `${cur}'s Turn`;
    bod.appendChild(header);

}

function generatePlayersGrid() {
    const grid = document.createElement("div");
    grid.id = "player_grid";
    for(i=1; i<=10; i++) { // rows
        for(j=65; j<=74; j++) { // cols
            let ship = "";
            let hit_b = false;
            const grid_space = document.createElement()
            for(space of cur.aircraft) {
                let cur_space = "" + i + String.fromCharCode(j);
                if(space == cur_space){
                    ship = "A";
                    for(hit of hits) {
                        if(hit[0] == i && hit[1] == j) {
                            hit_b = true;
                            return;
                        }
                    }
                    break;
                }
            }
            if(ship == "") {
                for(space of cur.battleship) {
                    let cur_space = "" + i + String.fromCharCode(j);
                    if(space == cur_space){
                        ship = "B";
                        for(hit of hits) {
                            if(hit[0] == i && hit[1] == j) {
                                hit_b = true;
                                return;
                            }
                        }
                        break;
                    }
                }
            }
            if(ship == "") {
                for(space of cur.submarine) {
                    let cur_space = "" + i + String.fromCharCode(j);
                    if(space == cur_space){
                        ship = "S";
                        for(hit of hits) {
                            if(hit[0] == i && hit[1] == j) {
                                hit_b = true;
                                return;
                            }
                        }
                        break;
                    }
                }
            }
            hit_div.textContent = ship;
            grid.appendChild(hit_div);
        }
    }
}

// function generatePlayersGrid() {
//     const grid = document.createElement("div");
//     grid.id = "player_grid";
//     for(i=1; i<=10; i++) { // rows
//         for(j=65; j<=74; j++) { // cols
//             for(hit of hits) {
//                 if(hit[0] == i && hit[1] == j) {
//                     const hit_div = document.createElement("div");
//                     hit_div.class = "hit";
//                     let ship = "";
//                     for(space of cur.aircraft) {
//                         let cur_space = "" + i + String.fromCharCode(j);
//                         if(space == cur_space){
//                             ship = "A";
//                             break;
//                         }
//                     }
//                     if(ship == "") {
//                         for(space of cur.battleship) {
//                             let cur_space = "" + i + String.fromCharCode(j);
//                             if(space == cur_space){
//                                 ship = "B";
//                                 break;
//                             }
//                         }
//                     }
//                     if(ship == "") {
//                         for(space of cur.submarine) {
//                             let cur_space = "" + i + String.fromCharCode(j);
//                             if(space == cur_space){
//                                 ship = "S";
//                                 break;
//                             }
//                         }
//                     }
//                     hit_div.textContent = ship;
//                     grid.appendChild(hit_div);
//                 }

//                 else {
                    
//                 }
//             }
//         }
//     }
// }

/* Method to present errors to the user.
    @params:
        id(String): id of the element to place error in
        text(String): text to place in the error message
        new_id(String): id of the new error element created
*/
function createError(id, text, new_id) {
    console.log("error");
    const error_message = document.createElement("p");
    error_message.style = "color:#FF0000";
    error_message.textContent = text;
    error_message.id = new_id;
    error_array.push(new_id);
    document.getElementById(id).appendChild(error_message);
}

/* Method to clean up errors upon a new submission*/
function cleanUpErrors(id) {
    for(id of error_array) {
        document.getElementById(id).remove();
    }
    error_array = new Array();
}

function setup() {
    document.getElementById("submit").addEventListener("click", getInfo1);
}

/* Method to call proper id's when grabbing first player's info */
function getInfo1() {
    const name = document.getElementById("name1").value;
    let placement = document.getElementById("placement1").value;
    getInfo(name, placement);
}

/* Method to call proper id's when grabbing second player's info */
function getInfo2() {
    const name = document.getElementById("name2").value;
    let placement = document.getElementById("placement2").value;
    getInfo(name, placement);
}

window.addEventListener("load", setup);