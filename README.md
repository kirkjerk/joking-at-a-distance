# Joking Hazard at a Distance

This is an online version of the card game "Joking Hazard"
(Suitable for Quarantine Times!)

The client is a browser-based SPA.

The server is a set of PHP files acting as endpoints.

Each game is represented as .json file in server/games

Clients poll for changes and udpate the copy of the shared state when it changes.

A version of the game is set up for play at
[kirk.is/joking](https://kirk.is/joking/)

## Startup

Copy the files to a directory on a PHP server.

For development purposes, you may wish to set up automatic syncing:

```
alias joking_rsync='rsync -azP --exclude "._/" --exclude "._" --exclude "tmp/" LOCALPATH/joking-at-a-distance/\* USER@SERVER:/REMOTEPATH/joking'
alias joking_rsync_watch='cd LOCALPATH/joking-at-a-distance; joking_rsync; fswatch -o . | while read f; do joking_rsync; done'
```

##TODO:

-   better interactions / response for every click, don't wait
-   maybe: make a "skip flag" to let a player bow out

###Crude notes of TODOs from playtest:

-   time out... or skip
-   quit should remove person from play - or could be perma skip
-   Show a win condition
-   consider drag and drop?
-   has pointer finger for cards even when not clickable
-   Waiting for list : put bullets between names so it's clear
-   (No I love all these cards) button looks bad on iOS - takes two lines
-   Red Card - Waiting for Other Players Doesn't list who hasn't played
-   score at top?
-   red review: show Someone Else's caption at top
-   maybe review the cards from the last round while waiting for judge to pick

###from JON:

-   undo card selection?
-   show score?
-   show if people are waiting on you while you're picking
-   fillable text box for blank cards?
-   end condition: # of rounds, or first to X points
-   vote to boot if someone's taking too long
-   allow people to drop out
-   maybe a counter of how many times you've gone around?
-   show previous round below winner/deck card
-   Red panel pick says waiting for other players, but doesn't say who

##Design Notes

Each player's browser has a single page app. Game model is stored as a JSON object on the server
and updated by a series of PHP endpoints that modify it and return the current model.
Each client rerenders itself (though just in vanila ECMAscript) according to that model.
Local Storage is used to record username and current game, and there's a local-state-only
concept used for some transient settings. This setup lets reloads fully restore the interface.

It's basically a state machine - game state is one of the following:

-   GAME_SIGNUP - waiting for players to join, first player starts
-   REG_ROUND - normal round, waiting for judge to pick 1st or second panel
-   REG_PLAYERS_PICK - wait for each non-judge player to pick a 3rd panel
-   REG_JUDGE_PICK - wait for judge to select round winner
-   REG_END_ROUND - results displayed, wait for next judge to start
-   RED_REDRAWS - if computer picked a red card, wait for all players to discard from their hand
-   RED_ROUND - waiting for non-judge players to pick other 2 cards
-   RED_JUDGE_PICK - waiting for judge to select round winner
-   RED_END_ROUND - results displayed, wait for next judge to start

There's admittedly not a lot of security built in to the system, no checking is done that a person
is who they say they are. But honestly, why are you playing with that kind of person anyway?

Many of the PHP endpoints consist of a single function that takes in the game model,
manipulates it, and returns it. Most have some commented out code to make it
relatively easy to do a command line run - putting player and game identifier in
and calling debugLoadGame() and replaying the game model transformation without saving it.
