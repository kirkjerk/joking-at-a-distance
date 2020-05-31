<?php
require "utils.php";
require "gameHelper.php";

$POSTJSON = getJsonPOST();
$gamename = $POSTJSON['gamename'];

$judgepick = $POSTJSON['judgepick'];
$judgepos = $POSTJSON['judgepos'];
            
// $gamename = "NMTN";
// $judgepick = "77"; 
// $judgepos = "before";
// $game = debugLoadGame($gamename);
// $res = updateRegJudgeCard($game);
// print json_encode($res);
// exit;


if(! isAvailableGame($gamename)){
    exit;
}




function updateRegJudgeCard($game){
    global $judgepick;
    global $judgepos;
    $currentround = sizeof($game["rounds"]) - 1;
    $game["rounds"][$currentround]["judgepick"] = $judgepick;
    $game["rounds"][$currentround]["judgepos"] = $judgepos;

    $judgename = $game["rounds"][$currentround]["currentjudge"]; 

    $game = redrawPlayerCardFromDeck($game,$judgename,$judgepick);

    $game["state"] = "REG_PLAYERS_PICK";
    return $game;
}
echo updateGame($gamename, "updateRegJudgeCard");

?>

