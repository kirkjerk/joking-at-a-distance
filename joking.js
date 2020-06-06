const joking = {};
joking.localstate = {};

document.addEventListener('DOMContentLoaded', startup);

function startup() {
    joking.username = localStorage.getItem('username');
    joking.gamename = localStorage.getItem('gamename');

    const domApp = window.app;
    domApp.innerHTML = '';

    window.topBar.innerHTML = renderCurrentGameHeader();
    if (!joking.username) {
        showUsernameEntry();
        return;
    }

    if (!joking.gamename) {
        showGameMakeOrJoin();
    } else {
        loadCurrentGamenameAndRedraw(joking.gamename);
    }
}

function quitGame() {
    joking.gamename = null;
    joking.game = null;
    localStorage.removeItem('gamename');
    stopGameChecking();
    redrawGame();
}

function renderCurrentGameHeader() {
    let buf = '';
    buf += joking.username ? ` <span class='username'>${joking.username}</span> ` : '';
    buf += joking.username && !joking.gamename ? ` (<a href='#' onclick='logout(); return false;'>logout</a>) ` : '';
    buf += joking.gamename
        ? ` | Game ${joking.gamename} (<a href='#' onclick='quitGame(); return false;'>quit game</a>)`
        : '';

    return buf;
}

function showGameMakeOrJoin() {
    window.app.innerHTML = `
        ${msg('Enter existing game code:')} 
        <input id='gamename' type="number" min="0" step="1" onkeypress="setGamenameOnEnter(event);"> <button onclick='setGamename()'>Join game</button></p>
        <h2>or <a href='#' onclick='createGame(); return false;'>Create A New Game</a></h2>
       

    `;
}
function setGamenameOnEnter(e) {
    if (e.key === 'Enter') {
        setGamename();
        return false;
    }
    return true;
}

function showUsernameEntry() {
    window.app.innerHTML = `
        ${msg('Your name:')}
        <input id='username'> <button onclick='setUsername()'>Enter name</button>
        ${renderRules()}`;
}

function setUsername() {
    joking.username = window.username.value;

    joking.username = joking.username.replace(/[^0-9a-z ]/gi, '');

    localStorage.setItem('username', joking.username);
    startup();
}

function logout() {
    delete joking.username;
    delete joking.gamename;
    localStorage.removeItem('username');
    localStorage.removeItem('gamename');
    startup();
}
function setGamename() {
    window.gamename.value = window.gamename.value.toUpperCase();
    joking.gamename = window.gamename.value;
    joinGame(joking.gamename, joking.username);
}

function defaultAjaxError(e) {
    console.log(`Error with Server ${e}`);
    window.debug.innerHTML = `Error with Server ${e}`;
    console.log(e);
}
function createGame() {
    if (!joking.username) return;
    doJsonPost('server/createGame.php', { creatorname: joking.username }, gameCreated, defaultAjaxError);
    // postData('server/createGame.php', { creatorname: joking.username }).then(gameCreated);
}
function gameCreated(data) {
    joking.gamename = data.gamename;
    localStorage.setItem('gamename', joking.gamename);
    joinGame(joking.gamename, joking.username);
}

function joinGame(gamename, username) {
    if (!gamename || !username) return;
    doJsonPost('server/joinGame.php', { gamename, username }, joinedGame, defaultAjaxError);
}

function joinedGame(data) {
    joking.game = data;
    localStorage.setItem('gamename', joking.gamename);
    joking.localstate = {};
    redrawGame();
    startGameChecking();
}

function loadCurrentGamenameAndRedraw(gamename) {
    if (!gamename) return;
    doJsonGet(`server/loadGame.php?gamename=${gamename}`, storeGameThenRender, defaultAjaxError);
}
function storeGameThenRender(game) {
    joking.game = game;
    redrawGame();
}

function redrawGame() {
    const game = typeof joking.game === 'string' ? JSON.parse(joking.game) : joking.game;

    window.topBar.innerHTML = renderCurrentGameHeader();
    window.debug.innerHTML = '';

    window.modalArea.innerHTML = joking.localstate.showModal ? renderModal() : '';

    if (!(joking.game && joking.gamename)) {
        showGameMakeOrJoin();
        return;
    }

    if (joking.lastGameState !== game.state) {
        joking.localstate = {};
    }
    joking.lastGameState = game.state;

    let buf = '';

    joking.gameversion = game.version;

    joking.cardClickHandler = null;

    switch (game.state) {
        case 'GAME_SIGNUP': {
            buf += `
                <h2>Game Code: ${game.gamename}</h2>
                ${msg('Players Currently in Game:')}
                ${renderCurrentPlayerList(game)}`;

            if (game.creatorname === joking.username) {
                buf += `<button onclick='startGame()'>Begin Game</button>`;
                buf += msg('Tell other players the game code, wait for them to join then start the game...');
            } else {
                buf += msg(
                    `<p>Waiting for players to join and then for <span class='username'>${game.creatorname}</span> 
                        to press Begin Game...</p>`
                );
            }
            buf += '<h2>Cards in your hand:</h2>';
            buf += renderPlayerDeck();
            break;
        }
        case 'NEW_ROUND': {
            buf += `NEW ROUND!`;
            break;
        }
        case 'REG_ROUND': {
            const round = game.rounds[game.rounds.length - 1];
            const { currentjudge } = round;
            if (joking.username === currentjudge) {
                buf += '<h2>You are the judge this round!</h2>';
                buf += msg(`You will pick one of your cards to be the first or second panel 
                            alongside with the deck card. Then other players will pick a final panel
                            and you will decide which one you like the best.`);
            } else {
                buf += `<h2>Waiting for current judge <span class='username'>${currentjudge}</span> to pick...</h2>`;
            }
            buf += `<h2>Deck picked this card:</h2>${renderCard(round.deckpick)}`;

            if (joking.username === currentjudge) {
                joking.cardClickHandler = handleRegJudgeCardClick;
                buf += renderRegJudgePick(round);
            } else {
                buf += `<h2>While you're waiting for <span class='username'>${currentjudge}</span> to pick, check out the cards in your hand:</h2>`;
                buf += renderPlayerDeck(true);
            }

            break;
        }
        case 'REG_PLAYERS_PICK': {
            const round = game.rounds[game.rounds.length - 1];
            const { currentjudge } = round;
            const card1 = round.judgepos === 'before' ? round.judgepick : round.deckpick;
            const card2 = round.judgepos === 'after' ? round.judgepick : round.deckpick;

            // buf += `<pre>${JSON.stringify(joking.game, null, ' ')}</pre>`;
            if (joking.username === currentjudge) {
                // joking.cardClickHandler = handleRegJudgeCardClick;
                // buf += renderRegJudgePick(round);
                buf += '<h2>Waiting for players to pick...</h2>';
                buf += renderRegPlayerSelection(card1, card2, -1);

                if (round.playerpicks) {
                    // buf += msg(`Picked already: ${Object.keys(round.playerpicks).join(' ')}`);
                    buf += msg(`Waiting for: ${renderWaitingFor(round)}`);
                }
            } else {
                if (!round.playerpicks || !round.playerpicks[joking.username]) {
                    joking.cardClickHandler = handleRegPlayerCardClick;
                    const card3 = joking.localstate.pick || -1;
                    buf += `<h2>Here is the setup from judge <span class='username'>${currentjudge}</span>:</h2>`;
                    buf += renderRegPlayerSelection(card1, card2, card3);
                    buf += `<h2>Click or tap a final panel:</h2>`;
                    buf += renderPlayerDeck(true);
                } else {
                    const card3 = round.playerpicks[joking.username];
                    buf += '<h2>Waiting for other players, here is your selection:</h2>';
                    buf += renderRegPlayerSelection(card1, card2, card3);
                    //buf += msg(`Picked already: ${Object.keys(round.playerpicks).join(' ')}`);
                    buf += msg(`Waiting for: ${renderWaitingFor(round)}`);
                }
            }

            break;
        }
        case 'REG_JUDGE_PICK': {
            const round = game.rounds[game.rounds.length - 1];
            const { currentjudge } = round;
            const card1 = round.judgepos === 'before' ? round.judgepick : round.deckpick;
            const card2 = round.judgepos === 'after' ? round.judgepick : round.deckpick;

            if (joking.username === currentjudge) {
                buf += '<h2>Time to pick!</h2>';
                buf += msg('Read each panel aloud, and click or tap which combination you like most:');
                Object.entries(round.playerpicks).map(([player, pick]) => {
                    buf += renderRegPlayerSelection(
                        card1,
                        card2,
                        pick,
                        `onclick="handleRegJudgeFinalPick('${player}')"`
                    );
                });
            } else {
                buf += '<h2>Waiting for judgement!</h2>';
                buf += msg(
                    `<span class='username'>${currentjudge}</span> should read each card and pick a favorite...`
                );

                Object.entries(round.playerpicks).map(([player, pick]) => {
                    if (player === joking.username) {
                        buf += msg('Yours:');
                    } else {
                        buf += msg(`Other player's:`);
                    }
                    buf += renderRegPlayerSelection(card1, card2, pick);
                });
            }
            break;
        }
        case 'REG_END_ROUND': {
            const round = game.rounds[game.rounds.length - 1];
            buf += `<h2>end of round!</h2>`;
            buf += msg(`<span class='username'>${round.winner}</span> is the winner and gets one point!`);

            const card1 = round.judgepos === 'before' ? round.judgepick : round.deckpick;
            const card2 = round.judgepos === 'after' ? round.judgepick : round.deckpick;
            const card3 = round.playerpicks[round.winner];

            buf += renderRegPlayerSelection(card1, card2, card3);

            if (round.nextjudge === joking.username) {
                buf += msg(`You are the next judge!`);
                buf += `<button onclick="startNextRound()">Start Next Round</button>`;
            } else {
                buf += msg(
                    `Waiting for <span class='username'>${round.nextjudge}</span> to start the next round as judge...`
                );
            }

            buf += renderScores();

            break;
        }
        case 'RED_REDRAWS': {
            const round = game.rounds[game.rounds.length - 1];
            buf += '<h2>Deck picked this card:</h2>';
            buf += renderRegPlayerSelection(-1, -1, round.deckpick);

            buf += '<h2>Red Panel Redraw!</h2>';
            buf += msg(
                'The deck has drawn a red panel! Select the cards from your hand that you want to discard and replace with fresh cards:'
            );
            joking.cardClickHandler = handleRedPlayerDiscardClick;
            buf += renderPlayerDeck(true);

            if (!round.playerdiscarded || round.playerdiscarded.indexOf(joking.username) === -1) {
                buf += `<button onclick="handleRedPlayerDiscards()">Discard selected cards</button>`;
                buf += `<button onclick="handleRedPlayerNoDiscards()">(No I love all these cards!)</button>`;
            } else {
                buf += msg('Waiting for other players to discard...');
            }

            break;
        }
        case 'RED_ROUND': {
            buf += '<h2>Red Panel Pick</h2>';

            const round = game.rounds[game.rounds.length - 1];
            const { currentjudge } = round;
            if (joking.username === currentjudge) {
                buf += '<h2>Waiting for players to pick panel 1 + 2!</h2>';
                buf += renderRegPlayerSelection(-1, -1, round.deckpick);
                buf += '<h2>Your hand:</h2>';
                buf += renderPlayerDeck(false);
            } else {
                joking.cardClickHandler = handleRedPlayerCardClick;

                if (round.playerpicks && round.playerpicks[joking.username]) {
                    const [card1, card2] = round.playerpicks[joking.username];
                    buf += renderRegPlayerSelection(card1, card2, round.deckpick);
                    buf += msg('Waiting for other players...');
                } else {
                    const firstCard = joking.localstate.pick ? joking.localstate.pick : -1;
                    buf += renderRegPlayerSelection(
                        firstCard,
                        -1,
                        round.deckpick,
                        `onclick="handleRedPlayerUndoClick()"`
                    );
                    buf += msg(
                        !joking.localstate.pick
                            ? 'You will pick the first and second panels!'
                            : '(click above to undo your selection...)'
                    );
                    buf += `<h2>${!joking.localstate.pick ? 'Pick the first panel' : 'Now pick the second panel'}</h2>`;

                    buf += renderPlayerDeck(true);
                }
            }
            break;
        }
        case 'RED_JUDGE_PICK': {
            buf += '<h2>Red Panel Judgement!</h2>';
            const round = game.rounds[game.rounds.length - 1];
            const { currentjudge } = round;

            if (joking.username === currentjudge) {
                buf += '<h2>Time to pick!</h2>';
                buf += msg('Read each panel aloud, and click or tap which comic you like the most');
                Object.entries(round.playerpicks).map(([player, [card1, card2]]) => {
                    buf += renderRegPlayerSelection(
                        card1,
                        card2,
                        round.deckpick,
                        `onclick="handleRedJudgeFinalPick('${player}')"`
                    );
                });
            } else {
                buf += '<h2>Waiting for judgement!</h2>';
                buf += msg(
                    `<span class='username'>${currentjudge}</span> should read each card and pick a favorite...`
                );
                Object.entries(round.playerpicks).map(([player, [card1, card2]]) => {
                    if (player === joking.username) {
                        buf += msg('Yours:');
                    }
                    buf += renderRegPlayerSelection(card1, card2, round.deckpick);
                });
            }
            break;
        }

        case 'RED_END_ROUND': {
            const round = game.rounds[game.rounds.length - 1];
            buf += `<h2>end of round!</h2>`;
            buf += msg(`two points to <span class='username'>${round.winner}</span>!`);

            const [card1, card2] = round.playerpicks[round.winner];

            buf += renderRegPlayerSelection(card1, card2, round.deckpick);

            buf += msg(`<span class='username'>${round.nextjudge}</span> is the next judge...`);

            if (round.nextjudge === joking.username) {
                buf += `<button onclick="startNextRound()">start next round</button>`;
            }

            buf += renderScores();

            break;
        }
    }
    const domApp = window.app;
    domApp.innerHTML = buf;
    console.log(game);

    startGameChecking();
}

function renderWaitingFor(round) {
    const undonePlayers = joking.game.players
        .filter((player) => {
            if (!round.playerpicks) return true;
            if (player.username === round.currentjudge) return false;
            return !round.playerpicks[player.username];
        })
        .map((player) => `<span class='username'>${player.username}</span>`);
    return undonePlayers.join(' ');
}

function msg(m) {
    return `<div class='msg'>${m}</div>`;
}

function renderCard(cardNum) {
    const emptyClass = cardNum == -1 ? 'placeholdercard' : 'emptycard';
    return cardNum && cardNum != -1 ? `<img src="card/${cardNum}.jpg">` : `<div class="${emptyClass}"></div>`;
}
function renderCardWithFrame(cardNum, clickable) {
    if (joking.localstate && joking.localstate.pick === cardNum) return '';
    const onclick = clickable ? `onclick="handleCardClick(${cardNum});"` : '';
    const clickableClass = clickable ? `clickable` : '';
    const clickedClass = joking.localstate.pick && cardNum === joking.localstate.pick ? 'clicked' : '';
    const discardClass = joking.localstate.discards && joking.localstate.discards.includes(cardNum) ? 'discard' : '';
    return `<div class="cardframe ${clickableClass} ${clickedClass} ${discardClass}"
                id="card${cardNum}"
                ${onclick}
                >${renderCard(cardNum)}</div>`;
}
function renderPlayerDeck(clickable = false, isClicked = false) {
    const player = getCurrentPlayerInfoFromGame();
    if (!player) return '';
    const cardbuf = player.cards.map((c) => renderCardWithFrame(c, clickable)).join(' ');
    return `<div class="playerscards ${isClicked ? 'flatten' : ''}" >${cardbuf}</div>`;
}

function handleCardClick(cardNum) {
    if (joking.cardClickHandler) joking.cardClickHandler(cardNum);
}

function renderRegJudgePick(round) {
    const cardIsPicked = Boolean(joking.localstate.pick);
    // let buf = !cardIsPicked ? '<h2>First pick a card to go with it:</h2>' : '<h2>Your selected card:</h2>';
    let buf = '';
    if (!cardIsPicked) {
        buf += '<h2>Now click or tap a card to go right before or after it:</h2>';
        buf += renderPlayerDeck(true, cardIsPicked);
    } else {
    }

    // if (cardIsPicked) buf += msg('(Click card again to undo selection)');
    buf += renderRegJudgeOrderPick(round);

    return buf;
}
function handleRegJudgeCardClick(cardNum) {
    if (joking.localstate.pick === cardNum) {
        joking.localstate.pick = null;
    } else {
        console.log(joking.localstate.pick, cardNum);
        joking.localstate.pick = cardNum;
    }
    redrawGame();
}

function handleRedPlayerDiscardClick(cardNum) {
    if (!joking.localstate.discards) joking.localstate.discards = [];
    if (!joking.localstate.discards.includes(cardNum)) {
        joking.localstate.discards.push(cardNum);
    } else {
        const index = joking.localstate.discards.indexOf(cardNum);
        joking.localstate.discards.splice(index, 1);
    }
    redrawGame();
}
function handleRedPlayerDiscards() {
    const discards = joking.localstate.discards ? joking.localstate.discards : [];
    doJsonPost(
        `server/updateRedPlayerDiscards.php`,
        { gamename: joking.gamename, username: joking.username, discards },
        (game) => {
            storeGameThenRender(game);
        },
        defaultAjaxError
    );
}
function handleRedPlayerNoDiscards() {
    const discards = [];
    doJsonPost(
        `server/updateRedPlayerDiscards.php`,
        { gamename: joking.gamename, username: joking.username, discards },
        (game) => {
            storeGameThenRender(game);
        },
        defaultAjaxError
    );
}

function handleRedPlayerCardClick(cardNum) {
    if (!joking.localstate.pick) {
        joking.localstate.pick = cardNum;
        redrawGame();
    } else {
        doJsonPost(
            `server/updateRedPlayerCard.php`,
            { gamename: joking.gamename, username: joking.username, pick1: joking.localstate.pick, pick2: cardNum },
            (game) => {
                storeGameThenRender(game);
            },
            defaultAjaxError
        );
    }
}
function handleRedPlayerUndoClick() {
    joking.localstate.pick = null;
    redrawGame();
}

function renderRegJudgeOrderPick(round) {
    if (!joking.localstate.pick) return '';
    let buf = `<h2>Now pick an order for your card and the deck's:</h2>`;
    const deckCard = round.deckpick;
    const pickedCard = joking.localstate.pick;
    buf += msg('Your card first:');
    buf += renderOrderPicker('before', pickedCard, deckCard);
    buf += msg('Or Your card second:');
    buf += renderOrderPicker('after', deckCard, pickedCard);

    return buf;
}

function renderOrderPicker(type, card1, card2) {
    return `<div onclick="handleRegJudgeOrderPick('${type}');" class="orderwrap">${renderCard(card1)}${renderCard(
        card2
    )}${renderCard(-1)}</div>`;
}
function renderRegPlayerSelection(card1, card2, card3, onclick) {
    return `<div ${onclick || ''} class="orderwrap">${renderCard(card1)}${renderCard(card2)}${renderCard(card3)}</div>`;
}
function handleRegPlayerCardClick(cardNum) {
    joking.localstate.pick = cardNum;
    doJsonPost(
        `server/updateRegPlayerCard.php`,
        { gamename: joking.gamename, username: joking.username, pick: cardNum },
        (game) => {
            storeGameThenRender(game);
        },
        defaultAjaxError
    );
    redrawGame();
}

function handleRegJudgeOrderPick(judgepos) {
    doJsonPost(
        `server/updateRegJudgeCard.php`,
        {
            gamename: joking.gamename,
            username: joking.username,
            judgepick: joking.localstate.pick,
            judgepos,
        },
        storeGameThenRender,
        defaultAjaxError
    );
}

function handleRegJudgeFinalPick(username) {
    doJsonPost(
        `server/updateRegJudgeFinal.php`,
        { gamename: joking.gamename, winner: username },
        (game) => {
            storeGameThenRender(game);
        },
        defaultAjaxError
    );
}

function handleRedJudgeFinalPick(username) {
    doJsonPost(
        `server/updateRedJudgeFinal.php`,
        { gamename: joking.gamename, winner: username },
        (game) => {
            storeGameThenRender(game);
        },
        defaultAjaxError
    );
}

function showWorking() {
    const domApp = window.app;
    domApp.innerHTML = '<h2>Working...</h2>';
}

function getCurrentPlayerInfoFromGame() {
    for (const player of joking.game.players) {
        if (player.username === joking.username) return player;
    }
    return null;
}

function renderCurrentPlayerList(game) {
    return '<ul>' + game.players.map((p) => `<li><span class='username'>${p.username}</span>`).join('') + '</ul>';
}

function stopGameChecking() {
    if (joking.interval) {
        clearInterval(joking.interval);
        joking.interval = null;
    }
}

function startGameChecking() {
    if (joking.gamename && !joking.interval) {
        joking.interval = setInterval(() => {
            doJsonGet(`server/getGameVersion.php?gamename=${joking.gamename}`, checkGameVersion, gameCheckingError);
        }, 2000);
    }
}

function checkGameVersion(data) {
    // window.debug.innerHTML = `${data.version} ${new Date().getTime()}`;
    if (data.version !== joking.game.version) {
        loadCurrentGamenameAndRedraw(joking.gamename);
    }
}

//TODO
function gameCheckingError(e) {
    console.log('ERRR', e);
}

function renderScores() {
    const scoreForPlayer = {};
    //maybe should be a reducer, too lazy to look that up
    joking.game.players.map((player) => {
        scoreForPlayer[player.username] = 0;
    });
    joking.game.rounds.map((round) => {
        scoreForPlayer[round.winner] += round.isred ? 2 : 1;
    });

    const tableRow = (player) =>
        `<tr><th><span class='username'>${player}</span></th><td>${scoreForPlayer[player]}</td></tr>`;

    const guts = Object.keys(scoreForPlayer)
        .map((player) => tableRow(player))
        .join('');

    return `<h2>Scores so far</h2><table border="1">${guts}</table>`;
}

function startGame() {
    if (!joking.gamename || !joking.username) return;
    doJsonPost(
        `server/startGame.php`,
        { gamename: joking.gamename, username: joking.username },
        (game) => {
            storeGameThenRender(game);
        },
        defaultAjaxError
    );
}
function startNextRound() {
    if (!joking.gamename || !joking.username) return;

    doJsonPost(`server/startNextRound.php`, { gamename: joking.gamename }, () => {}, defaultAjaxError);
}

function showRulesAndTipJar() {
    joking.localstate.showModal = true;
    redrawGame();
}
function hideRulesAndTipJar() {
    joking.localstate.showModal = false;
    redrawGame();
}

function renderModal() {
    return `
    <div id="myModal" class="modal-backdrop"  onclick='hideRulesAndTipJar();'>
        <div class="modal-content" onclick="event.stopPropagation();">
            <span class="close" onclick='hideRulesAndTipJar();'>&times;</span>
            ${renderRules()}
        </div>
    </div>
    `;
}

function renderRules() {
    return `<div>
<p>
This is an as yet unauthorized "social distancing" version of 
the card game <a href="http://jokinghazardgame.com/">Joking Hazard</a>. 
You should buy the original if you can find it! It is a much 
better game in person, but Zoom will do for now...
</p>
<h2>How it Works</h2>
<p>Everyone logs in to this site 
using their own device (computer, tablet, phone)-
and also joins the same video conference call.
someone creates a new game and gives the 4 letter code to the other players.
</p>
<h2>Game Play</h2>
<p>
Game play is a bit similar to "Apples to Apples" or 
"Cards Against Humanity" but making three panel comics.
<p>
Everyone starts with a hand of seven comic panel cards
The person who started the 
game will be the first judge. The deck picks the first
card, the judge then chooses a card from their to hand 
to pair with it as the first or second panel. The other players
anonymously pick a card from their hand to be the third 
panel. The judge then picks their favorite, and that player 
wins a point, and everyone's hand is refreshed with a card from 
the deck. (Players always have seven cards in their hand.)

</p>
<p>
Sometimes the deck plays a card with a red border - 
(red border cards are often hard to follow-up!)
This launches a special round where everyone gets to exchange as 
many cards from their hand as they want for new cards. Then, everyone but 
the judge picks a first and second panel with the deck's card
as a closer. The judge picks whose player's combo they like best,
and that player gets two points.
</p>

<p>Play continues until it stops. (Some prefer "first to three points wins  ")</p>
 
<h2>Tip Jar</h2>
<p>
If you dig this game, please consider hunting down a copy of the original!
</p>
<p>
Also you can toss into the tipjar: <a href='https://venmo.com/code?user_id=2272753205903360732'>venmo (@Kirk-Israel-00)</a> or 
<a href="https://www.paypal.me/kirkjerk">paypal (@kirkjerk)</a>. Profits will go to 
New Orleans' <a href="https://www.saveourbrassfoundation.com/">Save Our Brass Culture Foundation</a>.
</p>
<p>
(Mostly I just like the feedback! So you can also just email me at kirkjerk at gmail dot com.)
</p>



</div>`;
}
