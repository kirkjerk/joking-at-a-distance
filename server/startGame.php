<?php
require "utils.php";
require "gameHelper.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];
$username = $POSTJSON['username'];

// $gamename = "SZJJ";
// $username = "chrome";
// $game = debugLoadGame($gamename);
// $res = startGameIfCreator($game);
// echo JSON_encode($res);
// exit;


if(! isAvailableGame($gamename)){
    exit;
}

function startGameIfCreator($game){
    global $username;

    if($game["state"] == "GAME_SIGNUP" && $game["creatorname"] == $username) {
        $game["state"] = "NEW_ROUND";
        
        $game = startRound($game);
    }
    return $game;
}
echo updateGame($gamename, "startGameIfCreator");

?>

