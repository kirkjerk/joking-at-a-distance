
<?php

    require "utils.php";

    $POSTJSON = getJsonPOST();
    $who = $POSTJSON['creatorname'];


    $numplaces = 4;

    do {
        $name = randomName($numplaces);
        $numplaces++;
    } while(file_exists("games/$name.json") );
    
    
     
     $deck = array();
     for($i = 1; $i <= $DECKSIZE; $i++){
        array_push($deck,$i);
     }
     shuffle($deck);
        
    $game = array();
    $game["gamename"] = $name ;
    $game["deck"] = $deck;
    $game["creatorname"] = $who;
    $game["players"] = array();
    $game["state"] = "GAME_SIGNUP";
    $game["rounds"] = array();
    $game["currentjudgenum"] = -1;
    

    $gameJson = json_encode($game);
    file_put_contents("games/$name.json",$gameJson);
    echo $gameJson;

    function randomName($numplaces){
        return rand(
            str_repeat("1", $numplaces),
            str_repeat("9", $numplaces)
        );
    }

?>