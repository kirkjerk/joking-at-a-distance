<?php
require "utils.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];


if(! isAvailableGame($gamename)){
    exit;
}

function startNextRound($game){
    global $username;

    $game = startRound($game);

    return $game;
}
echo updateGame($gamename, "startNextRound");

?>

