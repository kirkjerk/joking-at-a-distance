<?php
require "utils.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];
$username = $POSTJSON['username'];
$pick1 = $POSTJSON['pick1'];
$pick2 = $POSTJSON['pick2'];

//  $gamename = "NZDX";
//  $username = "chrome";
//  $pick1 = "73";
//  $pick2 = "73";

// $game = debugLoadGame($gamename);
// $res = updateRedPlayerCard($game);
// print json_encode($res);
// exit;


if(! isAvailableGame($gamename)){
    exit;
}

function updateRedPlayerCard($game){
    global $username;
    global $pick1;
    global $pick2;
    $currentround = sizeof($game["rounds"]) - 1;
    if(! array_key_exists("playerpicks",$game["rounds"][$currentround])){
        $game["rounds"][$currentround]["playerpicks"] = array();
    }
    $game["rounds"][$currentround]["playerpicks"]["$username"] = array($pick1,$pick2);

    $game = redrawPlayerCardFromDeck($game,$username,$pick1);
    $game = redrawPlayerCardFromDeck($game,$username,$pick2);

    $playersnotjudgecount = sizeof($game["players"]) - 1;
    $playerspickedcount = sizeof($game["rounds"][$currentround]["playerpicks"]);

    if($playersnotjudgecount == $playerspickedcount){
        $game["rounds"][$currentround]["playerpicks"] = shuffle_assoc_array($game["rounds"][$currentround]["playerpicks"]);
        $game["state"] = "RED_JUDGE_PICK";
    }
    return $game;
}

echo updateGame($gamename, "updateRedPlayerCard");

?>

