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

-   about page/tip jar
-   better interactions / response for every click, don't wait
-   maybe: make a "skip flag" to let a player bow out

###Crude notes of TODOs from playtest:

-   time out... or skip
-   quit should remove person from play - or could be perma skip
-   Show a win condition
-   Way to get back to rules
-   consider drag and drop?
-   has pointer finger for cards even when not clickable
-   starting zoom level
-   Waiting for : put bullets between names so it's clear
-   (No I love all these cards) button looks bad on iOS - takes two lines
-   Red Card - Waiting for Other Players Doesn't list who hasn't played
-   score at top?
-   red review: show Someone Else's cptions
-   maybe review the cards from the last round while waiting for judge to pick

###from JON:

-   undo card selection?
-   optimize layout for window size
-   show score?
-   show if people are waiting on you while you're picking
-   fillable text box for blank cards?
-   end condition: # of rounds, or first to X points
-   vote to boot if someone's taking too long
-   allow people to drop out
-   maybe a counter of how many times you've gone around?
-   show previous round below winner/deck card
-   Red panel pick says waiting for other players, but doesn't say who
