<?php
require "utils.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];
$username = $POSTJSON['username'];
            
// $gamename = "8440";
// $username = "chrome";
// $game = debugLoadGame($gamename);
// $res = removePlayerAndUpdateRound($game);
// echo JSON_encode($res);
// exit;


if(! isAvailableGame($gamename)){
    exit;
}

#   this is the biggest pain in the butt endpoint to code,
#   since a leaving player can modify any game state,
#   and it's very different if the person is a judge or not

function removePlayerAndUpdateRound($game){
    global $username;
    $game["players"] = arrayMinusUsernameMatch($game["players"],$username);
    
    if($game["state"] == "GAME_SIGNUP"){
        if($game["creatorname"] == $username) {
            if(count($game["players"] > 0)){
                $game["creatorname"] = $game["players"][0]["username"];
            } else {
                $game["creatorname"] = "BAILED! NO GAME";
            }
        }
    } else {
        $game = startRound($game, "Started a new round because <span class='username'>$username</span> left!");
    }



    return $game;
}

function usernameIsCurrentJudge($game, $username){
    $roundcount = count($game["rounds"]);
    if($roundcount > 0) {
        $currentround = $game["rounds"][$roundcount - 1];
        if($currentround["currentjudge"] == $username) {
            return true;
        }
    }
    return false;
}


function arrayMinusUsernameMatch($arr,$who){
    $newarr = array();
    foreach($arr as $player){
        if($player["username"] != $who) {
            array_push($newarr,$player);
        }
    }
    return $newarr;
}

echo updateGame($gamename, "removePlayerAndUpdateRound");

?>

