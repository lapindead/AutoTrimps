
function calcBaseDamageinX() {
    //baseDamage
    baseDamage = game.global.soldierCurrentAttack * (1 + (game.global.achievementBonus / 100)) * ((game.global.antiStacks * game.portal.Anticipation.level * game.portal.Anticipation.modifier) + 1) * (1 + (game.global.roboTrimpLevel * 0.2));
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.weakness !== 'undefined'){
            baseDamage *= dailyModifiers.weakness.getMult(game.global.dailyChallenge.weakness.strength, game.global.dailyChallenge.weakness.stacks);
        }
        if (typeof game.global.dailyChallenge.oddTrimpNerf !== 'undefined' && ((game.global.world % 2) == 1)){
            baseDamage *= dailyModifiers.oddTrimpNerf.getMult(game.global.dailyChallenge.oddTrimpNerf.strength);
        }
        if (typeof game.global.dailyChallenge.evenTrimpBuff !== 'undefined' && ((game.global.world % 2) == 0)){
            baseDamage *= dailyModifiers.evenTrimpBuff.getMult(game.global.dailyChallenge.evenTrimpBuff.strength);
        }
        if (typeof game.global.dailyChallenge.rampage !== 'undefined'){
            baseDamage *= dailyModifiers.rampage.getMult(game.global.dailyChallenge.rampage.strength, game.global.dailyChallenge.rampage.stacks);
        }
    }    
    //D stance
    if (game.global.formation == 2)
        baseDamage /= 4;
    else if (game.global.formation != "0")
        baseDamage *= 2;

    //baseBlock
    baseBlock = game.global.soldierCurrentBlock;
    //B stance
    if (game.global.formation == 3)
        baseBlock /= 4;
    else if (game.global.formation != "0")
        baseBlock *= 2;

    //baseHealth
    baseHealth = game.global.soldierHealthMax;
    //H stance
    if (game.global.formation == 1)
        baseHealth /= 4;
    else if (game.global.formation != "0")
        baseHealth *= 2;
    //S stance is accounted for (combination of all the above's else clauses)
        
}

function calcBaseDamageinX2() {
    //baseDamage
    baseDamage = calcOurDmg(game.global.soldierCurrentAttack,false);
    //baseBlock
    baseBlock = getBattleStats("block");
    //baseHealth
    baseHealth = getBattleStats("health");
    //stances are not needed, if you do need it, call the function with (,true)
}
//Autostance - function originally created by Belaith (in 1971)
//Automatically swap formations (stances) to avoid dying
function autoStance() {
    //get back to a baseline of no stance (X)
    calcBaseDamageinX();
    //no need to continue
    if (game.global.gridArray.length === 0) return;
    if (!getPageSetting('AutoStance')) return;
    if (!game.upgrades.Formations.done) return;

    //start analyzing autostance
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var dHealth = baseHealth/2;
    var xHealth = baseHealth;
    var bHealth = baseHealth/2;
    var enemy;
    var corrupt = game.global.world >= mutations.Corruption.start();
    if (!game.global.mapsActive && !game.global.preMapsActive) {
        enemy = getCurrentEnemy();
        var enemyFast = game.global.challengeActive == "Slow" || ((((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Nom") && game.global.challengeActive != "Coordinate"));
        var enemyHealth = enemy.health;
        var enemyDamage = enemy.attack * 1.2;
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
        //check for world Corruption
        if (enemy && enemy.mutation == "Corruption"){
            enemyHealth *= getCorruptScale("health");
            enemyDamage *= getCorruptScale("attack");
        }
        if (enemy && enemy.corrupted == 'corruptStrong') {
            enemyDamage *= 2;
        }
        if (enemy && enemy.corrupted == 'corruptTough') {
            enemyHealth *= 5;
        }
        if (enemy && game.global.challengeActive == "Nom" && typeof enemy.nomStacks !== 'undefined'){
            enemyDamage *= Math.pow(1.25, enemy.nomStacks);
        }
        if (game.global.challengeActive == 'Lead') {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        if (game.global.challengeActive == 'Watch') {
            enemyDamage *= 1.25;
        }
        var pierceMod = getPierceAmt();
        var dDamage = enemyDamage - baseBlock / 2 > enemyDamage * pierceMod ? enemyDamage - baseBlock / 2 : enemyDamage * pierceMod;
        var xDamage = enemyDamage - baseBlock > enemyDamage * pierceMod ? enemyDamage - baseBlock : enemyDamage * pierceMod;
        var bDamage = enemyDamage - baseBlock * 4 > enemyDamage * pierceMod ? enemyDamage - baseBlock * 4 : enemyDamage * pierceMod;

    } else if (game.global.mapsActive && !game.global.preMapsActive) {
        enemy = getCurrentEnemy();
        var enemyFast = game.global.challengeActive == "Slow" || ((((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Nom") || game.global.voidBuff == "doubleAttack") && game.global.challengeActive != "Coordinate");
        var enemyHealth = enemy.health;
        var enemyDamage = enemy.attack * 1.2;
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
        //check for voidmap Corruption
        if (getCurrentMapObject().location == "Void" && corrupt) {
            enemyDamage *= getCorruptScale("attack");
            enemyHealth *= getCorruptScale("health");
            //halve if magma is not active (like it was before)
            if (!mutations.Magma.active()) {
                enemyDamage /= 2;
                enemyHealth /= 2;
            }
        }
        //check for z230 magma map corruption
        else if (getCurrentMapObject().location != "Void" && mutations.Magma.active()) {
            enemyHealth *= (getCorruptScale("health") / 2);
            enemyDamage *= (getCorruptScale("attack") / 2);
        }
        if (enemy && enemy.corrupted == 'corruptStrong') {
            enemyDamage *= 2;
        }
        if (enemy && enemy.corrupted == 'corruptTough') {
            enemyHealth *= 5;
        }
        if (enemy && game.global.challengeActive == "Nom" && typeof enemy.nomStacks !== 'undefined'){
            enemyDamage *= Math.pow(1.25, enemy.nomStacks);
        }
        if (game.global.challengeActive == 'Lead') {
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        }
        if (game.global.challengeActive == 'Watch') {
            enemyDamage *= 1.25;
        }
        var dDamage = enemyDamage - baseBlock / 2 > 0 ? enemyDamage - baseBlock / 2 : 0;
        var dVoidCritDamage = enemyDamage*5 - baseBlock / 2 > 0 ? enemyDamage*5 - baseBlock / 2 : 0;
        var xDamage = enemyDamage - baseBlock > 0 ? enemyDamage - baseBlock : 0;
        var xVoidCritDamage = enemyDamage*5 - baseBlock > 0 ? enemyDamage*5 - baseBlock : 0;
        var bDamage = enemyDamage - baseBlock * 4 > 0 ? enemyDamage - baseBlock * 4 : 0;
    }

    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";

    if (game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse") {
        dDamage+= dHealth * game.global.radioStacks * 0.1;
        xDamage+= xHealth * game.global.radioStacks * 0.1;
        bDamage+= bHealth * game.global.radioStacks * 0.1;
    } else if (drainChallenge) {
        dDamage += dHealth/20;
        xDamage += xHealth/20;
        bDamage += bHealth/20;
    } else if (game.global.challengeActive == "Crushed") {
        if(dHealth > baseBlock /2)
            dDamage = enemyDamage*5 - baseBlock / 2 > 0 ? enemyDamage*5 - baseBlock / 2 : 0;
        if(xHealth > baseBlock)
            xDamage = enemyDamage*5 - baseBlock > 0 ? enemyDamage*5 - baseBlock : 0;
    }
    if (game.global.voidBuff == "bleed" || (enemy && enemy.corrupted == 'corruptBleed')) {
        dDamage += game.global.soldierHealth * 0.2;
        xDamage += game.global.soldierHealth * 0.2;
        bDamage += game.global.soldierHealth * 0.2;
    }
    baseDamage *= (game.global.titimpLeft > 0 ? 2 : 1); //consider titimp
    //double attack is OK if the buff isn't double attack, or we will survive a double attack. see main.js @ 7197-7217 https://puu.sh/ssVNP/95f699a879.png (cant prevent the 2nd hit)
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy && enemy.corrupted == 'corruptDbl');
    var doubleAttackOK = !isDoubleAttack || ((newSquadRdy && dHealth > dDamage * 2) || dHealth - missingHealth > dDamage * 2);
    //lead attack ok if challenge isn't lead, or we are going to one shot them, or we can survive the lead damage
    var leadDamage = game.challenges.Lead.stacks * 0.0003;
    var leadAttackOK = game.global.challengeActive != 'Lead' || enemyHealth < baseDamage || ((newSquadRdy && dHealth > dDamage + (dHealth * leadDamage)) || (dHealth - missingHealth > dDamage + (dHealth * leadDamage)));
    //added voidcrit.
    //voidcrit is OK if the buff isn't crit-buff, or we will survive a crit, or we are going to one-shot them (so they won't be able to crit)
    var isCritVoidMap = game.global.voidBuff == 'getCrit' || (enemy && enemy.corrupted == 'corruptCrit');
    var voidCritinDok = !isCritVoidMap || (!enemyFast ? enemyHealth < baseDamage : false) || (newSquadRdy && dHealth > dVoidCritDamage) || (dHealth - missingHealth > dVoidCritDamage);
    var voidCritinXok = !isCritVoidMap || (!enemyFast ? enemyHealth < baseDamage : false) || (newSquadRdy && xHealth > xVoidCritDamage) || (xHealth - missingHealth > xVoidCritDamage);

    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        if (!enemyFast && game.upgrades.Dominance.done && enemyHealth < baseDamage && (newSquadRdy || (dHealth - missingHealth > 0 && !drainChallenge) || (drainChallenge && dHealth - missingHealth > dHealth/20))) {
            setFormation(2);
            //use D stance if: new army is ready&waiting / can survive void-double-attack or we can one-shot / can survive lead damage / can survive void-crit-dmg
        } else if (game.upgrades.Dominance.done && ((newSquadRdy && dHealth > dDamage) || dHealth - missingHealth > dDamage) && doubleAttackOK && leadAttackOK && voidCritinDok ) {
            setFormation(2);
            //if CritVoidMap, switch out of D stance if we cant survive. Do various things.
        } else if (isCritVoidMap && !voidCritinDok) {
            //if we are already in X and the NEXT potential crit would take us past the point of being able to return to D/B, switch to B.
            if (game.global.formation == "0" && game.global.soldierHealth - xVoidCritDamage < game.global.soldierHealthMax/2){
                if (game.upgrades.Barrier.done && (newSquadRdy || (missingHealth < game.global.soldierHealthMax/2)) )
                    setFormation(3);
            }
                //else if we can totally block all crit damage in X mode, OR we can't survive-crit in D, but we can in X, switch to X.
                // NOTE: during next loop, the If-block above may immediately decide it wants to switch to B.
            else if (xVoidCritDamage == 0 || (game.global.formation == 2 && voidCritinXok)){
                setFormation("0");
            }
                //otherwise, stuff:
            else {
                if (game.global.formation == "0"){
                    if (game.upgrades.Barrier.done && (newSquadRdy || (missingHealth < game.global.soldierHealthMax/2)) )
                        setFormation(3);
                    else
                        setFormation(1);
                }
                else if (game.upgrades.Barrier.done && game.global.formation == 2)
                    setFormation(3);
            }
        } else if (game.upgrades.Formations.done && ((newSquadRdy && xHealth > xDamage) || xHealth - missingHealth > xDamage)) {
            //in lead challenge, switch to H if about to die, so doesn't just die in X mode without trying
            if ((game.global.challengeActive == 'Lead') && (xHealth - missingHealth < xDamage + (xHealth * leadDamage)))
                setFormation(1);
            else
                setFormation("0");
        } else if (game.upgrades.Barrier.done && ((newSquadRdy && bHealth > bDamage) || bHealth - missingHealth > bDamage)) {
            setFormation(3);    //does this ever run?
        } else if (game.upgrades.Formations.done) {
            setFormation(1);
        } else
            setFormation("0");
    }
    baseDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp :P
}

function autoStance2(checkOnly) {
    //get back to a baseline of no stance (X)
    calcBaseDamageinX2();
    //no need to continue
    if (game.global.gridArray.length === 0) return true;
    if (!getPageSetting('AutoStance') && !checkOnly) return true;
    if (!game.upgrades.Formations.done) return true;

    //start analyzing autostance
    var missingHealth = game.global.soldierHealthMax - game.global.soldierHealth;
    var newSquadRdy = game.resources.trimps.realMax() <= game.resources.trimps.owned + 1;
    var dHealth = baseHealth/2;
    var xHealth = baseHealth;
    var bHealth = baseHealth/2;
    //COMMON:
    var corrupt = game.global.world >= mutations.Corruption.start();
    var enemy = getCurrentEnemy();
    if (typeof enemy === 'undefined') return true;
    var enemyHealth = enemy.health;
    var enemyDamage = calcBadGuyDmg(enemy,null,true);
    //crits
    var critMulti = 1;
    var isCrushed = (game.global.challengeActive == "Crushed") && game.global.soldierHealth > game.global.soldierCurrentBlock;
        critMulti *= isCrushed ? 5 : 1;
    var isCritVoidMap = game.global.voidBuff == 'getCrit' || (enemy.corrupted == 'corruptCrit');
        critMulti *= isCritVoidMap ? 5 : 1;
    var isCritDaily = (game.global.challengeActive == "Daily") && (typeof game.global.dailyChallenge.crits !== 'undefined');
        critMulti *= isCritDaily ? dailyModifiers.crits.getMult(game.global.dailyChallenge.crits.strength) : 1;
    enemyDamage *= critMulti;
    //double attacks
    var isDoubleAttack = game.global.voidBuff == 'doubleAttack' || (enemy.corrupted == 'corruptDbl');
    //fast
    var enemyFast = (game.global.challengeActive == "Slow" || ((game.badGuys[enemy.name].fast || enemy.mutation == "Corruption") && game.global.challengeActive != "Coordinate" && game.global.challengeActive != "Nom")) || isDoubleAttack;
    //
    if (enemy.corrupted == 'corruptStrong')
        enemyDamage *= 2;
    if (enemy.corrupted == 'corruptTough')
        enemyHealth *= 5;
/*     //WORLD:
    if (!game.global.mapsActive && !game.global.preMapsActive) {
        //check for world Corruption
        if (enemy.mutation == "Corruption"){
            enemyHealth *= getCorruptScale("health");
            enemyDamage *= getCorruptScale("attack");
        }
    //MAPS:
    } else if (game.global.mapsActive && !game.global.preMapsActive) {
        //check for voidmap Corruption
        if (getCurrentMapObject().location == "Void" && corrupt) {
            enemyDamage *= getCorruptScale("attack");
            enemyHealth *= getCorruptScale("health");
            //halve if magma is not active (like it was before)
            if (!mutations.Magma.active()) {
                enemyDamage /= 2;
                enemyHealth /= 2;
            }
        }
        //check for z230 magma map corruption
        else if (getCurrentMapObject().location != "Void" && mutations.Magma.active()) {
            enemyHealth *= (getCorruptScale("health") / 2);
            enemyDamage *= (getCorruptScale("attack") / 2);
        }
    } */
    //calc X,D,B:
    var xDamage = (enemyDamage - baseBlock);
    var dDamage = (enemyDamage - baseBlock / 2);
    var bDamage = (enemyDamage - baseBlock * 4);
    var dDamageNoCrit = (enemyDamage/critMulti - baseBlock/2);
    var pierce = 0;
    if (game.global.brokenPlanet && !game.global.mapsActive) {
        pierce = getPierceAmt();    
        var atkPierce = pierce * enemyDamage;
        if (xDamage < atkPierce) xDamage = atkPierce;
        if (dDamage < atkPierce) dDamage = atkPierce;
        if (bDamage < atkPierce) bDamage = atkPierce;
        if (dDamageNoCrit < atkPierce) dDamageNoCrit = pierce * (enemyDamage/critMulti);
    }
    if (xDamage < 0) xDamage = 0;
    if (dDamage < 0) dDamage = 0;
    if (bDamage < 0) bDamage = 0;
    if (dDamageNoCrit < 0) dDamageNoCrit = 0;
    xDamage *= isDoubleAttack ? 2 : 1;
    dDamage *= isDoubleAttack ? 2 : 1;
    bDamage *= isDoubleAttack ? 2 : 1;
    dDamageNoCrit *= isDoubleAttack ? 2 : 1;

    var drainChallenge = game.global.challengeActive == 'Nom' || game.global.challengeActive == "Toxicity";
    var leadChallenge = (game.global.challengeActive == 'Lead');
    if (drainChallenge) {
        dDamage += dHealth/20;
        xDamage += xHealth/20;
        bDamage += bHealth/20;
    } else if (leadChallenge) {
        var leadDamage = game.challenges.Lead.stacks * 0.0003;
        dDamage += game.global.soldierHealth * leadDamage;
        xDamage += game.global.soldierHealth * leadDamage;
        bDamage += game.global.soldierHealth * leadDamage;
    }
    //dont attach.
    if (game.global.voidBuff == "bleed" || (enemy.corrupted == 'corruptBleed')) {
        dDamage += game.global.soldierHealth * 0.2;
        xDamage += game.global.soldierHealth * 0.2;
        bDamage += game.global.soldierHealth * 0.2;
    }
    baseDamage *= (game.global.titimpLeft > 0 ? 2 : 1); //consider titimp
    baseDamage *= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;    //consider mapbonus

    //lead attack ok if challenge isn't lead, or we are going to one shot them, or we can survive the lead damage
    var oneshotFast = (!enemyFast ? enemyHealth < baseDamage : false);
    var leadAttackOK = !leadChallenge || oneshotFast;
    var drainAttackOK = !drainChallenge || oneshotFast;
    var isCritThing = isCritVoidMap || isCritDaily || isCrushed;
    var surviveD = ((newSquadRdy && dHealth > dDamage) || (dHealth - missingHealth > dDamage));
    var surviveX = ((newSquadRdy && xHealth > xDamage) || (xHealth - missingHealth > xDamage));
    var surviveB = ((newSquadRdy && bHealth > bDamage) || (bHealth - missingHealth > bDamage));
    var voidCritinDok = !isCritThing || oneshotFast || surviveD;
    var voidCritinXok = !isCritThing || oneshotFast || surviveX;

    if (!game.global.preMapsActive && game.global.soldierHealth > 0) {
        if (checkOnly) {
            var ourCritMult = getPlayerCritChance() ? getPlayerCritDamageMult() : 1;
            var ourDmgS = (baseDamage/2)*ourCritMult;
            var surviveOneShot = enemyFast ? dHealth > dDamageNoCrit : enemyHealth < ourDmgS;
            var enoughHealth2 = surviveOneShot && leadAttackOK && drainAttackOK && voidCritinDok;
            var enoughDamage2 = enemyHealth < ourDmgS;
            baseDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp
            baseDamage /= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;    //unconsider mapbonus
            return [enoughHealth2,enoughDamage2];
        }
        //use D stance if: new army is ready&waiting / can survive void-double-attack or we can one-shot / can survive lead damage / can survive void-crit-dmg
        if (game.upgrades.Dominance.done && surviveD && leadAttackOK && drainAttackOK && (!isCritThing || voidCritinDok)) {
            setFormation(2);
        //if CritVoidMap, switch out of D stance if we cant survive. Do various things.
        } else if (isCritThing && !voidCritinDok) {
            //if we are already in X and the NEXT potential crit would take us past the point of being able to return to D/B, switch to B.
            if (game.global.formation == "0" && game.global.soldierHealth - xDamage < bHealth){
                if (game.upgrades.Barrier.done && (newSquadRdy || missingHealth < bHealth))
                    setFormation(3);
            }
            //else if we can totally block all crit damage in X mode, OR we can't survive-crit in D, but we can in X, switch to X.
            // NOTE: during next loop, the If-block above may immediately decide it wants to switch to B.
            else if (xDamage == 0 || (game.global.formation == 2 && voidCritinXok)){
                setFormation("0");
            }
            //otherwise, stuff: (Try for B again)
            else {
                if (game.global.formation == "0"){
                    if (game.upgrades.Barrier.done && (newSquadRdy || missingHealth < bHealth))
                        setFormation(3);
                    else
                        setFormation(1);
                }
                else if (game.upgrades.Barrier.done && game.global.formation == 2)
                    setFormation(3);
            }
        } else if (game.upgrades.Formations.done && surviveX) {
            //in lead challenge, switch to H if about to die, so doesn't just die in X mode without trying
            if ((game.global.challengeActive == 'Lead') && (xHealth - missingHealth < xDamage + (xHealth * leadDamage)))
                setFormation(1);
            else
                setFormation("0");
        } else if (game.upgrades.Barrier.done && surviveB) {
            if (game.global.formation != 3) {
                setFormation(3);    //does this ever run?
                debug("AutoStance B/3");
            }
        } else {
            if (game.global.formation != 1) {
                setFormation(1);    //the last thing that runs
                debug("AutoStance H/1");
            }
        }
    }
    baseDamage /= (game.global.titimpLeft > 0 ? 2 : 1); //unconsider titimp
    baseDamage /= (!game.global.mapsActive && game.global.mapBonus > 0) ? ((game.global.mapBonus * .2) + 1) : 1;    //unconsider mapbonus
    return true;
}