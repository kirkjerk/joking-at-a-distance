<?php
require "utils.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];
$winner = $POSTJSON['winner'];
            
// $gamename = "ZLON";
// $winner = "safari"; 
// $game = debugLoadGame($gamename);
// $res = updateRegJudgeFinal($game);
// echo JSON_encode($res);

if(! isAvailableGame($gamename)){
    exit;
}

function updateRegJudgeFinal($game){
    global $winner;
    $currentround = sizeof($game["rounds"]) - 1;
    $game["rounds"][$currentround]["winner"] = $winner;

    $nextjudgenum = $game["currentjudgenum"] + 1;

    #start round should honor "skip"...
    if($nextjudgenum >= sizeof($game["players"])  ){
        $nextjudgenum = 0;
    }

    $game["rounds"][$currentround]["nextjudge"] = $game["players"][$nextjudgenum]["username"];
    $game["state"] = "REG_END_ROUND";
    return $game;
}
 echo updateGame($gamename, "updateRegJudgeFinal");

?>

