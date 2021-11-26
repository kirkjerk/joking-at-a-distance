<?php



$TOP_RED_CARD = 38; //cards 1-38 are red border!
$DECKSIZE = 350; 



// echo json_encode(startRound(debugLoadGame("3753")));


function startRound($game, $msg="") {
    global $DECKSIZE;
    global $TOP_RED_CARD;
    $round = array();

    
    #do a reshuffle if we have less than ten players per deck... 
    $playercount = sizeof($game["players"]);
    if(sizeof($game["deck"]) < ($playercount * 10)){
        #all cards but those currently in players' hands
        $cardsinhands = array();
        foreach($game["players"] as $player){
            $cardsinhands = array_merge($cardsinhands,$player["cards"]);
        }
        #remake entire deck, but take out the ones in players hands...
        $deck = array();
        for($i = 1; $i <= $DECKSIZE; $i++){
           array_push($deck,$i);
        }
        $deck = array_values(array_diff( $deck,$cardsinhands ));
        shuffle($deck);
        $game["deck"] = $deck;
    }

    
    
    // if (($key = array_search(70, $smallarray)) !== false) {
    //     unset($smallarray[$key]);
    // }
    

    $round["deckpick"] = array_pop($game["deck"]);
    
    //TODO: remove
    // $round["deckpick"] = 1;

    $currentjudgenum = $game["currentjudgenum"];
    $currentjudgenum++;

    #start round should honor "skip"...
    if($currentjudgenum >= sizeof($game["players"])  ){
        $currentjudgenum = 0;
    }
    $game["currentjudgenum"] = $currentjudgenum;

    $round["currentjudge"] = $game["players"][$currentjudgenum]["username"];
    
    $round["playerpicks"] = array();

    $isRedRound = ($round["deckpick"] <= $TOP_RED_CARD);

    if($isRedRound) {
        $round["isred"] = true;
    } 
    if($msg && $msg != "") {
        $round["msg"] = $msg;
    }

    array_push($game["rounds"],$round);


    if(! $isRedRound) {
        $game["state"] = "REG_ROUND";
    } else {
        $game["state"] = "RED_REDRAWS";
    }

    $game["msg"] = $round["deckpick"]. " vs ".$TOP_RED_CARD. " state is ".$game["state"];

    return $game;
}

function findPlayerOffsetByUsername($game, $username){
    foreach($game["players"] as $i => $user) {
        if($user["username"] == $username) return $i;
    }
    return -1;
}

function redrawPlayerCardFromDeck($game,$username,$discard){
    $playerpos = findPlayerOffsetByUsername($game,$username);
    if (($index = array_search($discard, $game["players"][$playerpos]["cards"])) !== false) {
        unset($game["players"][$playerpos]["cards"][$index]);
    }
   array_push($game["players"][$playerpos]["cards"],array_pop($game["deck"]));
   $game["players"][$playerpos]["cards"] = array_values($game["players"][$playerpos]["cards"]);
   return $game;
}


function isLegalGameName($gamename){
return preg_match('/^\d*$/',$gamename);
}
function isAvailableGame($gamename){
    return isLegalGameName($gamename) && file_exists("games/$gamename.json");
}

function debugLoadGame($gamename) {
    $filename = "games/$gamename.json";
    return json_decode(file_get_contents($filename),true);
}

function updateGame($gamename, $function){
    if(! isLegalGameName($gamename)) {
        echo "shenanigans!";
        return;
    }
    $filename = "games/$gamename.json";
    //Open the File Stream
    $handle = fopen($filename,"r+");
    //Lock File, error if unable to lock
    if(flock($handle, LOCK_EX)) {

        $oldgutsraw = fread($handle, filesize($filename));

        $oldguts = json_decode($oldgutsraw,true); //get current state

        $version = isset($oldguts["version"]) ? $oldguts["version"] : 1;
        $version++;
        $oldguts["version"] = $version;
        $newguts = json_encode(call_user_func($function,$oldguts)); //update state

        ftruncate($handle, 0);    //Truncate the file to 0
        rewind($handle);           //Set write pointer to beginning of file
        fwrite($handle, $newguts);    //Write the new Hit Count
        flock($handle, LOCK_UN);    //Unlock File
} else {
    echo "Could not Lock File!";
}
//Close Stream
fclose($handle);    
return $newguts;
}


function getJsonPOST() {
    return json_decode(file_get_contents('php://input'),true);
}



function shuffle_assoc_array($orig) {
    $shuffled = array();
    $keys = array_keys($orig);
    shuffle($keys);
    foreach ($keys as $key) {
	    $shuffled[$key] = $orig[$key];
    }
    return $shuffled;
}


// cheap and cheerful log function added during work in 2021
function filelog($msg){
    $current = file_get_contents("log.txt");
    $current .= "$msg\n";
    $current = file_put_contents("log.txt",$current);
}

?>