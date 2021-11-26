<?php
require "utils.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];
$username = $POSTJSON['username'];


if(! isAvailableGame($gamename)){
    exit;
}



function addInPlayer($game){

    global $username;
    $player = array();
    $pattern = '/[^0-9a-z ]/i';
    preg_replace($pattern, '', $username);

    $player["username"] = $username;

    foreach($game["players"] as $oldplayer){
        if($oldplayer["username"] == $username){
            return $game;
        }
    }
    $deck = $game["deck"];
    $cards = array();
    for($i = 0; $i < 7; $i++) {
        array_push($cards, array_pop($deck));
    }
    $player["cards"] = $cards;

    array_push($game["players"],$player);
    $game["deck"] = $deck;
    return $game;
}
echo updateGame($gamename, "addInPlayer");

?>

