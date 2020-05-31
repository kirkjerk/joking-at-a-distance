<?php
require "utils.php";


$gamename = $_GET['gamename'];

if(! isAvailableGame($gamename)){
    print "{\"msg\":\"cant find $gamename\"}";
    exit;
}

echo json_encode(file_get_contents("games/$gamename.json"));

?>

