
$(document).ready(
    function () {
        var traits = [ "brawn", "fortitude", "intellect", "intuition", "perception", "sanity", "willpower" ],
            skills = [ "archer", "artisan", "athlete", "healer", "ranger", "rogue", "scholar", "sneak", "warrior" ],
            gifts  = { longevity: 10, mage: 20, mystic: 20, sorcerer: 20, starvision: 10 },
            arms = [
                { name: "Unarmed", offense: 0, damage: 0, parry: 0, ranged: false },
                { name: "Sword & Shield", offense: 0, damage: 9, parry: 2, ranged: false },
                { name: "Sword & Dagger", offense: 1, damage: 9, parry: 1, ranged: false },
                { name: "Staff", offense: 0, damage: 6, parry: 3, ranged: false },
                { name: "Spear", offense: 0, damage: 9, parry: 2, ranged: false },
                { name: "Halberd", offense: 0, damage: 12, parry: 1, ranged: false },
                { name: "Maul", offense: 0, damage: 15, parry: 0, ranged: false },
                { name: "Bow", offense: 0, damage: 9, parry: 0, ranged: true }
            ],
            armor = [
                { name: "None", protection: 0, penalty: 0 },
                { name: "Leather", protection: 3, penalty: 1 },
                { name: "Chain", protection: 6, penalty: 3 },
                { name: "Plate", protection: 10, penalty: 5 }
            ],
            special_defs = [ "movement", "defense", "defiance", "toughness", "stability" ],
            tBase = [ 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20 ]
        ;

        function traitCost (level) {
            if (level < 1) {
                return 0;
            }

            var index = level % 10;
            var exp   = Math.floor( level / 10 );

            return( Math.pow(10,exp) * tBase[index] );
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
            ['Weapon', 'Offense', 'Damage', 'Range', 'Parry'],
            [
                [ 'Unarmed', getval('warrior-level'), getval('brawn-level'), 'melee', getval('warrior-level') + 7 ],
                [ arm_select, '-', '-', '-', '-' ],
                [ arm_select, '-', '-', '-', '-' ],
                [ arm_select, '-', '-', '-', '-' ],
                [ arm_select, '-', '-', '-', '-' ],
                [ arm_select, '-', '-', '-', '-' ]
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
            var tcost = 0, scost = 0, gcost = 0, specdefcost = 0, specatkcost = 0;

            function set_cost (x) {
                var cost = traitCost( $('#' + x + '-level').val() );
                $('#' + x + '-cost').text( cost );
                return cost;
            }

            traits.forEach(
                function (t) {
                    tcost += set_cost(t);
                }
            );

            skills.forEach(
                function (s) {
                    scost += set_cost(s);
                }
            );

            special_defs.forEach(
                function (sdef) {
                    specdefcost += set_cost(sdef);
                }
            );

            Object.keys(gifts).forEach(
                function (g) {
                    var cost = 0;

                    if ( $('#' + g).prop('checked')) {
                        var cost = gifts[g];
                    }

                    gcost += cost;

                    $('#' + g + '-cost').text(cost);
                }
            );

            $('#weapons > tr').each(
                function () {
                    var w = $(this).find('.gear-select').val() || 0,
                        off = '-',
                        dmg = '-',
                        range = '-',
                        parry = '-'
                    ;

                    if (w !== '-') {
                        var weapon = arms[parseInt(w)],
                            skill  = weapon.ranged ? 'archer' : 'warrior'
                        ;

                        off = getval(skill + '-level') + weapon.offense;
                        dmg = getval('brawn-level') + weapon.damage;
                        range = weapon.ranged ? 'missile' : 'melee';
                        parry = 7 + getval('warrior-level') + weapon.parry;
                    }

                    $(this).find('td').eq(1).text( off );
                    $(this).find('td').eq(2).text( dmg );
                    $(this).find('td').eq(3).text( range );
                    $(this).find('td').eq(4).text( parry );
                }
            );

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
                    }


                    $(this).find('td').eq(1).text( move );
                    $(this).find('td').eq(2).text( dodge );
                    $(this).find('td').eq(3).text( prot );
                }
            );

            $('#special-attacks > tbody > tr').each(
                function () {
                    var that = this;

                    function findval (v) {
                        var val = $(that).find(v).val() || 0;

                        if (val) {
                            var i = parseInt(val);

                            if (isNaN(i)) {
                                return 0;
                            }

                            return i;
                        }

                        return 0;
                    }

                    var rangeCost = findval('select.range'),
                        offense = findval('input.offense'),
                        area = findval('input.area'),
                        duration = findval('input.duration'),
                        impact = findval('input.impact'),
                        energy = findval('input.energy'),
                        horror = findval('input.horror'),
                        atkcost = rangeCost + traitCost(offense) + area + duration + traitCost(impact) + traitCost(energy) + traitCost(horror)
                    ;

                    $(this).find('.cost').text(atkcost);

                    specatkcost += atkcost;
                }
            );

            var wounds = getval('wounds');
            var shocks = getval('shocks');

            $('#trait-cost').text(tcost);
            $('#skill-cost').text(scost);
            $('#gift-cost').text(gcost);
            $('#special-def-cost').text(specdefcost);
            $('#special-atk-cost').text(specatkcost);
            $('#wounds-cost').text(wounds);
            $('#shocks-cost').text(shocks);
            $('#total-cost').text(tcost + scost + gcost + specdefcost + specatkcost + wounds + shocks + getval('fortune'));
        }

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

        special_defs.forEach(
            function (t) {
                $('#' + t + '-level').change(calculon);
            }
        );

        Object.keys(gifts).forEach(
            function (g) {
                $('#' + g).change(calculon);
            }
        );

        $('select.range').change(calculon);
        $('input.offense').change(calculon);
        $('input.area').change(calculon);
        $('input.duration').change(calculon);
        $('input.impact').change(calculon);
        $('input.energy').change(calculon);
        $('input.horror').change(calculon);
        $('.gear-select').change(calculon);
        $('#wounds').change(calculon);
        $('#shocks').change(calculon);
        $('#fortune').change(calculon);
    }
);

