
$(document).ready(
    function () {
        var powers = {
            mage: [
                { name: "Alter", base_energy: 3 },
                { name: "Barrier", base_energy: 3 },
                { name: "Disorient", base_energy: 6 },
                { name: "Energy Blast", base_energy: 6 },
                { name: "Impact Attack", base_energy: 3 },
                { name: "Telekinesis", base_energy: 10 },
                { name: "Portal", base_energy: 10 }
            ],

            sorcerer: [
                { name: "Daze", base_energy: 10 },
                { name: "Delude", base_energy: 10 },
                { name: "Horrify", base_energy: 6 },
                { name: "Telepathy", base_energy: 3 },
                { name: "Torment", base_energy: 6 }
            ]
        };

        var mage_select = '<select class="powers">' +
            '<option value="-"> - </option>' +
            powers.mage.map(
                function (p, i) {
                    return '<option value="' + i + '">' + p.name + '</option>';
                }
            ).join("\n") + '</select>'
        ;

        var sorcerer_select = '<select class="powers">' +
            '<option value="-"> - </option>' +
            powers.sorcerer.map(
                function (p, i) {
                    return '<option value="' + i + '">' + p.name + '</option>';
                }
            ).join("\n") + '</select>'
        ;

        function mkrow (yarr) {
            return '<tr>' +
                yarr.map(
                    function (y) {
                        return '<td>' + y + '</td>';
                    }
                ).join("\n") +
            '</tr>';
        }

        function switch_magic_type () {
            var to = $('input[name="magic_type"]:checked').val(),
                sel = (to === 'mage') ? mage_select : sorcerer_select,
                row = mkrow([ sel, '<span class="energy-cost"> </span>' ]),
                nu_tbody = [ row, row, row, row, row ].join("\n")
            ;

            $('#powers > tbody').html(nu_tbody);
            $('.powers').change(calculon);
            $('input.intensity').change(calculon);
        }

        function calculon () {
            function range_to_energy (range) {
                return Math.ceil( Math.log2(range/10) * 3 );
            }

            function aord_to_energy (aord) {
                return Math.ceil( Math.log2(aord) * 3 );
            }

            function set_nrg (name, converter) {
                var aord = parseInt( $('#' + name).val() );

                if (isNaN(aord) || aord < 1) {
                    aord = 1;
                }

                $('#' + name + '-energy').text(
                    converter(aord)
                );
            }

            let base_energy = 0;

            $('#powers > tbody > tr').each(
                function () {
                    var p = $(this).find('.powers').val() || 0,
                        intensity = 0,
                        energy = '-',
                        type = $('input[name="magic_type"]:checked').val()
                    ;

                    if (p !== '-') {
                        energy = powers[type][p].base_energy;
                        base_energy += energy;
                    }

                    $(this).find('.energy-cost').text(energy);
                }
            );

            $('#base-energy').text(base_energy);

            var intensity = parseInt( $('#intensity').val() );

            if (isNaN(intensity) || intensity < 0) {
               intensity = 0;
            }

            $('#intensity-energy').text(intensity);

            set_nrg('range', range_to_energy);
            set_nrg('area', aord_to_energy);
            set_nrg('duration', aord_to_energy);

            const total_energy = base_energy +
               ['intensity','range','area','duration'].map(x => parseInt( $(`#${x}-energy`).text() ))
                                                      .reduce((sum, n) => sum + n)
            ;

            $('#total-energy').text(total_energy);
        }

        switch_magic_type();

        $('#intensity').change(calculon);
        $('#range').change(calculon);
        $('#area').change(calculon);
        $('#duration').change(calculon);
        $('input[name="magic_type"]').change(switch_magic_type);
    }
);

