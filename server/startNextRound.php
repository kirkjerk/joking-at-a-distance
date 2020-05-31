<?php
require "utils.php";
require "gameHelper.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];


if(! isAvailableGame($gamename)){
    exit;
}

function startNextRound($game){
    global $username;

    $game["state"] = "NEW_ROUND";
        
    $game = startRound($game);

    return $game;
}
echo updateGame($gamename, "startNextRound");

?>

