MODULES["autofight"] = {};
//These can be changed (in the console) if you know what you're doing:
MODULES["autofight"].breedTimerCutoff1 = 2;
MODULES["autofight"].breedTimerCutoff2 = 0.5;

//old: Handles manual fighting automatically, in a different way.
function betterAutoFight() {
    var customVars = MODULES["autofight"];
    if (game.global.autoBattle && !game.global.pauseFight)
        pauseFight(); //Disable built-in autofight
    if (game.global.gridArray.length === 0 || game.global.preMapsActive || !game.upgrades.Battle.done) return;  //sanity check. stops error message on z1 right after portal
    var breeding = (game.resources.trimps.owned - game.resources.trimps.employed);
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var lowLevelFight = game.resources.trimps.maxSoldiers < breeding * 0.5 && breeding > game.resources.trimps.realMax() * 0.1 && game.global.world < 5;
    //Manually fight instead of using builtin auto-fight
    if (!game.global.fighting) {
        if (newSquadRdy || game.global.soldierHealth > 0 || lowLevelFight || game.global.challengeActive == 'Watch') {
            fightManual();
        }
        //Click Fight if we are dead and already have enough for our breed timer, and fighting would not add a significant amount of time
        else if (getBreedTime() < customVars.breedTimerCutoff1 && (game.global.lastBreedTime/1000) > autoTrimpSettings.GeneticistTimer.value && game.global.soldierHealth == 0)
            fightManual();
        //AutoFight will now send Trimps to fight if it takes less than 0.5 seconds to create a new group of soldiers, if we havent bred fully yet
        else if (game.resources.trimps.owned >= game.resources.trimps.realMax() || getBreedTime() <= customVars.breedTimerCutoff2)
            fightManual();
    }
}

//NEW:: 2nd algorithm for Better Auto Fight
function betterAutoFight2() {
    var customVars = MODULES["autofight"];
    if (game.global.autoBattle && !game.global.pauseFight)
        pauseFight();   //Disable built-in autofight
    if (game.global.gridArray.length === 0 || game.global.preMapsActive || !game.upgrades.Battle.done || game.global.fighting)
        return;         //sanity check.
    var breeding = (game.resources.trimps.owned - game.resources.trimps.employed);
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var adjustedMax = (game.portal.Coordinated.level) ? game.portal.Coordinated.currentSend : trimps.maxSoldiers;
    var potencyMod = getPotencyMod();
    var tps = breeding * potencyMod;
    var addTime = adjustedMax / tps;
    var lowLevelFight = game.resources.trimps.maxSoldiers < breeding * 0.5 && breeding > game.resources.trimps.realMax() * 0.1 && game.global.world < 5 && game.global.sLevel > 0;
    //Manually fight if:     //game.global.soldierHealth > 0 //just fight if we're alive,or if == 0; we're dead, and also fight :P
    if (!game.global.fighting) {
        if (game.global.soldierHealth > 0)
            battle(true); //just fight, dont speak.
        else if (newSquadRdy || lowLevelFight || game.global.challengeActive == 'Watch') {
            battle(true);
            debug("AutoFight Default: New squad ready", "other");
        }
        //Click Fight if we are dead and already have enough for our breed timer, and fighting would not add a significant amount of time
        else if (getBreedTime() < customVars.breedTimerCutoff1 && (game.global.lastBreedTime/1000) > autoTrimpSettings.GeneticistTimer.value) {
            battle(true);
            debug("AutoFight: BAF1 #1, breed &lt; " + customVars.breedTimerCutoff1 + " &amp;&amp; HiddenNextGroup &gt; GeneTimer", "other");
        }
        //AutoFight will now send Trimps to fight if it takes less than 0.5 seconds to create a new group of soldiers, if we havent bred fully yet
        else if (getBreedTime() <= customVars.breedTimerCutoff2) {
            battle(true);
            debug("AutoFight: BAF1 #2, breed &lt;= " + customVars.breedTimerCutoff2 + " s", "other");
        }
        //Click fight anyway if we are dead and stuck in a loop due to Dimensional Generator and we can get away with adding time to it.
        else if (getBreedTime(true)+addTime <= autoTrimpSettings.GeneticistTimer.value && breeding>=adjustedMax) {
            battle(true);
            debug("AutoFight: NEW: BAF2 #3, RemainingTime + ArmyAdd.Time &lt; GeneTimer", "other");
        }
        //Clicks fight anyway if we are dead and have >=31 NextGroupTimer and deal with the consequences by firing genetecists afterwards.
        else if (game.global.soldierHealth == 0 && (game.global.lastBreedTime/1000)>=31) {
            battle(true);
            debug("AutoFight: NEW: BAF2 #4, NextGroupBreedTimer went over 31 and we arent fighting.", "other");
        }
    }
}
