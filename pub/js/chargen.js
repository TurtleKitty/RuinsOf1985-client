
$(document).ready(
    function () {
        var traits = [ "brawn", "fortitude", "intellect", "intuition", "perception", "presence", "willpower" ],
            skills = [ "archer", "artisan", "athlete", "healer", "performer", "ranger", "rogue", "scholar", "sneak", "warrior" ],
            gifts  = { longevity: 10, mage: 20, mystic: 20, sorcerer: 20, starvision: 10 },
            arms = [
                { name: "Unarmed",    type: "melee",     defense: 0, power:  0, hands: 2, throwable: false },
                { name: "Dagger",     type: "melee",     defense: 0, power:  6, hands: 1, throwable: true  },
                { name: "Hatchet",    type: "melee",     defense: 0, power:  6, hands: 1, throwable: true  },
                { name: "Javelin",    type: "melee",     defense: 0, power:  6, hands: 1, throwable: true  },
                { name: "Shield",     type: "defensive", defense: 2, power:  0, hands: 1, throwable: false },
                { name: "Axe",        type: "melee",     defense: 0, power:  9, hands: 1, throwable: false },
                { name: "Flail",      type: "melee",     defense: 0, power:  9, hands: 1, throwable: false },
                { name: "Hammer",     type: "melee",     defense: 0, power:  9, hands: 1, throwable: false },
                { name: "Mace",       type: "melee",     defense: 0, power:  9, hands: 1, throwable: false },
                { name: "Sword",      type: "melee",     defense: 0, power:  9, hands: 1, throwable: false },
                { name: "Staff",      type: "melee",     defense: 3, power:  6, hands: 2, throwable: false },
                { name: "Spear",      type: "melee",     defense: 2, power:  9, hands: 2, throwable: false },
                { name: "Halbred",    type: "melee",     defense: 1, power: 12, hands: 2, throwable: false },
                { name: "Bardiche",   type: "melee",     defense: 0, power: 15, hands: 2, throwable: false },
                { name: "Greatsword", type: "melee",     defense: 0, power: 15, hands: 2, throwable: false },
                { name: "Maul",       type: "melee",     defense: 0, power: 15, hands: 2, throwable: false },
                { name: "Bow",        type: "missile",   defense: 0, power:  9, hands: 2, throwable: false },
                { name: "Crossbow",   type: "missile",   defense: 0, power:  9, hands: 2, throwable: false },
                { name: "Sling",      type: "missile",   defense: 0, power:  9, hands: 2, throwable: false },
            ],
            armor = [
                { name: "None",    protection:  0, penalty: 0 },
                { name: "Leather", protection:  3, penalty: 1 },
                { name: "Chain",   protection:  6, penalty: 3 },
                { name: "Plate",   protection: 10, penalty: 5 }
            ],
            traitBase = [ 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20 ]
        ;

        function traitCost (level) {
            if (level < 1) {
                return 0;
            }

            var index = level % 10;
            var exp   = Math.floor( level / 10 );

            return( Math.pow(10,exp) * traitBase[index] );
        }

        function tag (t, contents) {
            return '<' + t + '>' + contents + '</' + t + '>';
        }

        function mktable (header, rows) {
            var html = tag('tr', header.map( function (h) { return tag('th', h); } ).join("")) +
                       rows.map(
                           function (r) {
                               return tag('tr', r.map( function (i) { return tag('td', i); } ).join(""));
                           }
                       ).join("\n")
            ;

            return html;
        }

        var thtml = mktable(
            ['Trait', 'Level', 'Cost'],
            traits.map(
                function (x) {
                    return [ x, '<input class="num" size="3" type="text" value="0" id="' + x + '-level">', '<span id="' + x + '-cost"> </span>' ];
                }
            )
        );

        var shtml = mktable(
            ['Skill', 'Level', 'Cost'], 
            skills.map(
                function (x) {
                    return [ x, '<input class="num" size="3" type="text" id="' + x + '-level">', '<span id="' + x + '-cost"> </span>'];
                }
            )
        );

        var ghtml = mktable(
            ['Gift', 'Has?', 'Cost'], 
            Object.keys(gifts).map(
                function (x) {
                    return [ x, '<input type="checkbox" id="' + x + '">', '<span id="' + x + '-cost"></span>'];
                }
            )
        );

        var arm_select = '<select class="gear-select">' +
            '<option value="-">-</option>' +
            arms.map(
                function (a, i) {
                    return '<option value="' + i + '">' + a.name + '</option>';
                }
            ).join("\n") +
            '</select>'
        ;

        var armor_select = '<select class="gear-select">' +
            '<option value="-">-</option>' +
            armor.map(
                function (a, i) {
                    return '<option value="' + i + '">' + a.name + '</option>';
                }
            ).join("\n") +
            '</select>'
        ;

        function getval (k) {
            var v = $('#' + k).val();

            if (v) {
                return parseInt(v);
            }

            return 0;
        }

        var whtml = mktable(
            ['Weapon', 'Type', 'Defense', 'Power', 'Hands', 'Throwable'],
            [
                [ arm_select, '-', '-', '-', '-', '-' ],
                [ arm_select, '-', '-', '-', '-', '-' ],
                [ arm_select, '-', '-', '-', '-', '-' ],
                [ arm_select, '-', '-', '-', '-', '-' ],
                [ arm_select, '-', '-', '-', '-', '-' ]
            ]
        );

        var ahtml = mktable(
            ['Armor', 'Movement', 'Dodge', 'Protection'],
            [
                [ 'None', getval('athlete-level') + 10, getval('athlete-level') + 7, getval('fortitude-level')],
                [ armor_select, '-', '-', '-' ]
            ]
        );

        $('#traits').html(thtml);
        $('#skills').html(shtml);
        $('#gifts').html(ghtml);
        $('#weapons').html(whtml);
        $('#armor').html(ahtml);

        function calculon () {
            var tcost = 0, scost = 0, gcost = 0;
            var weapons = [];
            var adventurer = [
               ['about', $('#adventurer-name').val(), $('#adventurer-desc').val()]
            ];

            traits.forEach(
                function (t) {
                    const rank = parseInt($('#' + t + '-level').val());
                    const cost = traitCost(rank);
                    $('#' + t + '-cost').text( cost );
                    tcost += cost;
                    adventurer.push([t, rank, cost]);
                }
            );

            skills.forEach(
                function (t) {
                    const rank = parseInt($('#' + t + '-level').val()) || 0;
                    const cost = traitCost(rank);
                    $('#' + t + '-cost').text( cost );
                    scost += cost;
                    adventurer.push([t, rank, cost]);
                }
            );

            let giftList = ["gifts"];

            Object.keys(gifts).forEach(
                function (g) {
                    var cost = 0;

                    if ( $('#' + g).prop('checked')) {
                        cost = gifts[g];
                        giftList.push([g, cost]);
                    }

                    gcost += cost;

                    $('#' + g + '-cost').text(cost);
                }
            );

            adventurer.push(giftList);

            $('#weapons > tr').each(
                function () {
                    var w = $(this).find('.gear-select').val() || 0;

                    if (w == '-') {
                       return;
                    }

                    var weapon = arms[parseInt(w)];
                    weapons.push(weapon); // for later calculations

                    $(this).find('td').eq(1).text( weapon.type );
                    $(this).find('td').eq(2).text( weapon.defense );
                    $(this).find('td').eq(3).text( weapon.power );
                    $(this).find('td').eq(4).text( weapon.hands );
                    $(this).find('td').eq(5).text( weapon.throwable );
                }
            );

            adventurer.push(['weapons'].concat(weapons.map(w => w.name).filter(w => w != 'Unarmed')));

            $('#armor > tr').each(
                function () {
                    var a = $(this).find('.gear-select').val() || 0,
                        move = '-',
                        dodge = '-',
                        prot = '-'
                    ;

                    if (a !== '-') {
                        var thisOne = armor[parseInt(a)],
                            athlete = getval('athlete-level'),
                            fort    = getval('fortitude-level')
                        ;

                        move  = 10 + athlete - thisOne.penalty;
                        dodge =  7 + athlete - thisOne.penalty;
                        prot  = fort + thisOne.protection;

                        if (thisOne.name !== 'None') {
                           adventurer.push(['armor', thisOne.name, move, dodge, prot]);
                        }
                    }

                    $(this).find('td').eq(1).text( move );
                    $(this).find('td').eq(2).text( dodge );
                    $(this).find('td').eq(3).text( prot );
                }
            );

            var armaments = [];

            weapons.forEach(
               function (weapon, i) {
                  var skill   = weapon.type == 'missile' ? 'archer' : 'warrior';
                  var level   = getval(skill + '-level');
                  var brawn   = getval('brawn-level');
                  var parry   = 7 + getval('warrior-level');

                  var offense = level;
                  var defense = parry + weapon.defense;
                  var damage  = brawn + weapon.power;

                  armaments.push([ weapon.name, offense, defense, damage ]);

                  if (weapon.hands == 2 || weapon.type == 'defensive') {
                     return;
                  }

                  weapons.slice(i + 1).forEach(
                     function (w2) {
                        if (w2.hands == 2) {
                           return;
                        }

                        var andName = weapon.name + ' &amp; ' + w2.name;

                        if (w2.type == 'defensive') {
                           armaments.push([andName, offense, defense + 2, damage]);
                           return;
                        }

                        armaments.push([andName, offense + 1, defense + 1, brawn + Math.max(weapon.power, w2.power)]);
                     }
                  );
               }
            );

            adventurer.push(['armaments'].concat(armaments));

            const fortune = getval('fortune');
            const total_cost = tcost + scost + gcost + fortune;

            adventurer.push(['fortune', fortune]);
            adventurer.push(['costs', tcost, scost, gcost, total_cost]);

            const cvhtml = mktable(
               ['Armaments', 'Offense', 'Parry', 'Damage'],
               armaments
            );

            $('#combat-values').html(cvhtml);
            $('#trait-cost').text(tcost);
            $('#skill-cost').text(scost);
            $('#gift-cost').text(gcost);
            $('#total-cost').text(tcost + scost + gcost + fortune);

            console.log(JSON.stringify(adventurer));
        }

        // set up events

        traits.forEach(
            function (t) {
                $('#' + t + '-level').change(calculon);
            }
        );

        skills.forEach(
            function (t) {
                $('#' + t + '-level').change(calculon);
            }
        );

        Object.keys(gifts).forEach(
            function (g) {
                $('#' + g).change(calculon);
            }
        );

        $('.gear-select').change(calculon);

        $('#fortune').change(calculon);
    }
);

