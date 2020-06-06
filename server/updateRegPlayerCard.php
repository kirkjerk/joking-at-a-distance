<?php
require "utils.php";


$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];
$username = $POSTJSON['username'];
$pick = $POSTJSON['pick'];

//  $gamename = "NZDX";
//  $username = "chrome";
//  $pick = "73";

// $game = debugLoadGame($gamename);
// $res = updateRegPlayerCard($game);
// print json_encode($res);
// exit;


if(! isAvailableGame($gamename)){
    exit;
}

function updateRegPlayerCard($game){
    global $username;
    global $pick;
    $currentround = sizeof($game["rounds"]) - 1;
    if(! array_key_exists("playerpicks",$game["rounds"][$currentround])){
        $game["rounds"][$currentround]["playerpicks"] = array();
    }
    $game["rounds"][$currentround]["playerpicks"]["$username"] = $pick;

    $game = redrawPlayerCardFromDeck($game,$username,$pick);

    $playersnotjudgecount = sizeof($game["players"]) - 1;
    $playerspickedcount = sizeof($game["rounds"][$currentround]["playerpicks"]);

    if($playersnotjudgecount == $playerspickedcount){
        $game["rounds"][$currentround]["playerpicks"] = shuffle_assoc_array($game["rounds"][$currentround]["playerpicks"]);
        $game["state"] = "REG_JUDGE_PICK";
    }
    return $game;
}

echo updateGame($gamename, "updateRegPlayerCard");

?>

