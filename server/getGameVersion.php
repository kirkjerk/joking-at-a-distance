<?php
require "utils.php";


$gamename = $_GET['gamename'];

if(! isAvailableGame($gamename)){
    print "{\"msg\":\"cant find $gamename\"}";
    exit;
}

$game =  json_decode(file_get_contents("games/$gamename.json"),"true");
$res = array();
$res["version"] = $game["version"];
echo json_encode(json_encode($res));

?>