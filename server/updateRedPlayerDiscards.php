<?php
require "utils.php";
require "gameHelper.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];
$username = $POSTJSON['username'];
$discards = $POSTJSON['discards'];

//  $gamename = "NZDX";
//  $username = "chrome";
//  $pick = "73";

// $game = debugLoadGame($gamename);
// $res = updateRedPlayerDiscards($game);
// print json_encode($res);
// exit;


if(! isAvailableGame($gamename)){
    exit;
}

function updateRedPlayerDiscards($game){
    global $username;
    global $discards;
    $currentround = sizeof($game["rounds"]) - 1;
    
    // make sure playerdiscarded set exists for round, then push username in if not there already....
    if(! array_key_exists("playerdiscarded",$game["rounds"][$currentround])){
        $game["rounds"][$currentround]["playerdiscarded"] = array();
    }
    if(!in_array($username, $game["rounds"][$currentround]["playerdiscarded"])) {
        array_push($game["rounds"][$currentround]["playerdiscarded"],$username);
    }

    $playerscount = sizeof($game["players"]);
    $playersdiscardedcount = sizeof($game["rounds"][$currentround]["playerdiscarded"]);

    foreach($discards as $discard) {
        $game = redrawPlayerCardFromDeck($game,$username,$discard);
    }

     if($playerscount == $playersdiscardedcount){
         $game["rounds"][$currentround]["playerpicks"] = shuffle_assoc_array($game["rounds"][$currentround]["playerpicks"]);
         $game["state"] = "RED_ROUND";
     }

    return $game;
}

echo updateGame($gamename, "updateRedPlayerDiscards");

?>

